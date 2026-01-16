"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OrdersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
const inventory_service_1 = require("../inventory/inventory.service");
const adjust_stock_dto_1 = require("../inventory/dto/adjust-stock.dto");
const events_service_1 = require("../events/events.service");
let OrdersService = OrdersService_1 = class OrdersService {
    constructor(inventoryService, eventsService) {
        this.inventoryService = inventoryService;
        this.eventsService = eventsService;
        this.logger = new common_1.Logger(OrdersService_1.name);
        this.db = admin.firestore();
        // Manually instantiate service if DI issues, or assume NestJS handles it
        // Ideally should be proper DI in Module.
    }
    async create(createOrderDto, userId) {
        const { cartItems, recipientName, recipientPhone, recipientAddress, paymentMethod, 
        // deliveryFee, // IGNORE CLIENT FEE
        isAtomic, recipientId, savePayment, syncCartId, paymentDetails } = createOrderDto;
        // Secure Calculation of Delivery Fee
        const deliveryFee = isAtomic ? 8.50 : 5.00;
        if (!cartItems || cartItems.length === 0) {
            throw new common_1.BadRequestException("Cart is empty.");
        }
        const vendorId = cartItems[0].vendorId;
        const orderRefNum = `FD-${Math.random().toString(36).substring(7).toUpperCase()}`;
        const secureCode = Math.floor(1000 + Math.random() * 9000).toString();
        try {
            const result = await this.db.runTransaction(async (transaction) => {
                var _a;
                let calculatedTotal = 0;
                const orderItems = [];
                const inventoryUpdates = [];
                // ==========================================
                // PHASE 1: READS & VALIDATION
                // ==========================================
                for (const item of cartItems) {
                    const productRef = this.db.collection("products").doc(item.productId);
                    const productSnap = await transaction.get(productRef);
                    if (!productSnap.exists) {
                        throw new common_1.NotFoundException(`Product ${item.productId} no longer exists.`);
                    }
                    const productData = productSnap.data();
                    // Verify Vendor match
                    if (productData.vendorId !== vendorId) {
                        throw new common_1.BadRequestException(`Item ${productData.name} does not belong to vendor ${vendorId}.`);
                    }
                    let price = productData.salePrice > 0 ? productData.salePrice : productData.basePrice;
                    // Handle Variations (Logic Simplified)
                    if (item.variationId && productData.variations) {
                        const variant = productData.variations.find((v) => v.id === item.variationId);
                        if (!variant)
                            throw new common_1.NotFoundException(`Variant ${item.variationId} not found.`);
                        price = variant.salePrice > 0 ? variant.salePrice : variant.price;
                    }
                    calculatedTotal += price * item.qty;
                    orderItems.push({
                        productId: item.productId,
                        variationId: item.variationId || null,
                        name: productData.name,
                        price: price,
                        qty: item.qty,
                        image: ((_a = productData.images) === null || _a === void 0 ? void 0 : _a[0]) || '',
                        vendorId: vendorId,
                        vendor: productData.vendor || 'Unknown Vendor'
                    });
                    // Prepare Inventory Update (Defer Write)
                    inventoryUpdates.push({
                        productId: item.productId,
                        qty: item.qty,
                        currentStock: productData.baseStock || 0
                    });
                }
                // ==========================================
                // PHASE 2: WRITES (INVENTORY & ORDER)
                // ==========================================
                // 1. Execute Inventory Updates (Using Preloaded Stock to skip Reads)
                for (const update of inventoryUpdates) {
                    await this.inventoryService.adjustStock({
                        productId: update.productId,
                        change: -update.qty,
                        reason: adjust_stock_dto_1.InventoryReason.SALE,
                        notes: `Order #${orderRefNum}`,
                        orderId: 'PENDING'
                    }, { uid: userId, role: 'SYSTEM' }, transaction, update.currentStock);
                }
                const finalTotal = calculatedTotal + deliveryFee;
                // 2. Payment Simulation
                if (Math.random() > 0.99) { // Reduced failure rate for stability
                    throw new common_1.InternalServerErrorException("Payment gateway connection timeout.");
                }
                // 3. Create Order
                const orderDocRef = this.db.collection("orders").doc(); // Generates ID locally, no read needed
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
                    paymentMask: paymentMethod === 'CARD' ? `**** **** ${paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.last4}` : recipientPhone,
                    currency: 'USD',
                    createdAt: firestore_1.FieldValue.serverTimestamp(),
                    shippingAddress: recipientAddress,
                };
                transaction.set(orderDocRef, orderData);
                // 4. Save Payment Source 
                if (recipientId && savePayment && !recipientId.startsWith("guest_") && paymentMethod === 'CARD') {
                    // This creates a read/write hazard if unique user doc? 
                    // No, update is write only if we don't read. 
                    // BUT transaction.update requires doc to exist. 
                    // We haven't read 'userRef'. 
                    // If we update blindly, it's a WRITE. OK.
                    const userRef = this.db.collection("users").doc(recipientId);
                    transaction.update(userRef, {
                        savedPaymentSources: firestore_1.FieldValue.arrayUnion({
                            id: `src_${Math.random().toString(36).substring(7)}`,
                            type: 'CARD',
                            provider: 'MockGateway',
                            mask: `**** ${paymentDetails === null || paymentDetails === void 0 ? void 0 : paymentDetails.last4}`,
                            lastUsedAt: new Date()
                        })
                    });
                }
                // 5. Check out Cart
                if (syncCartId) {
                    // WRITE ONLY
                    transaction.update(this.db.collection("carts").doc(syncCartId), {
                        status: 'CHECKED_OUT',
                        totalValue: finalTotal
                    });
                }
                return { success: true, orderId: orderDocRef.id, orderNumber: orderRefNum, total: finalTotal };
            });
            // Log Event (Async - Fire & Forget)
            this.eventsService.logEvent(userId, 'ORDER_PLACED', {
                metadata: {
                    orderId: result.orderId,
                    orderNumber: result.orderNumber,
                    total: result.total
                },
                relatedEntityId: result.orderId
            });
            return result;
        }
        catch (error) {
            this.logger.error(`Order creation transaction failed: ${error.message}`, error.stack);
            if (error.status && error.response)
                throw error;
            throw new common_1.InternalServerErrorException(error.message || "Transaction failed");
        }
    }
    async findAll(user, limit = 20, status) {
        let query = this.db.collection('orders');
        // Role-based Access Control (RBAC) Filtering
        if (user.role === 'VENDOR') {
            query = query.where('vendorId', '==', user.uid);
        }
        else if (user.role === 'RIDER') {
            query = query.where('riderId', '==', user.uid);
        }
        else if (user.role === 'ADMIN' || user.role === 'FUDAYDIYE_ADMIN') {
            // Admin sees all, allow optional filtering if params provided (not impl yet for params like vendorId)
        }
        else {
            // Default to Customer View
            query = query.where('customerId', '==', user.uid);
        }
        if (status) {
            query = query.where('status', '==', status);
        }
        const snapshot = await query.orderBy('createdAt', 'desc').limit(Number(limit) || 20).get();
        return snapshot.docs.map(doc => {
            var _a;
            return (Object.assign(Object.assign({ id: doc.id }, doc.data()), { 
                // Ensure dates are serialized if needed, though Maps usually handle it. 
                // Firestore Timestamps need conversion for clean JSON often.
                createdAt: ((_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate()) || null }));
        });
    }
    async findOne(id) {
        const doc = await this.db.collection('orders').doc(id).get();
        if (!doc.exists)
            throw new common_1.NotFoundException('Order not found');
        return Object.assign({ id: doc.id }, doc.data());
    }
    async initiatePayment(orderId, userId, paymentMethod, paymentDetails) {
        const orderRef = this.db.collection("orders").doc(orderId);
        const orderSnap = await orderRef.get();
        if (!orderSnap.exists) {
            throw new common_1.NotFoundException("Order not found.");
        }
        const order = orderSnap.data();
        if (order.customerId !== userId && order.customerId !== `guest_${userId}`) {
            // Strict check, but allow if user provides a valid claim? For now strict ownership.
            if (order.customerId !== userId) {
                // throw new ForbiddenException("You are not the owner of this order."); // NestJS Forbidden
                throw new common_1.BadRequestException("You are not the owner of this order.");
            }
        }
        if (order.status === 'PAID' || order.status === 'COMPLETED') {
            throw new common_1.BadRequestException("Order is already paid.");
        }
        try {
            // Lazy load specific factory to avoid circular deps if any, or just import at top
            const { PaymentFactory } = require('../../services/payment/PaymentService');
            const provider = PaymentFactory.getProvider(paymentMethod);
            const request = {
                orderId,
                amount: order.total,
                currency: 'USD',
                payerId: userId,
                paymentMethod,
                paymentDetails
            };
            const result = await provider.initiate(request);
            if (result.success) {
                await orderRef.update({
                    paymentStatus: result.status,
                    paymentGatewayRef: result.transactionId || null,
                    paymentMethod: paymentMethod,
                    updatedAt: firestore_1.FieldValue.serverTimestamp()
                });
                if (result.status === 'COMPLETED') {
                    await orderRef.update({
                        status: 'CONFIRMED',
                        isPaid: true
                    });
                }
            }
            return result;
        }
        catch (error) {
            this.logger.error(`Payment Initiation Failed: ${error.message}`);
            throw new common_1.InternalServerErrorException(error.message || "Payment Gateway Error");
        }
    }
    async cancelOrder(orderId, userId, reason = "Vendor cancelled", role) {
        try {
            await this.db.runTransaction(async (t) => {
                const orderRef = this.db.collection('orders').doc(orderId);
                const orderSnap = await t.get(orderRef);
                if (!orderSnap.exists)
                    throw new common_1.NotFoundException("Order not found");
                const order = orderSnap.data();
                // Auth Check
                this.logger.log(`Cancel Request: User=${userId}, Role=${role}, OrderVendor=${order.vendorId}, OrderCustomer=${order.customerId}`);
                if (role === 'VENDOR') {
                    if (order.vendorId !== userId) {
                        this.logger.warn(`Vendor mismatch: ${order.vendorId} !== ${userId}`);
                        throw new common_1.BadRequestException("Not authorized: Vendor ID mismatch");
                    }
                }
                else if (role === 'ADMIN' || role === 'FUDAYDIYE_ADMIN') {
                    // Admin ok
                }
                else if (order.customerId !== userId) { // Assume Customer if not specified role match
                    this.logger.warn(`Customer mismatch: ${order.customerId} !== ${userId} (Role: ${role})`);
                    throw new common_1.BadRequestException("Not authorized: Customer ID mismatch");
                }
                // Status Check
                if (['SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED_BY_VENDOR'].includes(order.status)) {
                    throw new common_1.BadRequestException("Cannot cancel order in current status.");
                }
                // 1. Refund Logic
                if (order.isPaid || (order.paymentStatus === 'COMPLETED')) {
                    const customerWalletRef = this.db.collection('wallets').doc(order.customerId);
                    const txRef = this.db.collection('transactions').doc();
                    // Blind write increment
                    t.set(customerWalletRef, {
                        balance: firestore_1.FieldValue.increment(order.total),
                        updatedAt: firestore_1.FieldValue.serverTimestamp()
                    }, { merge: true });
                    t.set(txRef, {
                        userId: order.customerId,
                        type: 'REFUND',
                        amount: order.total,
                        status: 'COMPLETED',
                        referenceId: orderId,
                        description: `Refund for Order #${order.orderNumber || orderId}. Reason: ${reason}`,
                        createdAt: firestore_1.FieldValue.serverTimestamp()
                    });
                }
                // 2. Inventory Reversal (Restock)
                if (order.items && Array.isArray(order.items)) {
                    for (const item of order.items) {
                        const productRef = this.db.collection('products').doc(item.productId);
                        t.update(productRef, {
                            baseStock: firestore_1.FieldValue.increment(item.qty)
                        });
                    }
                }
                // 3. Update Status
                t.update(orderRef, {
                    status: 'CANCELLED_BY_VENDOR',
                    cancelledAt: firestore_1.FieldValue.serverTimestamp(),
                    cancellationReason: reason,
                    riderId: firestore_1.FieldValue.delete(),
                    riderName: firestore_1.FieldValue.delete()
                });
                // 4. Notify Customer
                const notifRef = this.db.collection('notifications').doc();
                t.set(notifRef, {
                    userId: order.customerId,
                    title: "Order Cancelled 🛑",
                    message: `Your order #${order.orderNumber || '...'} was cancelled. ${reason}. Refund processed.`,
                    type: 'FINANCE',
                    isRead: false,
                    link: `/customer/orders/${orderId}`,
                    createdAt: firestore_1.FieldValue.serverTimestamp()
                });
            });
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Cancel failed:`, error);
            throw error;
        }
    }
    async updateStatus(orderId, status, vendorId) {
        const orderRef = this.db.collection("orders").doc(orderId);
        await this.db.runTransaction(async (t) => {
            const snap = await t.get(orderRef);
            if (!snap.exists)
                throw new common_1.NotFoundException("Order not found");
            const data = snap.data();
            if (data.vendorId !== vendorId) {
                throw new common_1.BadRequestException("Unauthorized access to this order.");
            }
            t.update(orderRef, {
                status: status,
                lastStatusUpdate: firestore_1.FieldValue.serverTimestamp()
            });
            // Notify Customer
            const notifRef = this.db.collection("notifications").doc();
            t.set(notifRef, {
                userId: data.customerId,
                title: "Order Update 📦",
                message: `Order #${data.orderNumber} is now ${status}.`,
                link: `/customer/track/${orderId}`,
                type: 'ORDER',
                isRead: false,
                createdAt: firestore_1.FieldValue.serverTimestamp()
            });
        });
        // Log Event for Notifications
        this.eventsService.logEvent(vendorId, 'ORDER_STATUS_CHANGED', {
            metadata: { orderId, status },
            relatedEntityId: orderId
        });
        return { success: true };
    }
    async assignRider(orderId, riderId, riderName, vendorId) {
        const orderRef = this.db.collection("orders").doc(orderId);
        await this.db.runTransaction(async (t) => {
            const snap = await t.get(orderRef);
            if (!snap.exists)
                throw new common_1.NotFoundException("Order not found");
            const data = snap.data();
            if (data.vendorId !== vendorId) {
                throw new common_1.BadRequestException("Unauthorized access to this order.");
            }
            if (data.status === 'SHIPPED' || data.status === 'DELIVERED') {
                // Determine if re-assignment is allowed. Assuming yes if issue arises, but typically not.
                // Let's allow for now if vendor initiates.
            }
            t.update(orderRef, {
                riderId: riderId,
                riderName: riderName,
                status: 'ACCEPTED',
                lastUpdate: firestore_1.FieldValue.serverTimestamp()
            });
            // Notify Rider
            const notifRef = this.db.collection("notifications").doc();
            t.set(notifRef, {
                userId: riderId,
                title: "New Job Assigned 🛵",
                message: `New delivery request from ${data.vendorName || 'Merchant'}.`,
                link: `/rider/pickup/${orderId}`,
                type: 'ORDER',
                isRead: false,
                createdAt: firestore_1.FieldValue.serverTimestamp()
            });
        });
        return { success: true };
    }
};
OrdersService = OrdersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService,
        events_service_1.EventsService])
], OrdersService);
exports.OrdersService = OrdersService;
//# sourceMappingURL=orders.service.js.map