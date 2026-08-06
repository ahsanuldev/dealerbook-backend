export interface ICreateFarmerPayload {
    name: string;
    phone: string;
    address?: string;
}

export interface IUpdateFarmerPayload {
    name?: string;
    phone?: string;
    address?: string;
}

export interface IInviteFarmerPayload {
    phone?: string;    // login phone — defaults to the farmer's profile phone
    email?: string;
    password?: string; // defaults to '123456' if not provided
}

export interface IFarmerFilterQuery {
    search?: string;  // matches name or phone
    status?: string;  // 'true' | 'false'
    page?: number;
    limit?: number;
}

export interface ILedgerQuery {
    from?: string; // ISO date, e.g. '2026-01-01'
    to?: string;   // ISO date — inclusive of the whole day
}
