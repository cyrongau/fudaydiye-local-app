"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentFactory = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const payment_config_1 = require("../../config/payment.config");
// ==========================================
// 1. Telco Provider (Waafi / Telesom API)
// ==========================================
class TelcoProvider {
    constructor() {
        this.logger = new common_1.Logger('TelcoProvider');
    }
    async initiate(request) {
        var _a, _b, _c;
        this.logger.log(`[Waafi] Initiating payment for ${(_a = request.paymentDetails) === null || _a === void 0 ? void 0 : _a.mobile}`);
        try {
            const payload = {
                schemaVersion: "1.0",
                requestId: `req_${Date.now()}`,
                timestamp: Date.now(),
                channelName: "WEB",
                serviceName: "API_PURCHASE",
                serviceParams: {
                    merchantUid: payment_config_1.paymentConfig.waafi.merchantId,
                    apiUserId: payment_config_1.paymentConfig.waafi.apiKey,
                    apiKey: payment_config_1.paymentConfig.waafi.apiKey,
                    paymentMethod: "MWALLET_ACCOUNT",
                    payerInfo: {
                        accountNo: (_b = request.paymentDetails) === null || _b === void 0 ? void 0 : _b.mobile // e.g. 25261xxxx
                    },
                    transactionInfo: {
                        referenceId: request.orderId,
                        invoiceId: request.orderId,
                        amount: request.amount,
                        currency: "USD",
                        description: `Order #${request.orderId}`
                    }
                }
            };
            // REAL API CALL
            const response = await axios_1.default.post(payment_config_1.paymentConfig.waafi.baseUrl, payload, {
                timeout: 10000
            });
            // Assuming standard response structure
            const data = response.data;
            if (data.responseCode === "2001" || data.errorCode === "0") {
                return {
                    success: true,
                    status: 'PENDING',
                    transactionId: ((_c = data.params) === null || _c === void 0 ? void 0 : _c.transactionId) || `tx_${Date.now()}`,
                    message: "Payment push sent. Please enter PIN.",
                    gatewayMetadata: data
                };
            }
            else {
                throw new Error(data.responseMsg || "Payment failed");
            }
        }
        catch (error) {
            this.logger.error(`[Waafi] Error: ${error.message}`);
            // Fallback for Development (Mock if config invalid)
            if (process.env.NODE_ENV !== 'production' && payment_config_1.paymentConfig.waafi.apiKey === 'YOUR_API_KEY') {
                return {
                    success: true,
                    status: 'PENDING',
                    transactionId: `mock_waafi_${Date.now()}`,
                    message: "MOCK: Payment push sent."
                };
            }
            return {
                success: false,
                status: 'FAILED',
                message: error.message || "Gateway Error"
            };
        }
    }
}
// ==========================================
// 2. Premier Bank Provider (Card / Gateway)
// ==========================================
class PremierBankProvider {
    constructor() {
        this.logger = new common_1.Logger('PremierBankProvider');
    }
    async initiate(request) {
        var _a, _b;
        this.logger.log(`[PremierBank] charging card for order ${request.orderId}`);
        try {
            // Standard Gateway JSON Payload
            const payload = {
                merchantId: payment_config_1.paymentConfig.premierBank.merchantId,
                amount: request.amount,
                currency: request.currency || 'USD',
                order: {
                    id: request.orderId,
                    description: "Fudaydiye Commerce Order"
                },
                sourceOfFunds: {
                    type: "CARD",
                    provided: {
                        card: (_a = request.paymentDetails) === null || _a === void 0 ? void 0 : _a.card // In secure env only
                    }
                }
            };
            // In real PCI-DSS setup, we used tokenized ID, not raw card. 
            // This is a simplified example assuming server-to-server auth.
            const auth = Buffer.from(`${payment_config_1.paymentConfig.premierBank.apiKey}:${payment_config_1.paymentConfig.premierBank.secret}`).toString('base64');
            const response = await axios_1.default.post(`${payment_config_1.paymentConfig.premierBank.baseUrl}/pay`, payload, {
                headers: { 'Authorization': `Basic ${auth}` },
                timeout: 15000
            });
            const data = response.data;
            return {
                success: true,
                status: 'COMPLETED',
                transactionId: (_b = data.transaction) === null || _b === void 0 ? void 0 : _b.id,
                message: "Payment approved",
                gatewayMetadata: data
            };
        }
        catch (error) {
            this.logger.error(`[PremierBank] Error: ${error.message}`);
            // Fallback for Development
            if (process.env.NODE_ENV !== 'production' && payment_config_1.paymentConfig.premierBank.apiKey === 'YOUR_API_KEY') {
                return {
                    success: true,
                    status: 'COMPLETED',
                    transactionId: `mock_premier_${Date.now()}`,
                    message: "MOCK: Card Approved."
                };
            }
            return {
                success: false,
                status: 'FAILED',
                message: "Card Declined or Gateway Error"
            };
        }
    }
}
// ==========================================
// 3. Edahab Provider (Somtel)
// ==========================================
class EdahabProvider {
    constructor() {
        this.logger = new common_1.Logger('EdahabProvider');
    }
    async initiate(request) {
        var _a, _b;
        this.logger.log(`[Edahab] Initiating payment for ${(_a = request.paymentDetails) === null || _a === void 0 ? void 0 : _a.mobile}`);
        try {
            // Edahab JSON Payload Structure Matches their API
            const payload = {
                apiKey: payment_config_1.paymentConfig.edahab.apiKey,
                edahabNumber: (_b = request.paymentDetails) === null || _b === void 0 ? void 0 : _b.mobile,
                amount: request.amount,
                currency: request.currency || 'USD',
                agentCode: payment_config_1.paymentConfig.edahab.merchantId,
                description: `Order ${request.orderId}`,
                returnUrl: `https://fudaydiye.com/callback/edahab/${request.orderId}`
            };
            // REAL API CALL
            const response = await axios_1.default.post(`${payment_config_1.paymentConfig.edahab.baseUrl}/issueinvoice`, payload, {
                timeout: 10000
            });
            const data = response.data;
            if (data.InvoiceId) {
                return {
                    success: true,
                    status: 'PENDING',
                    transactionId: data.InvoiceId,
                    message: "Edahab prompt sent.",
                    gatewayMetadata: data
                };
            }
            else {
                throw new Error(data.ValidationErrors || "Edahab Failed");
            }
        }
        catch (error) {
            this.logger.error(`[Edahab] Error: ${error.message}`);
            // Fallback
            if (process.env.NODE_ENV !== 'production' && payment_config_1.paymentConfig.edahab.apiKey === 'YOUR_API_KEY') {
                return {
                    success: true,
                    status: 'PENDING',
                    transactionId: `mock_edahab_${Date.now()}`,
                    message: "MOCK: Edahab Prompt Sent."
                };
            }
            return {
                success: false,
                status: 'FAILED',
                message: error.message || "Gateway Error"
            };
        }
    }
}
// ==========================================
// 4. Premier Wallet Provider
// ==========================================
class PremierWalletProvider {
    constructor() {
        this.logger = new common_1.Logger('PremierWalletProvider');
    }
    async initiate(request) {
        var _a, _b;
        this.logger.log(`[PremierWallet] Initiating wallet charge for ${(_a = request.paymentDetails) === null || _a === void 0 ? void 0 : _a.mobile}`);
        try {
            const payload = {
                merchantId: payment_config_1.paymentConfig.premierWallet.merchantId,
                walletId: (_b = request.paymentDetails) === null || _b === void 0 ? void 0 : _b.mobile,
                amount: request.amount,
                currency: request.currency || 'USD',
                refId: request.orderId
            };
            const response = await axios_1.default.post(`${payment_config_1.paymentConfig.premierWallet.baseUrl}/charge`, payload, {
                headers: { 'Authorization': `Bearer ${payment_config_1.paymentConfig.premierWallet.apiKey}` },
                timeout: 10000
            });
            const data = response.data;
            return {
                success: true,
                status: 'PENDING',
                transactionId: data.txRef,
                message: "Premier Wallet push sent.",
                gatewayMetadata: data
            };
        }
        catch (error) {
            this.logger.error(`[PremierWallet] Error: ${error.message}`);
            // Fallback
            if (process.env.NODE_ENV !== 'production' && payment_config_1.paymentConfig.premierWallet.apiKey === 'YOUR_WALLET_KEY') {
                return {
                    success: true,
                    status: 'PENDING',
                    transactionId: `mock_pwallet_${Date.now()}`,
                    message: "MOCK: Premier Wallet Push Sent."
                };
            }
            return {
                success: false,
                status: 'FAILED',
                message: error.message
            };
        }
    }
}
// ==========================================
// 5. Simulated Provider (For Testing)
// ==========================================
class SimulatedProvider {
    async initiate(request) {
        return {
            success: true,
            status: 'COMPLETED',
            transactionId: `sim_${Date.now()}`,
            message: "Simulated Payment Successful",
            gatewayMetadata: { mode: 'simulation' }
        };
    }
}
// ==========================================
// FACTORY
// ==========================================
class PaymentFactory {
    static getProvider(method) {
        const normalized = method.toUpperCase();
        switch (normalized) {
            case 'EVC_PLUS':
            case 'ZAAD':
            case 'MOBILE':
            case 'WAAFI':
                return new TelcoProvider();
            case 'EDAHAB':
                return new EdahabProvider();
            case 'PREMIER_WALLET':
            case 'PREMIER_MOBILE':
                return new PremierWalletProvider();
            case 'CARD':
            case 'CREDIT_CARD':
            case 'MASTERCARD':
            case 'VISA':
                return new PremierBankProvider();
            case 'SIMULATED':
                return new SimulatedProvider();
            default:
                throw new Error(`Payment method ${method} not supported.`);
        }
    }
}
exports.PaymentFactory = PaymentFactory;
//# sourceMappingURL=PaymentService.js.map