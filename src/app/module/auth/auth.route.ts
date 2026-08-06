import express from 'express';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../middleware/validateRequest';
import { AuthValidation } from './auth.validation';
import { checkAuth } from '../../middleware/auth';

const router = express.Router();

router.post(
    '/register',
    validateRequest(AuthValidation.registerValidationSchema),
    AuthController.register
);

router.post(
    '/login',
    validateRequest(AuthValidation.loginValidationSchema),
    AuthController.login
);

router.post('/logout', checkAuth(), AuthController.logout);

router.get('/me', checkAuth(), AuthController.getMe);

export const AuthRoutes = router;
