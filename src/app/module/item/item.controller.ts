import { Request, Response } from 'express';
import status from 'http-status';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { ItemService } from './item.service';

const getAllItems = catchAsync(async (req: Request, res: Response) => {
    const result = await ItemService.getAllItems(req.user!.dealerId, req.query);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Items retrieved successfully',
        meta: result.meta,
        data: result.data,
    });
});

const createItem = catchAsync(async (req: Request, res: Response) => {
    const result = await ItemService.createItem(req.user!.dealerId, req.body);

    sendResponse(res, {
        statusCode: status.CREATED,
        success: true,
        message: 'Item created successfully',
        data: result,
    });
});

const getItemById = catchAsync(async (req: Request, res: Response) => {
    const result = await ItemService.getItemById(req.user!.dealerId, req.params.id as string);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Item retrieved successfully',
        data: result,
    });
});

const updateItem = catchAsync(async (req: Request, res: Response) => {
    const result = await ItemService.updateItem(req.user!.dealerId, req.params.id as string, req.body);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Item updated successfully',
        data: result,
    });
});

const deactivateItem = catchAsync(async (req: Request, res: Response) => {
    const result = await ItemService.deactivateItem(req.user!.dealerId, req.params.id as string);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Item deactivated successfully',
        data: result,
    });
});

export const ItemController = {
    getAllItems,
    createItem,
    getItemById,
    updateItem,
    deactivateItem,
};
