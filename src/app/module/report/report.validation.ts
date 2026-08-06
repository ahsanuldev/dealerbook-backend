import { z } from 'zod';

export const dailyReportQueryValidationSchema = z.object({
    query: z.object({
        date: z.string().optional(),
    })
});

export const ReportValidation = {
    dailyReportQueryValidationSchema,
};
