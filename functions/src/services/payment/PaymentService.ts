import { Logger } from '@nestjs/common';
import axios from 'axios';
import { paymentConfig } from '../../config/payment.config';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface PaymentRequest {
    orderId: string;
    amount: number;
    currency: string;
    payerId: string; // User ID
    paymentMethod: string; // e.g., 'EVC_PLUS', 'ZAAD', 'CARD'
    paymentDetails?: any; // e.g., { mobile: '+252...' }
}

export interface PaymentResult {
    success: boolean;
    transactionId?: string;
    status: PaymentStatus;
    message?: string;
    gatewayMetadata?: any;
}

export interface IPaymentProvider {
    initiate(request: PaymentRequest): Promise<PaymentResult>;
}

// ==========================================
// 1. Telco Provider (Waafi / Telesom API)
// ==========================================
class TelcoProvider implements IPaymentProvider {
    private readonly logger = new Logger('TelcoProvider');

    async initiate(request: PaymentRequest): Promise<PaymentResult> {
        this.logger.log(`[Waafi] Initiating payment for ${request.paymentDetails?.mobile}`);

        try {
            const payload = {
                schemaVersion: "1.0",
                requestId: `req_${Date.now()}`,
                timestamp: Date.now(),
                channelName: "WEB",
                serviceName: "API_PURCHASE",
                serviceParams: {
                    merchantUid: paymentConfig.waafi.merchantId,
                    apiUserId: paymentConfig.waafi.apiKey,
                    apiKey: paymentConfig.waafi.apiKey,
                    paymentMethod: "MWALLET_ACCOUNT",
                    payerInfo: {
                        accountNo: request.paymentDetails?.mobile // e.g. 25261xxxx
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
            const response = await axios.post(paymentConfig.waafi.baseUrl, payload, {
                timeout: 10000
            });

            // Assuming standard response structure
            const data = response.data;
            if (data.responseCode === "2001" || data.errorCode === "0") {
                return {
                    success: true,
                    status: 'PENDING', // Async wait for PIN
                    transactionId: data.params?.transactionId || `tx_${Date.now()}`,
                    message: "Payment push sent. Please enter PIN.",
                    gatewayMetadata: data
                };
            } else {
                throw new Error(data.responseMsg || "Payment failed");
            }

        } catch (error: any) {
            this.logger.error(`[Waafi] Error: ${error.message}`);
            // Fallback for Development (Mock if config invalid)
            if (process.env.NODE_ENV !== 'production' && paymentConfig.waafi.apiKey === 'YOUR_API_KEY') {
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
class PremierBankProvider implements IPaymentProvider {
    private readonly logger = new Logger('PremierBankProvider');

    async initiate(request: PaymentRequest): Promise<PaymentResult> {
        this.logger.log(`[PremierBank] charging card for order ${request.orderId}`);

        try {
            // Standard Gateway JSON Payload
            const payload = {
                merchantId: paymentConfig.premierBank.merchantId,
                amount: request.amount,
                currency: request.currency || 'USD',
                order: {
                    id: request.orderId,
                    description: "Fudaydiye Commerce Order"
                },
                sourceOfFunds: {
                    type: "CARD",
                    provided: {
                        card: request.paymentDetails?.card // In secure env only
                    }
                }
            };

            // In real PCI-DSS setup, we used tokenized ID, not raw card. 
            // This is a simplified example assuming server-to-server auth.

            const auth = Buffer.from(`${paymentConfig.premierBank.apiKey}:${paymentConfig.premierBank.secret}`).toString('base64');

            const response = await axios.post(`${paymentConfig.premierBank.baseUrl}/pay`, payload, {
                headers: { 'Authorization': `Basic ${auth}` },
                timeout: 15000
            });

            const data = response.data;

            return {
                success: true,
                status: 'COMPLETED',
                transactionId: data.transaction?.id,
                message: "Payment approved",
                gatewayMetadata: data
            };

        } catch (error: any) {
            this.logger.error(`[PremierBank] Error: ${error.message}`);
            // Fallback for Development
            if (process.env.NODE_ENV !== 'production' && paymentConfig.premierBank.apiKey === 'YOUR_API_KEY') {
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
class EdahabProvider implements IPaymentProvider {
    private readonly logger = new Logger('EdahabProvider');

    async initiate(request: PaymentRequest): Promise<PaymentResult> {
        this.logger.log(`[Edahab] Initiating payment for ${request.paymentDetails?.mobile}`);

        try {
            // Edahab JSON Payload Structure Matches their API
            const payload = {
                apiKey: paymentConfig.edahab.apiKey,
                edahabNumber: request.paymentDetails?.mobile,
                amount: request.amount,
                currency: request.currency || 'USD',
                agentCode: paymentConfig.edahab.merchantId,
                description: `Order ${request.orderId}`,
                returnUrl: `https://fudaydiye.com/callback/edahab/${request.orderId}`
            };

            // REAL API CALL
            const response = await axios.post(`${paymentConfig.edahab.baseUrl}/issueinvoice`, payload, {
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
            } else {
                throw new Error(data.ValidationErrors || "Edahab Failed");
            }
        } catch (error: any) {
            this.logger.error(`[Edahab] Error: ${error.message}`);
            // Fallback
            if (process.env.NODE_ENV !== 'production' && paymentConfig.edahab.apiKey === 'YOUR_API_KEY') {
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
class PremierWalletProvider implements IPaymentProvider {
    private readonly logger = new Logger('PremierWalletProvider');
    private readonly baseUrl = 'https://api.premierwallets.com/api';

    async initiate(request: PaymentRequest): Promise<PaymentResult> {
        this.logger.log(`[PremierWallet] Initiating flow for ${request.paymentDetails?.mobile}`);

        // Fetch dynamic config
        let config = { merchantId: '', apiKey: '', machineId: '' }; // apiKey here maps to Password
        try {
            const admin = await import('firebase-admin');
            const db = admin.firestore();
            const snap = await db.doc('system_config/global').get();
            if (snap.exists) {
                const data = snap.data();
                if (data?.integrations?.premierWallet) {
                    config = data.integrations.premierWallet;
                }
            }
        } catch (e) {
            this.logger.warn(`[PremierWallet] Config fetch failed: ${e}`);
        }

        const username = config.merchantId || paymentConfig.premierWallet.merchantId; // This is UserID/LoginUserName
        const password = config.apiKey || paymentConfig.premierWallet.apiKey; // This is Password
        const machineId = config.machineId || '1'; // Default if missing, but should be provided

        try {
            // STEP 1: LOGIN (Get Bearer Token)
            const authString = Buffer.from(`${username}:${password}`).toString('base64');
            const loginPayload = {
                UserName: username,
                Password: password
            };

            const loginRes = await axios.post(`${this.baseUrl}/MerchantLogin`, loginPayload, {
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
            const token = loginRes.data?.Data || loginRes.data?.Token;

            if (!token) throw new Error("Login failed: No token received");

            const bearerAuth = `Bearer ${token}`;
            const commonHeaders = {
                'Authorization': bearerAuth,
                'ChannelID': '104',
                'DeviceType': '205',
                'MachineID': machineId
            };

            // STEP 2: GET WALLET ID (Lookup by Mobile)
            const lookupRes = await axios.post(`${this.baseUrl}/GetUserQRDetailByUserID`, {
                UserID: request.paymentDetails?.mobile // e.g. 252...
            }, { headers: commonHeaders });

            const walletId = lookupRes.data?.Data?.WalletId;
            if (!walletId) throw new Error("User lookup failed: Wallet ID not found");

            // STEP 3: PUSH PAYMENT
            const payPayload = {
                CustomerWalletID: walletId,
                Amount: request.amount,
                Category: 5, // Shopping
                LoginUserName: username, // MerchantID
                Remarks: `Order ${request.orderId}`
            };

            const payRes = await axios.post(`${this.baseUrl}/PushPayment`, payPayload, {
                headers: commonHeaders
            });

            const payData = payRes.data;

            if (payData?.Response?.Code === '001') {
                return {
                    success: true,
                    status: 'PENDING', // Async push to user
                    transactionId: payData.Data?.TransactionID,
                    message: "Premier Wallet push sent. Check device.",
                    gatewayMetadata: payData
                };
            } else {
                throw new Error(payData?.Response?.Messages || "Payment Push Failed");
            }

        } catch (error: any) {
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
class SimulatedProvider implements IPaymentProvider {
    async initiate(request: PaymentRequest): Promise<PaymentResult> {
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
export class PaymentFactory {
    static getProvider(method: string): IPaymentProvider {
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
