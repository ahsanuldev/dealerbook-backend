import { z } from 'zod';
import { UserRole } from '../../../generated/prisma/client/enums';

export const createUserValidationSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
        phone: z.string().min(1, 'Phone is required'),
        email: z.string().email('Invalid email address').optional(),
        password: z.string().min(6, 'Password must be at least 6 characters').optional(),
        role: z.enum([UserRole.ADMIN, UserRole.MANAGER]).optional(),
    })
});

export const updateUserValidationSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name cannot be empty').optional(),
        phone: z.string().min(1, 'Phone cannot be empty').optional(),
        email: z.string().email('Invalid email address').optional(),
        password: z.string().min(6, 'Password must be at least 6 characters').optional(),
        status: z.boolean().optional(),
    })
});

export const UserValidation = {
    createUserValidationSchema,
    updateUserValidationSchema,
};
