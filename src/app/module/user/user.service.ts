import status from 'http-status';
import AppError from '../../errorHelpers/AppError';
import { bcryptHelper } from '../../utils/bcryptHelper';
import { prisma } from '../../lib/prisma';
import { UserRole } from '../../../generated/prisma/client/enums';
import { ICreateUserPayload, IUpdateUserPayload } from './user.interface';

// This module manages staff accounts only (ADMIN/MANAGER).
// FARMER login accounts are created through the farmer invite flow.
const STAFF_ROLES = [UserRole.ADMIN, UserRole.MANAGER];

const excludePasswordHash = (user: { passwordHash: string }) => {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

const getAllUsers = async (dealerId: string) => {
    const users = await prisma.user.findMany({
        where: {
            dealerId,
            role: { in: STAFF_ROLES },
        },
        orderBy: { createdAt: 'asc' }
    });

    return users.map(excludePasswordHash);
};

const createUser = async (dealerId: string, payload: ICreateUserPayload) => {
    // Phone must be unique within this dealer
    const existingUser = await prisma.user.findFirst({
        where: { dealerId, phone: payload.phone }
    });

    if (existingUser) {
        throw new AppError(status.CONFLICT, 'A user with this phone already exists');
    }

    const password = payload.password || '123456';
    const passwordHash = await bcryptHelper.hashPassword(password, 10);

    const user = await prisma.user.create({
        data: {
            dealerId,
            name: payload.name,
            phone: payload.phone,
            email: payload.email,
            passwordHash,
            role: payload.role || UserRole.MANAGER,
            status: true,
        }
    });

    return excludePasswordHash(user);
};

const getUserById = async (dealerId: string, userId: string) => {
    // Tenant-scoped lookup — a user from another dealer is simply "not found"
    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            dealerId,
            role: { in: STAFF_ROLES },
        }
    });

    if (!user) {
        throw new AppError(status.NOT_FOUND, 'User not found');
    }

    return excludePasswordHash(user);
};

const updateUser = async (dealerId: string, userId: string, payload: IUpdateUserPayload) => {
    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            dealerId,
            role: { in: STAFF_ROLES },
        }
    });

    if (!user) {
        throw new AppError(status.NOT_FOUND, 'User not found');
    }

    // If phone is being changed, make sure it stays unique within this dealer
    if (payload.phone && payload.phone !== user.phone) {
        const existingUser = await prisma.user.findFirst({
            where: { dealerId, phone: payload.phone }
        });

        if (existingUser) {
            throw new AppError(status.CONFLICT, 'A user with this phone already exists');
        }
    }

    const data: IUpdateUserPayload & { passwordHash?: string } = { ...payload };

    if (payload.password) {
        data.passwordHash = await bcryptHelper.hashPassword(payload.password, 10);
        delete data.password;
    }

    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data
    });

    return excludePasswordHash(updatedUser);
};

// Soft delete — deactivate the account, never hard delete
const deactivateUser = async (dealerId: string, userId: string, requesterId: string) => {
    if (userId === requesterId) {
        throw new AppError(status.BAD_REQUEST, 'You cannot deactivate your own account');
    }

    const user = await prisma.user.findFirst({
        where: {
            id: userId,
            dealerId,
            role: { in: STAFF_ROLES },
        }
    });

    if (!user) {
        throw new AppError(status.NOT_FOUND, 'User not found');
    }

    if (!user.status) {
        throw new AppError(status.BAD_REQUEST, 'This account is already inactive');
    }

    const deactivatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { status: false }
    });

    return excludePasswordHash(deactivatedUser);
};

export const UserService = {
    getAllUsers,
    createUser,
    getUserById,
    updateUser,
    deactivateUser,
};
