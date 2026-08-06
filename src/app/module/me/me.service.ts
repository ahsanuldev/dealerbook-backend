import status from 'http-status';
import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';
import { FarmerService } from '../farmer/farmer.service';
import { ILedgerQuery } from './me.interface';

// "Which farmer am I" is always resolved from the JWT's linked farmer profile —
// a farmer can never pass an ID to see someone else's ledger
const getMyLedger = async (userId: string, query: ILedgerQuery) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { farmerProfile: true }
    });

    if (!user || !user.farmerProfile) {
        throw new AppError(status.NOT_FOUND, 'No farmer profile linked to this account');
    }

    return FarmerService.getFarmerLedger(user.dealerId, user.farmerProfile.id, query);
};

export const MeService = {
    getMyLedger,
};
