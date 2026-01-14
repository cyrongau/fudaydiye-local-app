import { z } from 'zod';

const CartItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.number().positive(),
    vendorId: z.string(),
    image: z.string().optional(),
    // Allow pass-through for other UI specific props
}).passthrough();

export const OrderPayloadSchema = z.object({
    recipientId: z.string().nullable(),
    recipientName: z.string().min(1, "Recipient name is required"),
    recipientPhone: z.string().min(1, "Recipient phone is required"),
    recipientAddress: z.string().min(1, "Recipient address is required"),

    paymentMethod: z.string(),
    paymentDetails: z.record(z.string(), z.any()), // Flexible for different providers

    deliveryFee: z.number().nonnegative(),
    isAtomic: z.boolean(),

    cartItems: z.array(CartItemSchema).min(1, "Cart cannot be empty"),

    savePayment: z.boolean(),
    syncCartId: z.string().nullable(),
    currency: z.string(),
    exchangeRate: z.number().positive()
});

export type OrderPayload = z.infer<typeof OrderPayloadSchema>;
