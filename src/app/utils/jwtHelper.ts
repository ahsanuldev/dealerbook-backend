import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { envVars } from '../config/env';

const signToken = (
    payload: Record<string, unknown>,
    secret: string,
    expiresIn: SignOptions['expiresIn']
): string => {
    return jwt.sign(payload, secret, { expiresIn });
};

const verifyToken = (token: string, secret: string): JwtPayload => {
    return jwt.verify(token, secret) as JwtPayload;
};

export const jwtHelper = {
    signToken,
    verifyToken,
};
