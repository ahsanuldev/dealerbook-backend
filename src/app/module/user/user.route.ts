import express from 'express';
import { UserController } from './user.controller';
import { validateRequest } from '../../middleware/validateRequest';
import { UserValidation } from './user.validation';
import { checkAuth } from '../../middleware/auth';
import { UserRole } from '../../../generated/prisma/client/enums';

const router = express.Router();

// Only ADMIN can manage staff accounts
router.get('/', checkAuth(UserRole.ADMIN), UserController.getAllUsers);

router.post(
    '/',
    checkAuth(UserRole.ADMIN),
    validateRequest(UserValidation.createUserValidationSchema),
    UserController.createUser
);

router.get('/:id', checkAuth(UserRole.ADMIN), UserController.getUserById);

router.put(
    '/:id',
    checkAuth(UserRole.ADMIN),
    validateRequest(UserValidation.updateUserValidationSchema),
    UserController.updateUser
);

router.delete('/:id', checkAuth(UserRole.ADMIN), UserController.deactivateUser);

export const UserRoutes = router;
