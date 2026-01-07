"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiatePayment = exports.verifyOtp = exports.requestOtp = exports.sendNotification = exports.onOrderCreated = exports.createOrder = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const CommunicationFactory_1 = require("./services/CommunicationFactory");
const PaymentService_1 = require("./services/payment/PaymentService");
admin.initializeApp();
const db = admin.firestore();
exports.createOrder = functions.https.onCall(async (data, context) => {
    if (!context.auth && !data.recipientId) {
        // Allow guest checkout if we handle it logic-wise, but usually we want at least an anon auth.
        // For now, mirroring existing logic which seems to allow guests.
        // If context.auth is null, we rely on the payload having necessary contact info.
    }
    const { cartItems, recipientName, recipientPhone, recipientAddress, paymentMethod, deliveryFee, isAtomic, recipientId, savePayment, syncCartId } = data;
    if (!cartItems || cartItems.length === 0) {
        throw new functions.https.HttpsError("invalid-argument", "Cart is empty.");
    }
    const vendorId = cartItems[0].vendorId;
    const orderRefNum = `FD-${Math.random().toString(36).substring(7).toUpperCase()}`;
    const secureCode = Math.floor(1000 + Math.random() * 9000).toString();
    try {
        const result = await db.runTransaction(async (transaction) => {
            var _a, _b, _c;
            let calculatedTotal = 0;
            const orderItems = [];
            // 1. Inventory & Price Verification Loop
            for (const item of cartItems) {
                const productRef = db.collection("products").doc(item.productId);
                const productSnap = await transaction.get(productRef);
                if (!productSnap.exists) {
                    throw new functions.https.HttpsError("not-found", `Product ${item.productId} no longer exists.`);
                }
                const productData = productSnap.data();
                // Check Stock
                let currentStock = productData.baseStock || 0;
                let price = productData.salePrice > 0 ? productData.salePrice : productData.basePrice;
                // Handle Variations
                if (item.variationId && productData.variations) {
                    const variant = productData.variations.find((v) => v.id === item.variationId);
                    if (!variant)
                        throw new functions.https.HttpsError("not-found", `Variant ${item.variationId} not found.`);
                    currentStock = variant.stock || 0;
                    price = variant.salePrice > 0 ? variant.salePrice : variant.price;
                }
                if (currentStock < item.qty) {
                    throw new functions.https.HttpsError("resource-exhausted", `Insufficient stock for ${productData.name}.`);
                }
                // Deduct Stock
                if (item.variationId && productData.variations) {
                    const newVariations = productData.variations.map((v) => {
                        if (v.id === item.variationId)
                            return Object.assign(Object.assign({}, v), { stock: v.stock - item.qty });
                        return v;
                    });
                    transaction.update(productRef, { variations: newVariations });
                    // Also decrement base stock if it represents total? Assuming baseStock is master for simple.
                    // For variable, we might track total separately or not. 
                    // Safety: decrement baseStock too if it acts as a cached total, otherwise skip.
                    // adhering to Audit logic: "baseStock" seems to be used for simple.
                }
                else {
                    transaction.update(productRef, { baseStock: admin.firestore.FieldValue.increment(-item.qty) });
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
                    vendor: productData.vendor
                });
            }
            const finalTotal = calculatedTotal + deliveryFee;
            // 2. Payment Simulation (Phase 2 stub)
            // In real world: verify payment intent or charge card here.
            // For now, we trust the "paymentDetails" existence.
            if (Math.random() > 0.95) {
                // 5% random failure simulation
                throw new functions.https.HttpsError("aborted", "Payment gateway connection timeout.");
            }
            // 3. Create Order
            const orderDocRef = db.collection("orders").doc();
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
                // Don't store full card details!
                paymentMask: paymentMethod === 'CARD' ? `**** **** ${(_b = data.paymentDetails) === null || _b === void 0 ? void 0 : _b.last4}` : recipientPhone,
                currency: 'USD',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                shippingAddress: recipientAddress,
            };
            transaction.set(orderDocRef, orderData);
            // 4. Save Payment Source (if requested)
            if (recipientId && savePayment && !recipientId.startsWith("guest_") && paymentMethod === 'CARD') {
                const userRef = db.collection("users").doc(recipientId);
                // Note: In real app, we save Token ID, not card number.
                // Simulator just saves a mask reference.
                transaction.update(userRef, {
                    savedPaymentSources: admin.firestore.FieldValue.arrayUnion({
                        id: `src_${Math.random().toString(36).substring(7)}`,
                        type: 'CARD',
                        provider: 'MockGateway',
                        mask: `**** ${(_c = data.paymentDetails) === null || _c === void 0 ? void 0 : _c.last4}`,
                        lastUsedAt: new Date()
                    })
                });
            }
            // 5. Check out Cart
            if (syncCartId) {
                transaction.update(db.collection("carts").doc(syncCartId), {
                    status: 'CHECKED_OUT',
                    totalValue: finalTotal
                });
            }
            return { success: true, orderId: orderDocRef.id, orderNumber: orderRefNum };
        });
        return result;
    }
    catch (error) {
        console.error("Order creation failed:", error);
        // Rethrow structured error or return failure object
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError("internal", error.message || "Transaction failed");
    }
});
// Trigger to notify vendor
exports.onOrderCreated = functions.firestore
    .document('orders/{orderId}')
    .onCreate(async (snap, context) => {
    const order = snap.data();
    if (!order)
        return;
    // 1. In-App Notification (Firestore)
    await db.collection("notifications").add({
        userId: order.vendorId,
        title: "New Dispatch Authorized",
        message: `Order #${order.orderNumber} received. Value: $${order.total}. Proceed to packing.`,
        link: `/vendor/orders`,
        type: 'ORDER',
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    // 2. External Notifications (SMS/Email) via Phase 4 Infra
    // Note: In real app, we fetch Vendor's perferred contact method/phone from their user profile
    // For now, we simulate sending an SMS to the vendor (mapped to a test number or mock)
    try {
        const smsService = CommunicationFactory_1.CommunicationFactory.getService('SMS');
        await smsService.send({
            to: "DO_NOT_SEND_REAL",
            body: `FDDY Vendor: New Order #${order.orderNumber} received. Value: $${order.total}. Please pack immediately.`
        });
        console.log("Infra: external notification triggered.");
    }
    catch (e) {
        console.error("Infra: external notification failed", e);
    }
});
// Generic Notification Callable (For testing the infra)
exports.sendNotification = functions.https.onCall(async (data, context) => {
    // data: { type: 'SMS'|'EMAIL', to: string, content: string, subject?: string }
    const { type, to, content, subject } = data;
    try {
        const service = CommunicationFactory_1.CommunicationFactory.getService(type);
        const result = await service.send({
            to,
            body: content,
            subject // Only for Email
        });
        return { success: result };
    }
    catch (e) {
        throw new functions.https.HttpsError('internal', e.message);
    }
});
// ==========================================
// Phase 5: OTP Authentication (Missing Implementation)
// ==========================================
exports.requestOtp = functions.https.onCall(async (data, context) => {
    // data: { identifier: string, method: 'email' | 'phone' }
    const { identifier, method } = data;
    if (!identifier || !method) {
        throw new functions.https.HttpsError("invalid-argument", "Missing identifier or method.");
    }
    // 1. Generate Code (6 digits)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000)); // 5 mins
    // 2. Store in Firestore (Overwrite existing)
    try {
        await db.collection("access_codes").doc(identifier).set({
            code,
            expiresAt,
            attempts: 0,
            method
        });
    }
    catch (e) {
        console.error("OTP Storage Failed:", e);
        throw new functions.https.HttpsError("internal", "Failed to generate OTP secure storage.");
    }
    // 3. Send via Communication Service
    // Note: We use the factory we built in Phase 4
    try {
        const commService = CommunicationFactory_1.CommunicationFactory.getService(method === 'email' ? 'EMAIL' : 'SMS');
        let body = `Your Fudaydiye Secure Login Code is: ${code}. Valid for 5 minutes.`;
        if (method === 'email') {
            await commService.send({
                to: identifier,
                subject: "Login Verification Code",
                body
            });
        }
        else {
            await commService.send({
                to: identifier,
                body: `FDDY code: ${code}`
            });
        }
        return { success: true };
    }
    catch (e) {
        console.error("OTP Delivery Failed:", e);
        // We log the code here in case of delivery failure (and for MOCK mode visibility)
        console.log(`[OTP-BACKUP] Identifier: ${identifier}, Code: ${code}`);
        return { success: true, warning: "Delivery delayed, check logs if mock." };
    }
});
exports.verifyOtp = functions.https.onCall(async (data, context) => {
    // data: { identifier: string, code: string }
    const { identifier, code } = data;
    if (!identifier || !code) {
        throw new functions.https.HttpsError("invalid-argument", "Missing identifier or code.");
    }
    const docRef = db.collection("access_codes").doc(identifier);
    const doc = await docRef.get();
    if (!doc.exists) {
        throw new functions.https.HttpsError("not-found", "No OTP request found. Request a new one.");
    }
    const record = doc.data();
    // 1. Check Expiry
    if (record.expiresAt.toDate() < new Date()) {
        throw new functions.https.HttpsError("failed-precondition", "Code expired. Request a new one.");
    }
    // 2. Check Attempts
    if (record.attempts >= 3) {
        await docRef.delete(); // Security: Burn it
        throw new functions.https.HttpsError("resource-exhausted", "Too many failed attempts. Request a new code.");
    }
    // 3. Validate Code
    if (record.code !== code) {
        await docRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
        throw new functions.https.HttpsError("permission-denied", "Invalid code.");
    }
    // 4. Success! Find or Create User (Shadow Profile)
    // We need a UID to mint a token.
    // Strategy: Look up in 'users' collection by email/phone field.
    let uid = '';
    // Simple lookup query
    // Note: This assumes unique email/phone in users collection
    const usersRef = db.collection("users");
    let query;
    if (record.method === 'email')
        query = usersRef.where('email', '==', identifier);
    else
        query = usersRef.where('phoneNumber', '==', identifier); // Ensure field name matches registration
    const userSnap = await query.limit(1).get();
    if (!userSnap.empty) {
        uid = userSnap.docs[0].id;
    }
    else {
        // User doesn't exist? 
        try {
            // Check Firebase Auth (Identity Platform)
            const authUser = record.method === 'email'
                ? await admin.auth().getUserByEmail(identifier)
                : await admin.auth().getUserByPhoneNumber(identifier);
            uid = authUser.uid;
        }
        catch (e) {
            if (e.code === 'auth/user-not-found') {
                // allow registration via this flow if needed, but for now strict
                throw new functions.https.HttpsError("not-found", "User not registered. Please create a profile first.");
            }
            throw new functions.https.HttpsError("internal", "Auth lookup failed.");
        }
    }
    // 5. Mint Token
    try {
        const customToken = await admin.auth().createCustomToken(uid);
        // 6. Cleanup
        await docRef.delete();
        return { token: customToken, uid };
    }
    catch (e) {
        console.error("Token Minting Failed:", e);
        throw new functions.https.HttpsError("internal", "Failed to authenticate session.");
    }
});
// ==========================================
// Phase 6: Payment Infrastructure
// ==========================================
exports.initiatePayment = functions.https.onCall(async (data, context) => {
    // data: { orderId: string, paymentMethod: string, paymentDetails: any }
    const { orderId, paymentMethod, paymentDetails } = data;
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
    }
    if (!orderId || !paymentMethod) {
        throw new functions.https.HttpsError("invalid-argument", "Missing orderId or paymentMethod.");
    }
    // 1. Verify Order Ownership and Status
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Order not found.");
    }
    const order = orderSnap.data();
    if (order.customerId !== context.auth.uid && order.customerId !== `guest_${context.auth.uid}`) {
        // Allow if it matches auth UID logic (some apps link guest to auth later, but here strict)
        if (order.customerId !== context.auth.uid) {
            throw new functions.https.HttpsError("permission-denied", "You are not the owner of this order.");
        }
    }
    if (order.status === 'PAID' || order.status === 'COMPLETED') {
        throw new functions.https.HttpsError("failed-precondition", "Order is already paid.");
    }
    // 2. Initiate Payment via Factory
    try {
        // Assume factory is imported (added in previous step)
        const provider = PaymentService_1.PaymentFactory.getProvider(paymentMethod);
        // Prepare Request
        const request = {
            orderId,
            amount: order.total,
            currency: 'USD',
            payerId: context.auth.uid,
            paymentMethod,
            paymentDetails
        };
        const result = await provider.initiate(request);
        // 3. Update Order based on Result
        if (result.success) {
            await orderRef.update({
                paymentStatus: result.status,
                paymentGatewayRef: result.transactionId || null,
                paymentMethod: paymentMethod,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // If immediate success (e.g. Card Mock), we might want to auto-move Order Status to 'CONFIRMED'
            // For PENDING (Mobile Money), we wait for callback or manual confirmation.
            if (result.status === 'COMPLETED') {
                await orderRef.update({
                    status: 'CONFIRMED',
                    isPaid: true
                });
            }
        }
        return result;
    }
    catch (e) {
        console.error("Payment Initiation Failed:", e);
        throw new functions.https.HttpsError("internal", e.message || "Payment Gateway Error");
    }
});
//# sourceMappingURL=index.js.map