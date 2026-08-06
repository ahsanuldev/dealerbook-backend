import { ItemCategory } from '../../../generated/prisma/client/enums';

export interface ICreateItemPayload {
    name: string;
    category: ItemCategory;
    unit: string;      // e.g. "bag", "piece", "ml", "kg"
    unitPrice?: number; // default price — actual price is captured per transaction line
}

export interface IUpdateItemPayload {
    name?: string;
    category?: ItemCategory;
    unit?: string;
    unitPrice?: number;
}

export interface IItemFilterQuery {
    search?: string;   // matches item name
    category?: ItemCategory;
    status?: string;   // 'true' | 'false'
    page?: number;
    limit?: number;
}
