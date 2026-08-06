import { prisma } from '../../lib/prisma';
import { TransactionType } from '../../../generated/prisma/client/enums';
import { IDashboardSummary } from './dashboard.interface';

const getSummary = async (dealerId: string): Promise<IDashboardSummary> => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [duesAggregate, activeFarmers, todayByType] = await Promise.all([
        prisma.farmer.aggregate({
            where: { dealerId, status: true },
            _sum: { currentBalance: true },
        }),
        prisma.farmer.count({
            where: { dealerId, status: true },
        }),
        prisma.transaction.groupBy({
            by: ['type'],
            where: { dealerId, date: { gte: todayStart, lte: todayEnd } },
            _sum: { amount: true },
            _count: { _all: true },
        }),
    ]);

    let transactionCount = 0;
    let totalPurchases = 0;
    let totalPayments = 0;

    for (const group of todayByType) {
        transactionCount += group._count._all;
        if (group.type === TransactionType.PURCHASE) {
            totalPurchases = Number(group._sum.amount || 0);
        } else {
            totalPayments = Number(group._sum.amount || 0);
        }
    }

    return {
        totalOutstandingDues: Number(duesAggregate._sum.currentBalance || 0),
        activeFarmers,
        today: {
            transactionCount,
            totalPurchases,
            totalPayments,
        },
    };
};

export const DashboardService = {
    getSummary,
};
