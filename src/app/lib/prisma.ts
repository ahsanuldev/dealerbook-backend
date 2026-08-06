import { PrismaPg } from '@prisma/adapter-pg';
import "dotenv/config";
import { PrismaClient } from "../../generated/prisma/client";
import type { PrismaClient as PrismaClientType } from "../../generated/prisma/client/internal/class";
import { envVars } from '../config/env';

const connectionString = envVars.DATABASE_URL;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter }) as unknown as PrismaClientType;

export { prisma };
