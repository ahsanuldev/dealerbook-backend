export interface IRegisterPayload {
    businessName: string;
    ownerName: string;
    phone: string;    // doubles as the admin's login phone
    address?: string;
    email?: string;
    password?: string; // Optional if auto-generated initially, but required for custom passwords
}

export interface ILoginPayload {
    phone: string;
    password: string;
}
