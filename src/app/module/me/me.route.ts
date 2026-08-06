import express from 'express';
import { MeController } from './me.controller';
import { validateRequest } from '../../middleware/validateRequest';
import { ledgerQueryValidationSchema } from './me.validation';
import { checkAuth } from '../../middleware/auth';
import { UserRole } from '../../../generated/prisma/client/enums';

const router = express.Router();

// Farmer self-service — read-only, own data only
router.get(
    '/ledger',
    checkAuth(UserRole.FARMER),
    validateRequest(ledgerQueryValidationSchema),
    MeController.getMyLedger
);

export const MeRoutes = router;
