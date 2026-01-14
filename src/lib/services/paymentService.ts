import { db, functions } from '../../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import { OrderPayload, OrderPayloadSchema } from '../schemas/order';

export type { OrderPayload };

export interface PaymentPayload {
    orderId: string;
    paymentMethod: string;
    paymentDetails: { last4?: string; phone?: string; mobile?: string;[key: string]: any };
    amount: number;
    currency: string;
}

class PaymentService {
    /**
     * Fetch the current SLSH to USD exchange rate from Firestore
     */
    async getExchangeRate(): Promise<number> {
        try {
            const rateSnap = await getDoc(doc(db, "settings", "exchange_rates"));
            if (rateSnap.exists()) {
                return rateSnap.data().rate || 8500;
            }
            return 8500; // Default fallback
        } catch (error) {
            console.error("PaymentService: Failed to fetch exchange rate", error);
            return 8500;
        }
    }

    /**
     * Call the 'createOrder' Cloud Function
     */
    async createOrder(payload: OrderPayload): Promise<{ success: boolean; orderId?: string; message?: string }> {
        try {
            // Validate Payload
            const validatedPayload = OrderPayloadSchema.parse(payload);

            const createOrderFn = httpsCallable(functions, 'createOrder');
            const result: any = await createOrderFn(validatedPayload);
            return result.data;
        } catch (error) {
            console.error("PaymentService: Create Order Error", error);
            throw error;
        }
    }

    /**
     * Call the 'initiatePayment' Cloud Function
     */
    async initiatePayment(payload: PaymentPayload): Promise<{ success: boolean; status?: string; message?: string }> {
        try {
            const initiatePaymentFn = httpsCallable(functions, 'initiatePayment');
            const result: any = await initiatePaymentFn(payload);
            return result.data;
        } catch (error) {
            console.error("PaymentService: Initiate Payment Error", error);
            throw error;
        }
    }
}

export const paymentService = new PaymentService();
