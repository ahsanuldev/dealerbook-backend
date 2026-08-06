import status from 'http-status';
import AppError from '../../errorHelpers/AppError';
import { prisma } from '../../lib/prisma';
import { ICreateItemPayload, IItemFilterQuery, IUpdateItemPayload } from './item.interface';

const getAllItems = async (dealerId: string, query: IItemFilterQuery) => {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { dealerId };

    if (query.status !== undefined) {
        where.status = query.status === 'true';
    }

    if (query.category) {
        where.category = query.category;
    }

    if (query.search) {
        where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
        prisma.item.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma.item.count({ where }),
    ]);

    return {
        data: items,
        meta: { page, limit, total },
    };
};

const createItem = async (dealerId: string, payload: ICreateItemPayload) => {
    const item = await prisma.item.create({
        data: {
            dealerId,
            name: payload.name,
            category: payload.category,
            unit: payload.unit,
            unitPrice: payload.unitPrice,
        }
    });

    return item;
};

const getItemById = async (dealerId: string, itemId: string) => {
    const item = await prisma.item.findFirst({
        where: { id: itemId, dealerId }
    });

    if (!item) {
        throw new AppError(status.NOT_FOUND, 'Item not found');
    }

    return item;
};

const updateItem = async (dealerId: string, itemId: string, payload: IUpdateItemPayload) => {
    const item = await prisma.item.findFirst({
        where: { id: itemId, dealerId }
    });

    if (!item) {
        throw new AppError(status.NOT_FOUND, 'Item not found');
    }

    // unitPrice here is just the default — past transaction lines keep their captured price
    const updatedItem = await prisma.item.update({
        where: { id: item.id },
        data: payload
    });

    return updatedItem;
};

// Soft delete — historical transaction_items reference this item
const deactivateItem = async (dealerId: string, itemId: string) => {
    const item = await prisma.item.findFirst({
        where: { id: itemId, dealerId }
    });

    if (!item) {
        throw new AppError(status.NOT_FOUND, 'Item not found');
    }

    if (!item.status) {
        throw new AppError(status.BAD_REQUEST, 'This item is already inactive');
    }

    const deactivatedItem = await prisma.item.update({
        where: { id: item.id },
        data: { status: false }
    });

    return deactivatedItem;
};

export const ItemService = {
    getAllItems,
    createItem,
    getItemById,
    updateItem,
    deactivateItem,
};
