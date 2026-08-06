import { z } from 'zod';

export const registerValidationSchema = z.object({
    body: z.object({
        dealer: z.object({
            businessName: z.string(),
            ownerName: z.string(),
            phone: z.string(),
            address: z.string().optional(),
        }),
        admin: z.object({
            name: z.string(),
            phone: z.string(),
            email: z.string().email('Invalid email address').optional(),
            password: z.string().min(6, 'Password must be at least 6 characters').optional(),
        }),
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
