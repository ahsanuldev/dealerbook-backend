import { z } from 'zod';
import { PaymentMethod, TransactionType } from '../../../generated/prisma/client/enums';

const transactionItemSchema = z.object({
    itemId: z.string().min(1, 'Item is required'),
    quantity: z.number().positive('Quantity must be greater than 0'),
    unitPrice: z.number().nonnegative('Unit price cannot be negative').optional(),
});

export const createTransactionValidationSchema = z.object({
    body: z.object({
        farmerId: z.string().min(1, 'Farmer is required'),
        type: z.enum(TransactionType),
        date: z.string().optional(),
        amount: z.number().positive('Amount must be greater than 0').optional(),
        paymentMethod: z.enum(PaymentMethod).optional(),
        notes: z.string().optional(),
        items: z.array(transactionItemSchema).min(1, 'At least one item is required').optional(),
    }).superRefine((data, ctx) => {
        if (data.type === TransactionType.PURCHASE && !data.items?.length) {
            ctx.addIssue({ code: 'custom', path: ['items'], message: 'A purchase requires at least one item' });
        }
        if (data.type === TransactionType.PAYMENT && data.amount === undefined) {
            ctx.addIssue({ code: 'custom', path: ['amount'], message: 'A payment requires an amount' });
        }
        if (data.type === TransactionType.PAYMENT && data.items?.length) {
            ctx.addIssue({ code: 'custom', path: ['items'], message: 'A payment cannot have items' });
        }
    })
});

export const updateTransactionValidationSchema = z.object({
    body: z.object({
        date: z.string().optional(),
        amount: z.number().positive('Amount must be greater than 0').optional(),
        paymentMethod: z.enum(PaymentMethod).optional(),
        notes: z.string().optional(),
        items: z.array(transactionItemSchema).min(1, 'At least one item is required').optional(),
    })
});

export const transactionFilterQueryValidationSchema = z.object({
    query: z.object({
        farmerId: z.string().optional(),
        itemId: z.string().optional(),
        type: z.enum(TransactionType).optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
    })
});

export const TransactionValidation = {
    createTransactionValidationSchema,
    updateTransactionValidationSchema,
    transactionFilterQueryValidationSchema,
};
