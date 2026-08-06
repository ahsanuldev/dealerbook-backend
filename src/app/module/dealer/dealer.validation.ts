import { z } from 'zod';

export const updateDealerValidationSchema = z.object({
    body: z.object({
        businessName: z.string().min(1, 'Business name cannot be empty').optional(),
        ownerName: z.string().min(1, 'Owner name cannot be empty').optional(),
        phone: z.string().min(1, 'Phone cannot be empty').optional(),
        address: z.string().optional(),
    })
});

export const DealerValidation = {
    updateDealerValidationSchema,
};
