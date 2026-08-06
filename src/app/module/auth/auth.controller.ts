import { Request, Response } from 'express';
import status from 'http-status';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { AuthService } from './auth.service';

const register = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);

    sendResponse(res, {
        statusCode: status.CREATED,
        success: true,
        message: 'Dealer and admin registered successfully',
        data: result,
    });
});

const login = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);

    // Also set the token as an httpOnly cookie — the auth middleware
    // checks the Authorization header first, then this cookie
    res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — matches the token expiry
    });

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Logged in successfully',
        data: result,
    });
});

const logout = catchAsync(async (req: Request, res: Response) => {
    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Logged out successfully',
        data: null,
    });
});

const getMe = catchAsync(async (req: any, res: Response) => {
    const userId = req.user.userId;
    const result = await AuthService.getMe(userId);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Profile retrieved successfully',
        data: result,
    });
});

export const AuthController = {
    register,
    login,
    logout,
    getMe,
};
