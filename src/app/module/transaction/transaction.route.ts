import express from 'express';
import { TransactionController } from './transaction.controller';
import { validateRequest } from '../../middleware/validateRequest';
import { TransactionValidation } from './transaction.validation';
import { checkAuth } from '../../middleware/auth';
import { UserRole } from '../../../generated/prisma/client/enums';

const router = express.Router();

router.get(
    '/',
    checkAuth(UserRole.ADMIN, UserRole.MANAGER),
    validateRequest(TransactionValidation.transactionFilterQueryValidationSchema),
    TransactionController.getAllTransactions
);

router.post(
    '/',
    checkAuth(UserRole.ADMIN, UserRole.MANAGER),
    validateRequest(TransactionValidation.createTransactionValidationSchema),
    TransactionController.createTransaction
);

router.get(
    '/:id',
    checkAuth(UserRole.ADMIN, UserRole.MANAGER),
    TransactionController.getTransactionById
);

router.put(
    '/:id',
    checkAuth(UserRole.ADMIN, UserRole.MANAGER),
    validateRequest(TransactionValidation.updateTransactionValidationSchema),
    TransactionController.updateTransaction
);

// Deletion rules (admin vs manager same-day) are enforced in the service
router.delete(
    '/:id',
    checkAuth(UserRole.ADMIN, UserRole.MANAGER),
    TransactionController.deleteTransaction
);

export const TransactionRoutes = router;
