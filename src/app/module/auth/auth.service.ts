import status from 'http-status';
import AppError from '../../errorHelpers/AppError';
import { bcryptHelper } from '../../utils/bcryptHelper';
import { jwtHelper } from '../../utils/jwtHelper';
import { envVars } from '../../config/env';
import { ILoginPayload, IRegisterPayload } from './auth.interface';
import {prisma} from '../../lib/prisma';
import { UserRole } from '../../../generated/prisma/client/enums';


const register = async (payload: IRegisterPayload) => {
    // 1. Check if dealer phone exists
    const existingDealer = await prisma.dealer.findFirst({
        where: { phone: payload.dealer.phone }
    });

    if (existingDealer) {
        throw new AppError(status.CONFLICT, 'A dealer with this phone already exists');
    }

    // 2. Start transaction
    const result = await prisma.$transaction(async (tx) => {
        // Create Dealer
        const dealer = await tx.dealer.create({
            data: {
                businessName: payload.dealer.businessName,
                ownerName: payload.dealer.ownerName,
                phone: payload.dealer.phone,
                address: payload.dealer.address,
            }
        });

        const password = payload.admin.password || '123456';
        const passwordHash = await bcryptHelper.hashPassword(password, 10);

        // Create Admin User
        const adminUser = await tx.user.create({
            data: {
                dealerId: dealer.id,
                name: payload.admin.name,
                phone: payload.admin.phone,
                email: payload.admin.email,
                passwordHash,
                role: UserRole.ADMIN,
                status: true,
            }
        });

        return { dealer, adminUser };
    });

    return result;
};

const login = async (payload: ILoginPayload) => {
    // Find all users with this phone across all dealers
    // (phone is unique per dealer but not globally, so there may be multiple)
    const candidates = await prisma.user.findMany({
        where: { phone: payload.phone }
    });

    if (candidates.length === 0) {
        throw new AppError(status.UNAUTHORIZED, 'Invalid phone or password');
    }

    // Find the one whose password matches (bcrypt compare)
    let matchedUser = null;
    for (const candidate of candidates) {
        const isMatch = await bcryptHelper.comparePassword(payload.password, candidate.passwordHash);
        if (isMatch) {
            matchedUser = candidate;
            break;
        }
    }

    if (!matchedUser) {
        throw new AppError(status.UNAUTHORIZED, 'Invalid phone or password');
    }

    if (!matchedUser.status) {
        throw new AppError(status.FORBIDDEN, 'Your account is inactive. Contact your dealer admin.');
    }

    // Build JWT — dealerId comes from DB, never from request input
    const jwtPayload = {
        userId: matchedUser.id,
        dealerId: matchedUser.dealerId,
        role: matchedUser.role,
    };

    const accessToken = jwtHelper.signToken(
        jwtPayload,
        envVars.ACCESS_TOKEN_SECRET,
        (envVars.ACCESS_TOKEN_EXPIRES_IN || '7d') as any
    );

    return {
        accessToken,
        user: {
            id: matchedUser.id,
            name: matchedUser.name,
            role: matchedUser.role,
            dealerId: matchedUser.dealerId,
        }
    };
};

const getMe = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            dealer: true,
            farmerProfile: true, // Only applicable if role is FARMER
        }
    });

    if (!user) {
        throw new AppError(status.NOT_FOUND, 'User not found');
    }

    // Exclude password hash
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

export const AuthService = {
    register,
    login,
    getMe,
};
