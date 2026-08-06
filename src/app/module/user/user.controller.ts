import { Request, Response } from 'express';
import status from 'http-status';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { UserService } from './user.service';

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.getAllUsers(req.user!.dealerId);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Users retrieved successfully',
        data: result,
    });
});

const createUser = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.createUser(req.user!.dealerId, req.body);

    sendResponse(res, {
        statusCode: status.CREATED,
        success: true,
        message: 'User created successfully',
        data: result,
    });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.getUserById(req.user!.dealerId, req.params.id as string);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'User retrieved successfully',
        data: result,
    });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.updateUser(req.user!.dealerId, req.params.id as string, req.body);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'User updated successfully',
        data: result,
    });
});

const deactivateUser = catchAsync(async (req: Request, res: Response) => {
    const result = await UserService.deactivateUser(req.user!.dealerId, req.params.id as string, req.user!.userId);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'User deactivated successfully',
        data: result,
    });
});

export const UserController = {
    getAllUsers,
    createUser,
    getUserById,
    updateUser,
    deactivateUser,
};
