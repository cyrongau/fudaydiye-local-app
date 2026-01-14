
import { Injectable, Logger, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);
    private db: admin.firestore.Firestore;

    constructor() {
        this.db = admin.firestore();
    }

    async create(createOrderDto: CreateOrderDto) {
        const {
            cartItems,
            recipientName,
            recipientPhone,
            recipientAddress,
            paymentMethod,
            deliveryFee,
            isAtomic,
            recipientId,
            savePayment,
            syncCartId,
            paymentDetails
        } = createOrderDto;

        if (!cartItems || cartItems.length === 0) {
            throw new BadRequestException("Cart is empty.");
        }

        const vendorId = cartItems[0].vendorId;
        const orderRefNum = `FD-${Math.random().toString(36).substring(7).toUpperCase()}`;
        const secureCode = Math.floor(1000 + Math.random() * 9000).toString();

        try {
            const result = await this.db.runTransaction(async (transaction) => {
                let calculatedTotal = 0;
                const orderItems = [];

                // 1. Inventory & Price Verification Loop
                for (const item of cartItems) {
                    const productRef = this.db.collection("products").doc(item.productId);
                    const productSnap = await transaction.get(productRef);

                    if (!productSnap.exists) {
                        throw new NotFoundException(`Product ${item.productId} no longer exists.`);
                    }

                    const productData = productSnap.data()!;

                    // Check Stock
                    let currentStock = productData.baseStock || 0;
                    let price = productData.salePrice > 0 ? productData.salePrice : productData.basePrice;

                    // Handle Variations
                    if (item.variationId && productData.variations) {
                        const variant = productData.variations.find((v: any) => v.id === item.variationId);
                        if (!variant) throw new NotFoundException(`Variant ${item.variationId} not found.`);

                        currentStock = variant.stock || 0;
                        price = variant.salePrice > 0 ? variant.salePrice : variant.price;
                    }

                    if (currentStock < item.qty) {
                        // Using BadRequest for logical errors inside transaction
                        throw new BadRequestException(`Insufficient stock for ${productData.name}.`);
                    }

                    // Deduct Stock
                    if (item.variationId && productData.variations) {
                        const newVariations = productData.variations.map((v: any) => {
                            if (v.id === item.variationId) return { ...v, stock: v.stock - item.qty };
                            return v;
                        });
                        transaction.update(productRef, { variations: newVariations });
                    } else {
                        transaction.update(productRef, { baseStock: admin.firestore.FieldValue.increment(-item.qty) });
                    }

                    calculatedTotal += price * item.qty;

                    orderItems.push({
                        productId: item.productId,
                        variationId: item.variationId || null,
                        name: productData.name,
                        price: price, // Use SERVER price
                        qty: item.qty,
                        image: productData.images?.[0] || '',
                        vendorId: vendorId, // Verified from product doc
                        vendor: productData.vendor
                    });
                }

                const finalTotal = calculatedTotal + deliveryFee;

                // 2. Payment Simulation (Phase 2 stub)
                if (Math.random() > 0.95) {
                    throw new InternalServerErrorException("Payment gateway connection timeout.");
                }

                // 3. Create Order
                const orderDocRef = this.db.collection("orders").doc();
                const orderData = {
                    orderNumber: orderRefNum,
                    customerId: recipientId || `guest_${Date.now()}`,
                    customerName: recipientName,
                    customerPhone: recipientPhone,
                    vendorId: vendorId,
                    vendorName: orderItems[0].vendor,
                    items: orderItems,
                    total: finalTotal,
                    deliveryFee: deliveryFee,
                    status: 'PENDING',
                    isAtomic: isAtomic,
                    deliveryCode: secureCode,
                    paymentMethod: paymentMethod,
                    paymentMask: paymentMethod === 'CARD' ? `**** **** ${paymentDetails?.last4}` : recipientPhone,
                    currency: 'USD',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    shippingAddress: recipientAddress,
                };

                transaction.set(orderDocRef, orderData);

                // 4. Save Payment Source (if requested)
                if (recipientId && savePayment && !recipientId.startsWith("guest_") && paymentMethod === 'CARD') {
                    const userRef = this.db.collection("users").doc(recipientId);
                    transaction.update(userRef, {
                        savedPaymentSources: admin.firestore.FieldValue.arrayUnion({
                            id: `src_${Math.random().toString(36).substring(7)}`,
                            type: 'CARD',
                            provider: 'MockGateway',
                            mask: `**** ${paymentDetails?.last4}`,
                            lastUsedAt: new Date()
                        })
                    });
                }

                // 5. Check out Cart
                if (syncCartId) {
                    transaction.update(this.db.collection("carts").doc(syncCartId), {
                        status: 'CHECKED_OUT',
                        totalValue: finalTotal
                    });
                }

                return { success: true, orderId: orderDocRef.id, orderNumber: orderRefNum };
            });

            return result;

        } catch (error: any) {
            this.logger.error(`Order creation transaction failed: ${error.message}`, error.stack);
            // Important: Re-throw NestJS exceptions, wrap unknown errors
            if (error.status && error.response) throw error; // Re-throw NestJS exceptions (BadRequest, NotFound, etc)
            throw new InternalServerErrorException(error.message || "Transaction failed");
        }
    }

    async findAll(limit: number = 20) {
        const snapshot = await this.db.collection('orders').limit(Number(limit)).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async findOne(id: string) {
        const doc = await this.db.collection('orders').doc(id).get();
        if (!doc.exists) throw new NotFoundException('Order not found');
        return { id: doc.id, ...doc.data() };
    }
}
