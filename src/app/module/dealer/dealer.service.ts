import status from 'http-status';
import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';
import { IUpdateDealerPayload } from './dealer.interface';

const getDealer = async (dealerId: string) => {
    const dealer = await prisma.dealer.findUnique({
        where: { id: dealerId }
    });

    if (!dealer) {
        throw new AppError(status.NOT_FOUND, 'Dealer not found');
    }

    return dealer;
};

const updateDealer = async (dealerId: string, payload: IUpdateDealerPayload) => {
    const dealer = await prisma.dealer.findUnique({
        where: { id: dealerId }
    });

    if (!dealer) {
        throw new AppError(status.NOT_FOUND, 'Dealer not found');
    }

    // If phone is being changed, make sure no other dealer already uses it
    if (payload.phone && payload.phone !== dealer.phone) {
        const existingDealer = await prisma.dealer.findFirst({
            where: { phone: payload.phone }
        });

        if (existingDealer) {
            throw new AppError(status.CONFLICT, 'A dealer with this phone already exists');
        }
    }

    const updatedDealer = await prisma.dealer.update({
        where: { id: dealerId },
        data: payload
    });

    return updatedDealer;
};

export const DealerService = {
    getDealer,
    updateDealer,
};
