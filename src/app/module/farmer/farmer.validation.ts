import { z } from 'zod';

export const createFarmerValidationSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
        phone: z.string().min(1, 'Phone is required'),
        address: z.string().optional(),
    })
});

export const updateFarmerValidationSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name cannot be empty').optional(),
        phone: z.string().min(1, 'Phone cannot be empty').optional(),
        address: z.string().optional(),
    })
});

export const inviteFarmerValidationSchema = z.object({
    body: z.object({
        phone: z.string().min(1, 'Phone cannot be empty').optional(),
        email: z.string().email('Invalid email address').optional(),
        password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    })
});

export const farmerFilterQueryValidationSchema = z.object({
    query: z.object({
        search: z.string().optional(),
        status: z.enum(['true', 'false']).optional(),
        page: z.coerce.number().int().positive().optional(),
        limit: z.coerce.number().int().positive().max(100).optional(),
    })
});

export const ledgerQueryValidationSchema = z.object({
    query: z.object({
        from: z.string().optional(),
        to: z.string().optional(),
    })
});

export const FarmerValidation = {
    createFarmerValidationSchema,
    updateFarmerValidationSchema,
    inviteFarmerValidationSchema,
    farmerFilterQueryValidationSchema,
    ledgerQueryValidationSchema,
};
