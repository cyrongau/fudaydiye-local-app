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
// ==========================================
// 4. Premier Wallet Provider
// ==========================================
// ==========================================
// 4. Premier Wallet Provider
// ==========================================
class PremierWalletProvider {
    constructor() {
        this.logger = new common_1.Logger('PremierWalletProvider');
        this.baseUrl = 'https://api.premierwallets.com/api';
    }
    async initiate(request) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        this.logger.log(`[PremierWallet] Initiating flow for ${(_a = request.paymentDetails) === null || _a === void 0 ? void 0 : _a.mobile}`);
        // Fetch dynamic config
        let config = { merchantId: '', apiKey: '', machineId: '' }; // apiKey here maps to Password
        try {
            const admin = await Promise.resolve().then(() => require('firebase-admin'));
            const db = admin.firestore();
            const snap = await db.doc('system_config/global').get();
            if (snap.exists) {
                const data = snap.data();
                if ((_b = data === null || data === void 0 ? void 0 : data.integrations) === null || _b === void 0 ? void 0 : _b.premierWallet) {
                    config = data.integrations.premierWallet;
                }
            }
        }
        catch (e) {
            this.logger.warn(`[PremierWallet] Config fetch failed: ${e}`);
        }
        const username = config.merchantId || payment_config_1.paymentConfig.premierWallet.merchantId; // This is UserID/LoginUserName
        const password = config.apiKey || payment_config_1.paymentConfig.premierWallet.apiKey; // This is Password
        const machineId = config.machineId || '1'; // Default if missing, but should be provided
        try {
            // STEP 1: LOGIN (Get Bearer Token)
            const authString = Buffer.from(`${username}:${password}`).toString('base64');
            const loginPayload = {
                UserName: username,
                Password: password
            };
            const loginRes = await axios_1.default.post(`${this.baseUrl}/MerchantLogin`, loginPayload, {
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'ChannelID': '104',
                    'DeviceType': '205',
                    'MachineID': machineId
                }
            });
            // Assuming the token is in the response body or headers. 
            // The doc says "Authorization: Bearer Token" for subsequent calls.
            // Usually login returns it. Let's assume response.data.Data or response.data.Token.
            // Based on typical flows and "Authorization: Bearer Token" table row, let's assume it returns a token string.
            // Documentation is slightly ambiguous ("This API will be required to call with Basic...").
            // Given the lack of distinct "Token" field in doc, but "Authorization: Bearer Token" in next step, 
            // valid assumption is response contains it.
            // Let's assume `loginRes.data.Data` is the token or part of it.
            // SAFEST GUESS based on similar banking APIs: Data field contains SessionID/Token.
            const token = ((_c = loginRes.data) === null || _c === void 0 ? void 0 : _c.Data) || ((_d = loginRes.data) === null || _d === void 0 ? void 0 : _d.Token);
            if (!token)
                throw new Error("Login failed: No token received");
            const bearerAuth = `Bearer ${token}`;
            const commonHeaders = {
                'Authorization': bearerAuth,
                'ChannelID': '104',
                'DeviceType': '205',
                'MachineID': machineId
            };
            // STEP 2: GET WALLET ID (Lookup by Mobile)
            const lookupRes = await axios_1.default.post(`${this.baseUrl}/GetUserQRDetailByUserID`, {
                UserID: (_e = request.paymentDetails) === null || _e === void 0 ? void 0 : _e.mobile // e.g. 252...
            }, { headers: commonHeaders });
            const walletId = (_g = (_f = lookupRes.data) === null || _f === void 0 ? void 0 : _f.Data) === null || _g === void 0 ? void 0 : _g.WalletId;
            if (!walletId)
                throw new Error("User lookup failed: Wallet ID not found");
            // STEP 3: PUSH PAYMENT
            const payPayload = {
                CustomerWalletID: walletId,
                Amount: request.amount,
                Category: 5,
                LoginUserName: username,
                Remarks: `Order ${request.orderId}`
            };
            const payRes = await axios_1.default.post(`${this.baseUrl}/PushPayment`, payPayload, {
                headers: commonHeaders
            });
            const payData = payRes.data;
            if (((_h = payData === null || payData === void 0 ? void 0 : payData.Response) === null || _h === void 0 ? void 0 : _h.Code) === '001') {
                return {
                    success: true,
                    status: 'PENDING',
                    transactionId: (_j = payData.Data) === null || _j === void 0 ? void 0 : _j.TransactionID,
                    message: "Premier Wallet push sent. Check device.",
                    gatewayMetadata: payData
                };
            }
            else {
                throw new Error(((_k = payData === null || payData === void 0 ? void 0 : payData.Response) === null || _k === void 0 ? void 0 : _k.Messages) || "Payment Push Failed");
            }
        }
        catch (error) {
            this.logger.error(`[PremierWallet] Deep Flow Error: ${error.message}`);
            // Fallback for Demo Mode if credentials are mock placeholders
            if (process.env.NODE_ENV !== 'production' && (password === 'YOUR_WALLET_KEY' || !password)) {
                return {
                    success: true,
                    status: 'PENDING',
                    transactionId: `mock_pwallet_${Date.now()}`,
                    message: "MOCK: Premier Wallet Push Sent (Deep Flow)."
                };
            }
            return {
                success: false,
                status: 'FAILED',
                message: error.message || "Wallet Provider Error"
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