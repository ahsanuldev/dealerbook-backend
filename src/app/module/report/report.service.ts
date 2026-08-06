import status from 'http-status';
import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';
import { TransactionType } from '../../../generated/prisma/client/enums';
import { IDailyReportQuery } from './report.interface';

// The digital receipt book — all transactions entered on a given day
const getDailyReport = async (dealerId: string, query: IDailyReportQuery) => {
    let date = new Date();

    if (query.date) {
        date = new Date(query.date);
        if (isNaN(date.getTime())) {
            throw new AppError(status.BAD_REQUEST, 'Invalid "date"');
        }
    }

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const transactions = await prisma.transaction.findMany({
        where: {
            dealerId,
            date: { gte: dayStart, lte: dayEnd },
        },
        include: {
            farmer: { select: { id: true, name: true } },
            items: {
                include: {
                    item: { select: { id: true, name: true, unit: true } }
                }
            },
            createdBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    });

    let totalPurchases = 0;
    let totalPayments = 0;

    for (const transaction of transactions) {
        if (transaction.type === TransactionType.PURCHASE) {
            totalPurchases += Number(transaction.amount);
        } else {
            totalPayments += Number(transaction.amount);
        }
    }

    return {
        date: dayStart.toISOString().split('T')[0],
        transactionCount: transactions.length,
        totalPurchases,
        totalPayments,
        transactions,
    };
};

// Collection priority list — active farmers sorted by outstanding balance
const getFarmersDueReport = async (dealerId: string) => {
    const farmers = await prisma.farmer.findMany({
        where: { dealerId, status: true },
        select: {
            id: true,
            name: true,
            phone: true,
            currentBalance: true,
        },
        orderBy: { currentBalance: 'desc' },
    });

    return {
        totalOutstandingDues: farmers.reduce((sum, farmer) => sum + Number(farmer.currentBalance), 0),
        farmers,
    };
};

export const ReportService = {
    getDailyReport,
    getFarmersDueReport,
};
