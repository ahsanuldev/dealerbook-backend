import { z } from 'zod';
import { ItemCategory } from '../../../generated/prisma/client/enums';

export const createItemValidationSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
        category: z.enum(ItemCategory),
        unit: z.string().min(1, 'Unit is required'),
        unitPrice: z.number().nonnegative('Unit price cannot be negative').optional(),
    })
});

export const updateItemValidationSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name cannot be empty').optional(),
        category: z.enum(ItemCategory).optional(),
        unit: z.string().min(1, 'Unit cannot be empty').optional(),
        unitPrice: z.number().nonnegative('Unit price cannot be negative').optional(),
    })
});

export const itemFilterQueryValidationSchema = z.object({
    query: z.object({
        search: z.string().optional(),
        category: z.enum(ItemCategory).optional(),
        status: z.enum(['true', 'false']).optional(),
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
    })
});

export const ItemValidation = {
    createItemValidationSchema,
    updateItemValidationSchema,
    itemFilterQueryValidationSchema,
};
