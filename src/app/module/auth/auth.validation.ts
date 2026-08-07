import { z } from 'zod';

export const registerValidationSchema = z.object({
    body: z.object({
        businessName: z.string().min(1, 'Business name is required'),
        ownerName: z.string().min(1, 'Owner name is required'),
        phone: z.string().min(1, 'Phone is required'),
        address: z.string().optional(),
        email: z.string().email('Invalid email address').optional(),
        password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    })
});

export const loginValidationSchema = z.object({
    body: z.object({
        phone: z.string('Phone is required'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
    })
});

export const AuthValidation = {
    registerValidationSchema,
    loginValidationSchema,
};
