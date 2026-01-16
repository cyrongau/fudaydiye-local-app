import { api } from '../../services/api';
import { Order, CartItem } from '../../../types';
import { auth } from '../../../lib/firebase'; // Need auth for userId if not passed

export interface CreateOrderPayload {
    cartItems: CartItem[];
    recipientName: string;
    recipientPhone: string;
    recipientAddress: string;
    paymentMethod: string;
    deliveryFee: number;
    isAtomic: boolean;
    recipientId: string | null;
    paymentDetails?: any;
    savePayment?: boolean;
    syncCartId?: string | null;
    currency?: string;
    exchangeRate?: number;
}

export interface PaymentInitiationPayload {
    orderId: string;
    paymentMethod: string;
    paymentDetails?: any;
    amount?: number; // Optional for backend, but good for check
    currency?: string;
}

export class PaymentService {

    /**
     * Create a new order via NestJS API
     */
    async createOrder(payload: CreateOrderPayload): Promise<{ success: boolean; orderId: string; orderNumber: string }> {
        try {
            // Ensure payload matches CreateOrderDto
            const response = await api.post('/orders', payload);
            return response.data;
        } catch (error: any) {
            console.error("PaymentService: Create Order Failed", error);
            throw new Error(error.response?.data?.message || "Order Creation Failed");
        }
    }

    /**
     * Initiate payment via NestJS API
     */
    async initiatePayment(payload: PaymentInitiationPayload): Promise<{ success: boolean; status: string; message?: string }> {
        try {
            // Need to pass userId securely.
            // For now, if payload doesn't have it, try to get from auth?
            // Checkout.tsx doesn't pass userId explicitly in paymentPayload!
            // But we can get it from auth.currentUser or payload.
            const userId = auth.currentUser?.uid || 'guest';

            const response = await api.post(`/orders/${payload.orderId}/pay`, {
                paymentMethod: payload.paymentMethod,
                paymentDetails: payload.paymentDetails
            });
            return response.data;
        } catch (error: any) {
            console.error("PaymentService: Payment Initiation Failed", error);
            throw new Error(error.response?.data?.message || "Payment Initiation Failed");
        }
    }

    /**
     * Get current exchange rate (Mock for now, can be connected to real API or Firestore)
     */
    async getExchangeRate(): Promise<number> {
        // In future, fetch from 'settings/exchange' doc
        return 26000; // 1 USD = 26,000 SLSH
    }
}

export const paymentService = new PaymentService();
