import { Prisma } from '../../generated/prisma/client';
import type { PrismaClient } from '../../generated/prisma/client/internal/class';
import { AuditAction } from '../../generated/prisma/client/enums';

interface ILogAuditParams {
    dealerId: string;
    tableName: string;
    recordId: string;
    action: AuditAction;
    changedById: string;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
}

/**
 * Writes an audit log entry inside an existing DB transaction,
 * so the change and its trail always commit together.
 *
 * This replaces the "you can see the crossed-out old number in the khata"
 * transparency of the paper system.
 */
const logAudit = async (tx: Pick<PrismaClient, 'auditLog'>, params: ILogAuditParams) => {
    await tx.auditLog.create({
        data: {
            dealerId: params.dealerId,
            tableName: params.tableName,
            recordId: params.recordId,
            action: params.action,
            changedById: params.changedById,
            oldValue: params.oldValue as Prisma.InputJsonValue,
            newValue: params.newValue as Prisma.InputJsonValue,
        }
    });
};

export const auditHelper = {
    logAudit,
};
