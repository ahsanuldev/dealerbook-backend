import status from 'http-status';
import AppError from '../../errorHelpers/AppError';
import { bcryptHelper } from '../../utils/bcryptHelper';
import { prisma } from '../../lib/prisma';
import { TransactionType, UserRole } from '../../../generated/prisma/client/enums';
import {
    ICreateFarmerPayload,
    IFarmerFilterQuery,
    IInviteFarmerPayload,
    ILedgerQuery,
    IUpdateFarmerPayload,
} from './farmer.interface';

const getAllFarmers = async (dealerId: string, query: IFarmerFilterQuery) => {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { dealerId };

    if (query.status !== undefined) {
        where.status = query.status === 'true';
    }

    if (query.search) {
        where.OR = [
            { name: { contains: query.search, mode: 'insensitive' } },
            { phone: { contains: query.search } },
        ];
    }

    const [farmers, total] = await Promise.all([
        prisma.farmer.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma.farmer.count({ where }),
    ]);

    return {
        data: farmers,
        meta: { page, limit, total },
    };
};

const createFarmer = async (dealerId: string, payload: ICreateFarmerPayload) => {
    // Bare profile — no login account, balance starts at 0
    const farmer = await prisma.farmer.create({
        data: {
            dealerId,
            name: payload.name,
            phone: payload.phone,
            address: payload.address,
        }
    });

    return farmer;
};

const getFarmerById = async (dealerId: string, farmerId: string) => {
    const farmer = await prisma.farmer.findFirst({
        where: { id: farmerId, dealerId },
        include: {
            user: {
                select: { id: true, phone: true, email: true, status: true }
            }
        }
    });

    if (!farmer) {
        throw new AppError(status.NOT_FOUND, 'Farmer not found');
    }

    return farmer;
};

const updateFarmer = async (dealerId: string, farmerId: string, payload: IUpdateFarmerPayload) => {
    const farmer = await prisma.farmer.findFirst({
        where: { id: farmerId, dealerId }
    });

    if (!farmer) {
        throw new AppError(status.NOT_FOUND, 'Farmer not found');
    }

    const updatedFarmer = await prisma.farmer.update({
        where: { id: farmer.id },
        data: payload
    });

    return updatedFarmer;
};

// Soft delete — never hard delete, historical transactions reference this farmer
const deactivateFarmer = async (dealerId: string, farmerId: string, force: boolean) => {
    const farmer = await prisma.farmer.findFirst({
        where: { id: farmerId, dealerId }
    });

    if (!farmer) {
        throw new AppError(status.NOT_FOUND, 'Farmer not found');
    }

    if (!farmer.status) {
        throw new AppError(status.BAD_REQUEST, 'This farmer is already inactive');
    }

    // Warn (don't block) if the farmer still has a non-zero balance
    const balance = Number(farmer.currentBalance);
    if (balance !== 0 && !force) {
        const message = balance > 0
            ? `This farmer still has outstanding dues of ${balance}`
            : `This farmer has an advance balance of ${Math.abs(balance)} (dealer owes them)`;
        throw new AppError(status.CONFLICT, `${message}. Pass force=true to confirm deactivation.`);
    }

    const deactivatedFarmer = await prisma.farmer.update({
        where: { id: farmer.id },
        data: { status: false }
    });

    return deactivatedFarmer;
};

// Derived read view — transactions walked chronologically with a running balance
const getFarmerLedger = async (dealerId: string, farmerId: string, query: ILedgerQuery) => {
    const farmer = await prisma.farmer.findFirst({
        where: { id: farmerId, dealerId }
    });

    if (!farmer) {
        throw new AppError(status.NOT_FOUND, 'Farmer not found');
    }

    // Build date range filter, validating the inputs
    let fromDate: Date | undefined;
    let toDate: Date | undefined;

    if (query.from) {
        fromDate = new Date(query.from);
        if (isNaN(fromDate.getTime())) {
            throw new AppError(status.BAD_REQUEST, 'Invalid "from" date');
        }
    }

    if (query.to) {
        toDate = new Date(query.to);
        if (isNaN(toDate.getTime())) {
            throw new AppError(status.BAD_REQUEST, 'Invalid "to" date');
        }
        toDate.setHours(23, 59, 59, 999); // include the whole day
    }

    const dateFilter: any = {};
    if (fromDate) dateFilter.gte = fromDate;
    if (toDate) dateFilter.lte = toDate;

    // If a "from" date is set, compute the opening balance from everything before it,
    // so the running balance stays accurate inside the window
    let openingBalance = 0;
    if (fromDate) {
        const grouped = await prisma.transaction.groupBy({
            by: ['type'],
            where: {
                dealerId,
                farmerId,
                date: { lt: fromDate },
            },
            _sum: { amount: true },
        });

        for (const group of grouped) {
            const sum = Number(group._sum.amount || 0);
            openingBalance += group.type === TransactionType.PURCHASE ? sum : -sum;
        }
    }

    const transactions = await prisma.transaction.findMany({
        where: {
            dealerId,
            farmerId,
            ...(fromDate || toDate ? { date: dateFilter } : {}),
        },
        include: {
            items: {
                include: {
                    item: { select: { id: true, name: true, unit: true } }
                }
            },
            createdBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });

    // Walk the list chronologically, carrying the running balance
    let runningBalance = openingBalance;
    const entries = transactions.map((transaction) => {
        const signedAmount = transaction.type === TransactionType.PURCHASE
            ? Number(transaction.amount)
            : -Number(transaction.amount);
        runningBalance += signedAmount;

        return {
            ...transaction,
            signedAmount,
            runningBalance,
        };
    });

    return {
        farmer: {
            id: farmer.id,
            name: farmer.name,
            phone: farmer.phone,
            currentBalance: farmer.currentBalance,
        },
        openingBalance,
        closingBalance: runningBalance,
        transactions: entries,
    };
};

// Generate a login account (role = FARMER) and link it to an existing farmer profile
const inviteFarmer = async (dealerId: string, farmerId: string, payload: IInviteFarmerPayload) => {
    const farmer = await prisma.farmer.findFirst({
        where: { id: farmerId, dealerId }
    });

    if (!farmer) {
        throw new AppError(status.NOT_FOUND, 'Farmer not found');
    }

    if (farmer.userId) {
        throw new AppError(status.CONFLICT, 'This farmer already has a login account');
    }

    if (!farmer.status) {
        throw new AppError(status.BAD_REQUEST, 'Cannot invite an inactive farmer');
    }

    const loginPhone = payload.phone || farmer.phone;

    const existingUser = await prisma.user.findFirst({
        where: { dealerId, phone: loginPhone }
    });

    if (existingUser) {
        throw new AppError(status.CONFLICT, 'A user with this phone already exists');
    }

    const usingDefaultPassword = !payload.password;
    const passwordHash = await bcryptHelper.hashPassword(payload.password || '123456', 10);

    // User creation and farmer linking must succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                dealerId,
                name: farmer.name,
                phone: loginPhone,
                email: payload.email,
                passwordHash,
                role: UserRole.FARMER,
                status: true,
            }
        });

        const updatedFarmer = await tx.farmer.update({
            where: { id: farmer.id },
            data: { userId: user.id }
        });

        return { farmer: updatedFarmer, user };
    });

    const { passwordHash: _, ...userWithoutPassword } = result.user;

    return {
        farmer: result.farmer,
        user: userWithoutPassword,
        loginPhone,
        ...(usingDefaultPassword && { defaultPassword: '123456' }),
    };
};

export const FarmerService = {
    getAllFarmers,
    createFarmer,
    getFarmerById,
    updateFarmer,
    deactivateFarmer,
    getFarmerLedger,
    inviteFarmer,
};
