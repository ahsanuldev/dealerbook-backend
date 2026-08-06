import express from 'express';
import { ReportController } from './report.controller';
import { validateRequest } from '../../middleware/validateRequest';
import { ReportValidation } from './report.validation';
import { checkAuth } from '../../middleware/auth';
import { UserRole } from '../../../generated/prisma/client/enums';

const router = express.Router();

router.get(
    '/daily',
    checkAuth(UserRole.ADMIN),
    validateRequest(ReportValidation.dailyReportQueryValidationSchema),
    ReportController.getDailyReport
);

router.get(
    '/farmers-due',
    checkAuth(UserRole.ADMIN),
    ReportController.getFarmersDueReport
);

export const ReportRoutes = router;
