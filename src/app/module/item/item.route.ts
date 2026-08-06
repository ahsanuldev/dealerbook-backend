import express from 'express';
import { ItemController } from './item.controller';
import { validateRequest } from '../../middleware/validateRequest';
import { ItemValidation } from './item.validation';
import { checkAuth } from '../../middleware/auth';
import { UserRole } from '../../../generated/prisma/client/enums';

const router = express.Router();

router.get(
    '/',
    checkAuth(UserRole.ADMIN, UserRole.MANAGER),
    validateRequest(ItemValidation.itemFilterQueryValidationSchema),
    ItemController.getAllItems
);

router.post(
    '/',
    checkAuth(UserRole.ADMIN, UserRole.MANAGER),
    validateRequest(ItemValidation.createItemValidationSchema),
    ItemController.createItem
);

router.get(
    '/:id',
    checkAuth(UserRole.ADMIN, UserRole.MANAGER),
    ItemController.getItemById
);

router.put(
    '/:id',
    checkAuth(UserRole.ADMIN, UserRole.MANAGER),
    validateRequest(ItemValidation.updateItemValidationSchema),
    ItemController.updateItem
);

router.delete(
    '/:id',
    checkAuth(UserRole.ADMIN, UserRole.MANAGER),
    ItemController.deactivateItem
);

export const ItemRoutes = router;
