import { Request, Response } from 'express';
import status from 'http-status';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { DashboardService } from './dashboard.service';

const getSummary = catchAsync(async (req: Request, res: Response) => {
    const result = await DashboardService.getSummary(req.user!.dealerId);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Dashboard summary retrieved successfully',
        data: result,
    });
});

export const DashboardController = {
    getSummary,
};
