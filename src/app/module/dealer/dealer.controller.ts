import { Request, Response } from 'express';
import status from 'http-status';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { DealerService } from './dealer.service';

const getDealer = catchAsync(async (req: Request, res: Response) => {
    // dealerId always comes from the JWT, never from the request
    const result = await DealerService.getDealer(req.user!.dealerId);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Dealer profile retrieved successfully',
        data: result,
    });
});

const updateDealer = catchAsync(async (req: Request, res: Response) => {
    const result = await DealerService.updateDealer(req.user!.dealerId, req.body);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Dealer profile updated successfully',
        data: result,
    });
});

export const DealerController = {
    getDealer,
    updateDealer,
};
