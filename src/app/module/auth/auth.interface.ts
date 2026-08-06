export interface IRegisterPayload {
    dealer: {
        businessName: string;
        ownerName: string;
        phone: string;
        address?: string;
    };
    admin: {
        name: string;
        phone: string;
        email?: string;
        password?: string; // Optional if auto-generated initially, but required for custom passwords
    };
}

export interface ILoginPayload {
    phone: string;
    password: string;
}
