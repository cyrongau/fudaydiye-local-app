import * as functions from "firebase-functions/v1";
// Force rebuild 17
import * as admin from "firebase-admin";
import { CommunicationFactory } from "./services/CommunicationFactory";
// import { handleNestRequest } from './api/bootstrap'; // Moved to dynamic import

// Initialize Firebase Admin (Singleton)
admin.initializeApp();
const db = admin.firestore();

// ==========================================
// Cloud Firestore Triggers (Background)
// ==========================================

// Trigger to notify vendor on new order
export const onOrderCreated = functions.firestore
    .document('orders/{orderId}')
    .onCreate(async (snap, context: functions.EventContext) => {
        const order = snap.data();
        if (!order) return;

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
            const smsService = CommunicationFactory.getService('SMS');
            await smsService.send({
                to: "DO_NOT_SEND_REAL", // Mocked
                body: `FDDY Vendor: New Order #${order.orderNumber} received. Value: $${order.total}. Please pack immediately.`
            });
            console.log("Infra: external notification triggered.");
        } catch (e) {
            console.error("Infra: external notification failed", e);
        }
    });

// ==========================================
// Security Triggers
// ==========================================
export { onVendorSuspended } from './triggers/vendorTriggers';

// ==========================================
// NestJS API (The Monolith)
// ==========================================
// Handles:
// - /orders (Create, Pay)
// - /products (CUD)
// - /auth (OTP Request, Verify)

export const api = functions
    .runWith({
        memory: '1GB',
        timeoutSeconds: 120,
    })
    .https.onRequest(async (req, res) => {
        // Set CORS headers manually - allow all origins for testing
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Max-Age', '3600');

        // Handle preflight OPTIONS request
        if (req.method === 'OPTIONS') {
            res.status(204).end();
            return;
        }

        // Lazy load NestJS to prevent cold start timeouts during deployment/init
        const { handleNestRequest } = await import('./api/bootstrap');
        return handleNestRequest(req, res);
    });
