"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentFactory = void 0;
// ==========================================
// 1. EVC Plus Provider (Somalia - Hormuud)
// ==========================================
class EvcPlusProvider {
    async initiate(request) {
        var _a;
        console.log(`[EVC-PLUS] Initiating USSD Push to ${(_a = request.paymentDetails) === null || _a === void 0 ? void 0 : _a.mobile} for $${request.amount}`);
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
class ZaadProvider {
    async initiate(request) {
        var _a;
        console.log(`[ZAAD] Initiating Payment to ${(_a = request.paymentDetails) === null || _a === void 0 ? void 0 : _a.mobile} for $${request.amount}`);
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
class EdahabProvider {
    async initiate(request) {
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
class StripeProvider {
    async initiate(request) {
        var _a;
        const last4 = ((_a = request.paymentDetails) === null || _a === void 0 ? void 0 : _a.last4) || '4242';
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
class PaymentFactory {
    static getProvider(method) {
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
exports.PaymentFactory = PaymentFactory;
//# sourceMappingURL=PaymentService.js.map