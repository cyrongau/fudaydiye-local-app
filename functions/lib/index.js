"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = exports.onVendorSuspended = exports.onOrderCreated = void 0;
const functions = require("firebase-functions/v1");
// Force rebuild 17
const admin = require("firebase-admin");
const cors = require("cors");
const CommunicationFactory_1 = require("./services/CommunicationFactory");
// import { handleNestRequest } from './api/bootstrap'; // Moved to dynamic import
// Initialize Firebase Admin (Singleton)
admin.initializeApp();
const db = admin.firestore();
// ==========================================
// Cloud Firestore Triggers (Background)
// ==========================================
// Trigger to notify vendor on new order
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
    // 2. External Notifications (SMS/Email)
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
// ==========================================
// Security Triggers
// ==========================================
var vendorTriggers_1 = require("./triggers/vendorTriggers");
Object.defineProperty(exports, "onVendorSuspended", { enumerable: true, get: function () { return vendorTriggers_1.onVendorSuspended; } });
// ==========================================
// NestJS API (The Monolith)
// ==========================================
// Handles:
// - /orders (Create, Pay)
// - /products (CUD)
// - /auth (OTP Request, Verify)
// Configure CORS middleware
const corsHandler = cors({
    origin: [
        'https://fudaydiye.com',
        'https://www.fudaydiye.com',
        'https://fudaydiye-commerce-1097895058938.us-central1.run.app',
        'https://fudaydiye-commerce.web.app',
        'http://localhost:5173',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
});
exports.api = functions
    .runWith({
    memory: '1GB',
    timeoutSeconds: 120,
})
    .https.onRequest(async (req, res) => {
    // Apply CORS middleware
    return corsHandler(req, res, async () => {
        // Lazy load NestJS to prevent cold start timeouts during deployment/init
        const { handleNestRequest } = await Promise.resolve().then(() => require('./api/bootstrap'));
        return handleNestRequest(req, res);
    });
});
//# sourceMappingURL=index.js.map