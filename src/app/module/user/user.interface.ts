import { UserRole } from '../../../generated/prisma/client/enums';

export interface ICreateUserPayload {
    name: string;
    phone: string;
    email?: string;
    password?: string;
    role?: UserRole; // ADMIN or MANAGER only — defaults to MANAGER
}

export interface IUpdateUserPayload {
    name?: string;
    phone?: string;
    email?: string;
    password?: string;
    status?: boolean;
}
