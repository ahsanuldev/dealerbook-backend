export interface IDashboardSummary {
    totalOutstandingDues: number; // sum of currentBalance across active farmers
    activeFarmers: number;
    today: {
        transactionCount: number;
        totalPurchases: number; // goods given today
        totalPayments: number;  // money collected today
    };
}
