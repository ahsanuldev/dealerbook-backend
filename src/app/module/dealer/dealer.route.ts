import express from 'express';
import { DealerController } from './dealer.controller';
import { validateRequest } from '../../middleware/validateRequest';
import { DealerValidation } from './dealer.validation';
import { checkAuth } from '../../middleware/auth';
import { UserRole } from '../../../generated/prisma/client/enums';

const router = express.Router();

router.get(
    '/:id',
    checkAuth(UserRole.ADMIN, UserRole.MANAGER),
    DealerController.getDealer
);

router.put(
    '/:id',
    checkAuth(UserRole.ADMIN),
    validateRequest(DealerValidation.updateDealerValidationSchema),
    DealerController.updateDealer
);

export const DealerRoutes = router;
