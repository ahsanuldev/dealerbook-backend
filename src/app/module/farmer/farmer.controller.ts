import { Request, Response } from 'express';
import status from 'http-status';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { FarmerService } from './farmer.service';

const getAllFarmers = catchAsync(async (req: Request, res: Response) => {
    const result = await FarmerService.getAllFarmers(req.user!.dealerId, req.query);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Farmers retrieved successfully',
        meta: result.meta,
        data: result.data,
    });
});

const createFarmer = catchAsync(async (req: Request, res: Response) => {
    const result = await FarmerService.createFarmer(req.user!.dealerId, req.body);

    sendResponse(res, {
        statusCode: status.CREATED,
        success: true,
        message: 'Farmer created successfully',
        data: result,
    });
});

const getFarmerById = catchAsync(async (req: Request, res: Response) => {
    const result = await FarmerService.getFarmerById(req.user!.dealerId, req.params.id as string);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Farmer retrieved successfully',
        data: result,
    });
});

const updateFarmer = catchAsync(async (req: Request, res: Response) => {
    const result = await FarmerService.updateFarmer(req.user!.dealerId, req.params.id as string, req.body);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Farmer updated successfully',
        data: result,
    });
});

const deactivateFarmer = catchAsync(async (req: Request, res: Response) => {
    const force = req.query.force === 'true';
    const result = await FarmerService.deactivateFarmer(req.user!.dealerId, req.params.id as string, force);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Farmer deactivated successfully',
        data: result,
    });
});

const getFarmerLedger = catchAsync(async (req: Request, res: Response) => {
    const result = await FarmerService.getFarmerLedger(req.user!.dealerId, req.params.id as string, req.query);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Farmer ledger retrieved successfully',
        data: result,
    });
});

const inviteFarmer = catchAsync(async (req: Request, res: Response) => {
    const result = await FarmerService.inviteFarmer(req.user!.dealerId, req.params.id as string, req.body);

    sendResponse(res, {
        statusCode: status.CREATED,
        success: true,
        message: 'Farmer invited successfully — login account created',
        data: result,
    });
});

export const FarmerController = {
    getAllFarmers,
    createFarmer,
    getFarmerById,
    updateFarmer,
    deactivateFarmer,
    getFarmerLedger,
    inviteFarmer,
};
