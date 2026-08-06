import status from 'http-status';
import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';
import { auditHelper } from '../../utils/auditHelper';
import { AuditAction, TransactionType, UserRole } from '../../../generated/prisma/client/enums';
import { JwtPayload } from '../../middleware/auth';
import {
    ICreateTransactionPayload,
    ITransactionFilterQuery,
    ITransactionItemPayload,
    IUpdateTransactionPayload,
} from './transaction.interface';

// Direction comes from type, never from the sign of the amount:
// PURCHASE increases what the farmer owes, PAYMENT decreases it
const balanceImpact = (type: TransactionType, amount: number) =>
    type === TransactionType.PURCHASE ? amount : -amount;

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const parseDate = (value: string, field: string) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
        throw new AppError(status.BAD_REQUEST, `Invalid "${field}" date`);
    }
    return date;
};

/**
 * Validates the payload items against the dealer's catalog and computes
 * prices server-side — subtotals/amounts sent from the frontend are never trusted.
 */
const resolveItemLines = async (dealerId: string, itemPayloads: ITransactionItemPayload[]) => {
    const itemIds = [...new Set(itemPayloads.map(line => line.itemId))];

    const items = await prisma.item.findMany({
        where: { id: { in: itemIds }, dealerId }
    });

    const itemMap = new Map(items.map(item => [item.id, item]));

    const lines = itemPayloads.map((line) => {
        const item = itemMap.get(line.itemId);

        if (!item) {
            throw new AppError(status.BAD_REQUEST, 'One or more items are invalid');
        }

        if (!item.status) {
            throw new AppError(status.BAD_REQUEST, `Item "${item.name}" is inactive`);
        }

        // Capture the price at time of transaction — override if provided,
        // otherwise fall back to the item's current default price
        const unitPrice = line.unitPrice ?? (item.unitPrice !== null ? Number(item.unitPrice) : undefined);

        if (unitPrice === undefined) {
            throw new AppError(status.BAD_REQUEST, `No price set for item "${item.name}"`);
        }

        return {
            itemId: item.id,
            quantity: line.quantity,
            unitPrice,
            subtotal: roundMoney(line.quantity * unitPrice),
        };
    });

    const amount = roundMoney(lines.reduce((sum, line) => sum + line.subtotal, 0));

    return { lines, amount };
};

// Flat snapshot of a transaction (with items) for audit trails
const toAuditSnapshot = (transaction: any): Record<string, unknown> => ({
    farmerId: transaction.farmerId,
    type: transaction.type,
    date: transaction.date,
    amount: Number(transaction.amount),
    paymentMethod: transaction.paymentMethod,
    notes: transaction.notes,
    items: (transaction.items || []).map((line: any) => ({
        itemId: line.itemId,
        quantity: Number(line.quantity),
        unitPrice: Number(line.unitPrice),
        subtotal: Number(line.subtotal),
    })),
});

const getAllTransactions = async (dealerId: string, query: ITransactionFilterQuery) => {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { dealerId };

    if (query.farmerId) where.farmerId = query.farmerId;
    if (query.type) where.type = query.type;
    if (query.itemId) where.items = { some: { itemId: query.itemId } };

    if (query.from || query.to) {
        where.date = {};
        if (query.from) where.date.gte = parseDate(query.from, 'from');
        if (query.to) {
            const toDate = parseDate(query.to, 'to');
            toDate.setHours(23, 59, 59, 999); // include the whole day
            where.date.lte = toDate;
        }
    }

    const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
            where,
            include: {
                farmer: { select: { id: true, name: true } },
                items: {
                    include: {
                        item: { select: { id: true, name: true, unit: true } }
                    }
                },
                createdBy: { select: { id: true, name: true, role: true } },
            },
            orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
            skip,
            take: limit,
        }),
        prisma.transaction.count({ where }),
    ]);

    return {
        data: transactions,
        meta: { page, limit, total },
    };
};

const createTransaction = async (dealerId: string, userId: string, payload: ICreateTransactionPayload) => {
    const farmer = await prisma.farmer.findFirst({
        where: { id: payload.farmerId, dealerId }
    });

    if (!farmer) {
        throw new AppError(status.NOT_FOUND, 'Farmer not found');
    }

    if (!farmer.status) {
        throw new AppError(status.BAD_REQUEST, 'Cannot add transactions to an inactive farmer');
    }

    const date = payload.date ? parseDate(payload.date, 'date') : undefined;

    // Resolve the amount server-side
    let amount: number;
    let lines: Awaited<ReturnType<typeof resolveItemLines>>['lines'] = [];

    if (payload.type === TransactionType.PURCHASE) {
        const resolved = await resolveItemLines(dealerId, payload.items!);
        lines = resolved.lines;
        amount = resolved.amount;
    } else {
        amount = payload.amount!;
    }

    // Record creation + farmer balance update + audit trail — all or nothing
    const result = await prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
            data: {
                dealerId,
                farmerId: farmer.id,
                type: payload.type,
                date,
                amount,
                paymentMethod: payload.paymentMethod,
                notes: payload.notes,
                createdById: userId,
                items: { create: lines },
            },
            include: {
                items: {
                    include: {
                        item: { select: { id: true, name: true, unit: true } }
                    }
                },
            }
        });

        await tx.farmer.update({
            where: { id: farmer.id },
            data: { currentBalance: { increment: balanceImpact(payload.type, amount) } }
        });

        await auditHelper.logAudit(tx, {
            dealerId,
            tableName: 'transactions',
            recordId: transaction.id,
            action: AuditAction.CREATE,
            changedById: userId,
            newValue: toAuditSnapshot(transaction),
        });

        return transaction;
    });

    return result;
};

const getTransactionById = async (dealerId: string, transactionId: string) => {
    const transaction = await prisma.transaction.findFirst({
        where: { id: transactionId, dealerId },
        include: {
            farmer: { select: { id: true, name: true, phone: true } },
            items: {
                include: {
                    item: { select: { id: true, name: true, unit: true } }
                }
            },
            createdBy: { select: { id: true, name: true, role: true } },
        }
    });

    if (!transaction) {
        throw new AppError(status.NOT_FOUND, 'Transaction not found');
    }

    return transaction;
};

// Editing reverses the old balance impact and reapplies the new one (the delta)
const updateTransaction = async (dealerId: string, transactionId: string, userId: string, payload: IUpdateTransactionPayload) => {
    const existing = await prisma.transaction.findFirst({
        where: { id: transactionId, dealerId },
        include: { items: true }
    });

    if (!existing) {
        throw new AppError(status.NOT_FOUND, 'Transaction not found');
    }

    const date = payload.date ? parseDate(payload.date, 'date') : undefined;

    // Compute the new amount server-side
    let newAmount = Number(existing.amount);
    let newLines: Awaited<ReturnType<typeof resolveItemLines>>['lines'] | undefined;

    if (existing.type === TransactionType.PAYMENT) {
        if (payload.items?.length) {
            throw new AppError(status.BAD_REQUEST, 'A payment cannot have items');
        }
        if (payload.amount !== undefined) {
            newAmount = payload.amount;
        }
    } else if (payload.items) {
        const resolved = await resolveItemLines(dealerId, payload.items);
        newLines = resolved.lines;
        newAmount = resolved.amount;
    }

    const delta = balanceImpact(existing.type, newAmount) - balanceImpact(existing.type, Number(existing.amount));

    const result = await prisma.$transaction(async (tx) => {
        // Replace line items if a new set was provided
        if (newLines) {
            await tx.transactionItem.deleteMany({
                where: { transactionId: existing.id }
            });
        }

        const transaction = await tx.transaction.update({
            where: { id: existing.id },
            data: {
                amount: newAmount,
                ...(date && { date }),
                ...(payload.paymentMethod !== undefined && { paymentMethod: payload.paymentMethod }),
                ...(payload.notes !== undefined && { notes: payload.notes }),
                ...(newLines && { items: { create: newLines } }),
            },
            include: {
                items: {
                    include: {
                        item: { select: { id: true, name: true, unit: true } }
                    }
                },
            }
        });

        if (delta !== 0) {
            await tx.farmer.update({
                where: { id: existing.farmerId },
                data: { currentBalance: { increment: delta } }
            });
        }

        await auditHelper.logAudit(tx, {
            dealerId,
            tableName: 'transactions',
            recordId: existing.id,
            action: AuditAction.UPDATE,
            changedById: userId,
            oldValue: toAuditSnapshot(existing),
            newValue: toAuditSnapshot(transaction),
        });

        return transaction;
    });

    return result;
};

// Deletion reverses the balance impact and keeps the full record in the audit log.
// ADMIN can delete anything; MANAGER only entries they created on the same day.
const deleteTransaction = async (dealerId: string, transactionId: string, user: JwtPayload) => {
    const existing = await prisma.transaction.findFirst({
        where: { id: transactionId, dealerId },
        include: { items: true }
    });

    if (!existing) {
        throw new AppError(status.NOT_FOUND, 'Transaction not found');
    }

    if (user.role === UserRole.MANAGER) {
        const isCreator = existing.createdById === user.userId;
        const isSameDay = existing.createdAt.toDateString() === new Date().toDateString();

        if (!isCreator || !isSameDay) {
            throw new AppError(
                status.FORBIDDEN,
                'Managers can only delete transactions they created on the same day'
            );
        }
    }

    await prisma.$transaction(async (tx) => {
        await tx.farmer.update({
            where: { id: existing.farmerId },
            data: { currentBalance: { increment: -balanceImpact(existing.type, Number(existing.amount)) } }
        });

        await auditHelper.logAudit(tx, {
            dealerId,
            tableName: 'transactions',
            recordId: existing.id,
            action: AuditAction.DELETE,
            changedById: user.userId,
            oldValue: toAuditSnapshot(existing),
        });

        await tx.transaction.delete({
            where: { id: existing.id }
        });
    });

    return null;
};

export const TransactionService = {
    getAllTransactions,
    createTransaction,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
};
