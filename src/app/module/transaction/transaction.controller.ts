import { Request, Response } from 'express';
import status from 'http-status';
import catchAsync from '../../shared/catchAsync';
import sendResponse from '../../shared/sendResponse';
import { TransactionService } from './transaction.service';

const getAllTransactions = catchAsync(async (req: Request, res: Response) => {
    const result = await TransactionService.getAllTransactions(req.user!.dealerId, req.query);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Transactions retrieved successfully',
        meta: result.meta,
        data: result.data,
    });
});

const createTransaction = catchAsync(async (req: Request, res: Response) => {
    const result = await TransactionService.createTransaction(req.user!.dealerId, req.user!.userId, req.body);

    sendResponse(res, {
        statusCode: status.CREATED,
        success: true,
        message: 'Transaction recorded successfully',
        data: result,
    });
});

const getTransactionById = catchAsync(async (req: Request, res: Response) => {
    const result = await TransactionService.getTransactionById(req.user!.dealerId, req.params.id as string);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Transaction retrieved successfully',
        data: result,
    });
});

const updateTransaction = catchAsync(async (req: Request, res: Response) => {
    const result = await TransactionService.updateTransaction(req.user!.dealerId, req.params.id as string, req.user!.userId, req.body);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Transaction updated successfully',
        data: result,
    });
});

const deleteTransaction = catchAsync(async (req: Request, res: Response) => {
    await TransactionService.deleteTransaction(req.user!.dealerId, req.params.id as string, req.user!);

    sendResponse(res, {
        statusCode: status.OK,
        success: true,
        message: 'Transaction deleted successfully',
        data: null,
    });
});

export const TransactionController = {
    getAllTransactions,
    createTransaction,
    getTransactionById,
    updateTransaction,
    deleteTransaction,
};
