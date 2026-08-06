import { PaymentMethod, TransactionType } from '../../../generated/prisma/client/enums';

export interface ITransactionItemPayload {
    itemId: string;
    quantity: number;
    unitPrice?: number; // optional override — defaults to the item's current price
}

export interface ICreateTransactionPayload {
    farmerId: string;
    type: TransactionType;
    date?: string;       // ISO date — defaults to now
    amount?: number;     // PAYMENT only — PURCHASE amount is computed server-side
    paymentMethod?: PaymentMethod;
    notes?: string;
    items?: ITransactionItemPayload[]; // PURCHASE only
}

export interface IUpdateTransactionPayload {
    date?: string;
    amount?: number;     // PAYMENT only
    paymentMethod?: PaymentMethod;
    notes?: string;
    items?: ITransactionItemPayload[]; // PURCHASE only — replaces all lines
}

export interface ITransactionFilterQuery {
    farmerId?: string;
    itemId?: string;     // transactions containing this item
    type?: TransactionType;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}
