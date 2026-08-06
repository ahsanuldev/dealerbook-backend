export interface IDailyReportQuery {
    date?: string; // ISO date — defaults to today
}

export interface IFarmerDueEntry {
    id: string;
    name: string;
    phone: string;
    currentBalance: number;
}
