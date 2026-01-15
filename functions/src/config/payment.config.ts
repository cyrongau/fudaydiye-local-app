
export const paymentConfig = {
    premierBank: {
        baseUrl: process.env.PREMIER_BANK_URL || 'https://premierwallet.com/api',
        merchantId: process.env.PREMIER_MERCHANT_ID || 'YOUR_MERCHANT_ID',
        apiKey: process.env.PREMIER_API_KEY || 'YOUR_API_KEY',
        secret: process.env.PREMIER_SECRET || 'YOUR_SECRET'
    },
    premierWallet: {
        baseUrl: process.env.PREMIER_WALLET_URL || 'https://premierwallet.com/api/wallet', // Specific wallet endpoint
        merchantId: process.env.PREMIER_MERCHANT_ID || 'YOUR_MERCHANT_ID', // Likely same logic, but distinct config
        apiKey: process.env.PREMIER_WALLET_KEY || 'YOUR_WALLET_KEY',
    },
    waafi: {
        baseUrl: process.env.WAAFI_URL || 'https://api.waafipay.net/asm',
        merchantId: process.env.WAAFI_MERCHANT_ID || 'YOUR_MERCHANT_ID',
        apiKey: process.env.WAAFI_API_KEY || 'YOUR_API_KEY',
    },
    edahab: {
        baseUrl: process.env.EDAHAB_URL || 'https://edahab.net/api/api',
        merchantId: process.env.EDAHAB_MERCHANT_ID || 'YOUR_MERCHANT_ID',
        apiKey: process.env.EDAHAB_API_KEY || 'YOUR_API_KEY',
        secret: process.env.EDAHAB_SECRET || 'YOUR_SECRET'
    }
};
