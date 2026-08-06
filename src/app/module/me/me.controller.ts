import { Request, Response } from 'express';
import status from 'http-status';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { MeService } from './me.service';

const getMyLedger = catchAsync(async (req: Request, res: Response) => {
    const result = await MeService.getMyLedger(req.user!.userId, req.query);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Ledger retrieved successfully',
        data: result,
    });
});

export const MeController = {
    getMyLedger,
};
