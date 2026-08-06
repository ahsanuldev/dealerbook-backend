import express from 'express';
import { DashboardController } from './dashboard.controller';
import { checkAuth } from '../../middleware/auth';
import { UserRole } from '../../../generated/prisma/client/enums';

const router = express.Router();

router.get(
    '/summary',
    checkAuth(UserRole.ADMIN),
    DashboardController.getSummary
);

export const DashboardRoutes = router;
