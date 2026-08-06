import { Request, Response } from 'express';
import status from 'http-status';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { ReportService } from './report.service';

const getDailyReport = catchAsync(async (req: Request, res: Response) => {
    const result = await ReportService.getDailyReport(req.user!.dealerId, req.query);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Daily report retrieved successfully',
        data: result,
    });
});

const getFarmersDueReport = catchAsync(async (req: Request, res: Response) => {
    const result = await ReportService.getFarmersDueReport(req.user!.dealerId);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Farmers due report retrieved successfully',
        data: result,
    });
});

export const ReportController = {
    getDailyReport,
    getFarmersDueReport,
};
