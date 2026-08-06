import express from 'express';
import { FarmerController } from './farmer.controller';
import { validateRequest } from '../../middleware/validateRequest';
import { FarmerValidation } from './farmer.validation';
import { checkAuth } from '../../middleware/auth';
import { UserRole } from '../../../generated/prisma/client/enums';

const router = express.Router();

router.get(
    '/',
    checkAuth(UserRole.ADMIN, UserRole.MANAGER),
    validateRequest(FarmerValidation.farmerFilterQueryValidationSchema),
    FarmerController.getAllFarmers
);

router.post(
    '/',
    checkAuth(UserRole.ADMIN, UserRole.MANAGER),
    validateRequest(FarmerValidation.createFarmerValidationSchema),
    FarmerController.createFarmer
);

router.get(
    '/:id',
    checkAuth(UserRole.ADMIN, UserRole.MANAGER),
    FarmerController.getFarmerById
);

router.put(
    '/:id',
    checkAuth(UserRole.ADMIN, UserRole.MANAGER),
    validateRequest(FarmerValidation.updateFarmerValidationSchema),
    FarmerController.updateFarmer
);

router.delete(
    '/:id',
    checkAuth(UserRole.ADMIN, UserRole.MANAGER),
    FarmerController.deactivateFarmer
);

router.get(
    '/:id/ledger',
    checkAuth(UserRole.ADMIN, UserRole.MANAGER),
    validateRequest(FarmerValidation.ledgerQueryValidationSchema),
    FarmerController.getFarmerLedger
);

// Invite creates a login account — ADMIN only, same as user management
router.post(
    '/:id/invite',
    checkAuth(UserRole.ADMIN),
    validateRequest(FarmerValidation.inviteFarmerValidationSchema),
    FarmerController.inviteFarmer
);

export const FarmerRoutes = router;
