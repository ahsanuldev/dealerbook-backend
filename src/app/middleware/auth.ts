import { NextFunction, Request, Response } from 'express';
import status from 'http-status';
import jwt from 'jsonwebtoken';
import AppError from '../errorHelpers/AppError';
import { envVars } from '../config/env';
import { UserRole } from '../../generated/prisma/client/enums';

export interface JwtPayload {
    userId: string;
    dealerId: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}

// Extend Express Request to carry decoded user info
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

const extractToken = (req: Request): string | null => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    return req.cookies?.accessToken ?? null;
};

/**
 * checkAuth(...roles)
 *
 * Usage:
 *   router.get('/admin-only', checkAuth(UserRole.ADMIN), handler)
 *   router.get('/admin-or-manager', checkAuth(UserRole.ADMIN, UserRole.MANAGER), handler)
 *   router.get('/any-logged-in', checkAuth(), handler)
 */
export const checkAuth = (...authRoles: UserRole[]) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = extractToken(req);

            if (!token) {
                throw new AppError(status.UNAUTHORIZED, 'Unauthorized: No token provided');
            }

            let decoded: JwtPayload;
            try {
                decoded = jwt.verify(token, envVars.ACCESS_TOKEN_SECRET) as JwtPayload;
            } catch {
                throw new AppError(status.UNAUTHORIZED, 'Unauthorized: Invalid or expired token');
            }

            req.user = decoded;

            // Role enforcement — skip if no roles specified (any authenticated user passes)
            if (authRoles.length > 0 && !authRoles.includes(decoded.role)) {
                throw new AppError(
                    status.FORBIDDEN,
                    'Forbidden: You do not have permission to access this resource'
                );
            }

            next();
        } catch (error) {
            next(error);
        }
    };

/**
 * parseUser
 *
 * Soft variant — populates req.user if a valid token is present,
 * but does NOT block unauthenticated requests. Useful for optional-auth routes.
 */
export const parseUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = extractToken(req);
        if (!token) return next();

        const decoded = jwt.verify(token, envVars.ACCESS_TOKEN_SECRET) as JwtPayload;
        req.user = decoded;
    } catch {
        // Silently ignore — guest access is fine
    }
    next();
};

// Keep backward compat alias so existing route files don't break
export const verifyToken = checkAuth();
