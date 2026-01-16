import { api } from '../../services/api';

export const walletService = {
    async getBalance(userId: string) {
        // userId might not be needed if using Auth Interceptor, but API takes it for now via query or path?
        // FinanceController.getBalance takes @Query('userId')
        const response = await api.get(`/finance/balance?userId=${userId}`);
        return response.data;
    },

    async deposit(userId: string, amount: number, method: string) {
        const response = await api.post('/finance/transaction', {
            userId,
            type: 'DEPOSIT',
            amount,
            description: `Top-up via ${method}`,
            referenceId: `TOP-${Date.now()}`
        });
        return response.data;
    },

    async requestPayout(userId: string, amount: number, method: 'MOBILE_MONEY' | 'BANK', accountNumber: string) {
        const response = await api.post('/finance/payout/request', {
            userId,
            amount,
            method,
            accountNumber
        });
        return response.data;
    }
};
