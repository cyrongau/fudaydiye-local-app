
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
    // verify(transactionId: string): Promise<PaymentResult>; // Valid for later
}

// ==========================================
// 1. EVC Plus Provider (Somalia - Hormuud)
// ==========================================
class EvcPlusProvider implements IPaymentProvider {
    async initiate(request: PaymentRequest): Promise<PaymentResult> {
        console.log(`[EVC-PLUS] Initiating USSD Push to ${request.paymentDetails?.mobile} for $${request.amount}`);

        // MOCK: In real life, we hit Hormuud API here.
        // For now, we simulate a successful "Pending" state (waiting for user PIN).

        return {
            success: true,
            status: 'PENDING',
            transactionId: `evc_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            message: "Payment push sent. Please enter PIN on your mobile."
        };
    }
}

// ==========================================
// 2. ZAAD Provider (Somaliland - Telesom)
// ==========================================
class ZaadProvider implements IPaymentProvider {
    async initiate(request: PaymentRequest): Promise<PaymentResult> {
        console.log(`[ZAAD] Initiating Payment to ${request.paymentDetails?.mobile} for $${request.amount}`);
        // Mocking immediate success for variety, or pending. Let's do PENDING for realism.
        return {
            success: true,
            status: 'PENDING',
            transactionId: `zaad_${Date.now()}`,
            message: "Check your ZAAD mobile prompt."
        };
    }
}

// ==========================================
// 3. eDahab Provider (Somalia - Somtel)
// ==========================================
class EdahabProvider implements IPaymentProvider {
    async initiate(request: PaymentRequest): Promise<PaymentResult> {
        console.log(`[EDAHAB] Processing $${request.amount}`);
        return {
            success: true,
            status: 'PENDING',
            transactionId: `edahab_${Date.now()}`,
            message: "eDahab request sent."
        };
    }
}

// ==========================================
// 4. Credit Card (Stripe Wrapper Mock)
// ==========================================
class StripeProvider implements IPaymentProvider {
    async initiate(request: PaymentRequest): Promise<PaymentResult> {
        const last4 = request.paymentDetails?.last4 || '4242';
        console.log(`[STRIPE] Charging Card **** ${last4} for $${request.amount}`);

        // Simulate immediate success for cards usually
        return {
            success: true,
            status: 'COMPLETED',
            transactionId: `ch_${Date.now()}`,
            message: "Payment approved."
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
            case 'MOBILE_MONEY': // Default to EVC for generic
                return new EvcPlusProvider();
            case 'ZAAD':
                return new ZaadProvider();
            case 'EDAHAB':
                return new EdahabProvider();
            case 'CARD':
            case 'CREDIT_CARD':
                return new StripeProvider();
            default:
                throw new Error(`Payment method ${method} not supported.`);
        }
    }
}
