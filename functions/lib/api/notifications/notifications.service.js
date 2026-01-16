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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const CommunicationFactory_1 = require("../../services/CommunicationFactory");
const admin = require("firebase-admin");
const event_emitter_1 = require("@nestjs/event-emitter");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor() {
        this.logger = new common_1.Logger(NotificationsService_1.name);
        this.db = admin.firestore();
    }
    async handleOrderPlacedEvent(payload) {
        var _a, _b, _c, _d, _e, _f, _g;
        this.logger.log(`Processing Order Notification for ${payload.userId}`);
        // 1. Fetch User Email
        try {
            const userDoc = await this.db.collection('users').doc(payload.userId).get();
            if (!userDoc.exists)
                return;
            const userData = userDoc.data();
            if (!userData)
                return;
            const email = userData.email;
            if (email) {
                await this.sendGenericNotification('EMAIL', email, `Order Confirmation #${(_a = payload.metadata) === null || _a === void 0 ? void 0 : _a.orderNumber}`, `Thank you for your order! Your order #${(_b = payload.metadata) === null || _b === void 0 ? void 0 : _b.orderNumber} has been placed successfully. Total: ${(_c = payload.metadata) === null || _c === void 0 ? void 0 : _c.total}`);
            }
            if (userData.mobile) {
                await this.sendGenericNotification('SMS', userData.mobile, '', `Fudaydiye: Order #${(_d = payload.metadata) === null || _d === void 0 ? void 0 : _d.orderNumber} confirmed! Total: ${(_e = payload.metadata) === null || _e === void 0 ? void 0 : _e.total}.`);
            }
            // Send Push Notification
            await this.sendPushNotification(payload.userId, `Order Confirmation`, `Order #${(_f = payload.metadata) === null || _f === void 0 ? void 0 : _f.orderNumber} placed successfully!`, { type: 'ORDER', id: (_g = payload.metadata) === null || _g === void 0 ? void 0 : _g.orderId });
        }
        catch (e) {
            this.logger.error(`Failed to handle Order Event: ${e}`);
        }
    }
    async handleOrderStatusChangedEvent(payload) {
        const { status, orderId } = payload.metadata || {};
        // const vendorId = payload.userId; // Event logged by vendor
        if (['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) {
            this.logger.log(`Processing ${status} Notification for Order ${orderId}`);
            try {
                // 1. Need Customer ID. Fetch Order.
                const orderDoc = await this.db.collection('orders').doc(orderId).get();
                if (!orderDoc.exists)
                    return;
                const orderData = orderDoc.data();
                if (!orderData)
                    return;
                const customerId = orderData.customerId;
                // 2. Fetch Customer Email & Phone
                const userDoc = await this.db.collection('users').doc(customerId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    if (!userData)
                        return;
                    const email = userData.email;
                    const mobile = userData.mobile;
                    let subject = '';
                    let body = '';
                    let smsBody = '';
                    switch (status) {
                        case 'SHIPPED':
                            subject = `Order Dispatched 🚚 #${orderData.orderNumber}`;
                            body = `Good news! Your order #${orderData.orderNumber} has been shipped. Track it in your profile.`;
                            smsBody = `Fudaydiye: Order #${orderData.orderNumber} has been SHIPPED! 🚚 Track it online.`;
                            break;
                        case 'DELIVERED':
                            subject = `Order Delivered ✅ #${orderData.orderNumber}`;
                            body = `Your order #${orderData.orderNumber} has been delivered. Enjoy!`;
                            smsBody = `Fudaydiye: Order #${orderData.orderNumber} is DELIVERED! ✅ Enjoy your purchase.`;
                            break;
                        case 'CANCELLED':
                            subject = `Order Cancelled ❌ #${orderData.orderNumber}`;
                            body = `Your order #${orderData.orderNumber} has been cancelled. If this was a mistake, please contact support.`;
                            smsBody = `Fudaydiye: Order #${orderData.orderNumber} was CANCELLED. Contact support for help.`;
                            break;
                    }
                    if (email) {
                        await this.sendGenericNotification('EMAIL', email, subject, body);
                    }
                    if (mobile) {
                        await this.sendGenericNotification('SMS', mobile, '', smsBody);
                    }
                    // Send Push Notification
                    await this.sendPushNotification(customerId, subject, smsBody, // Use SMS body as it's concise
                    { type: 'ORDER', id: orderId, status });
                }
            }
            catch (e) {
                this.logger.error(`Failed to handle ${status} Event: ${e}`);
            }
        }
    }
    async registerFcmToken(userId, token) {
        if (!userId || !token)
            throw new common_1.BadRequestException("Missing data");
        try {
            // Save token to a subcollection to support multiple devices per user
            await this.db.collection('users').doc(userId).collection('fcm_tokens').doc(token).set({
                token,
                lastActive: new Date(),
                platform: 'mobile' // TODO: Detect platform from headers if needed
            });
            return { success: true };
        }
        catch (e) {
            this.logger.error(`Token Reg Failed: ${e}`);
            throw new common_1.BadRequestException("Failed to save token");
        }
    }
    async sendTestNotification(type, to) {
        try {
            const service = CommunicationFactory_1.CommunicationFactory.getService(type);
            const success = await service.send({
                to,
                subject: `FDDY Test ${type}`,
                body: `This is a test notification from the Fudaydiye Ecosystem used to verify your ${type} configuration at ${new Date().toISOString()}.`
            });
            if (!success)
                throw new common_1.BadRequestException(`Failed to send ${type} notification. Check server logs.`);
            return { success: true, message: `${type} sent to ${to}` };
        }
        catch (error) {
            this.logger.error(`Test Notification Failed: ${error}`);
            throw new common_1.BadRequestException("Notification failed");
        }
    }
    async sendGenericNotification(type, to, subject, body) {
        try {
            const service = CommunicationFactory_1.CommunicationFactory.getService(type);
            const success = await service.send({ to, subject, body });
            return { success };
        }
        catch (error) {
            this.logger.error(`Generic Notification Failed: ${error}`);
            throw new common_1.BadRequestException("Notification failed");
        }
    }
    // --- Private Push Methods ---
    async sendPushNotification(userId, title, body, data = {}) {
        try {
            // 1. Get tokens
            const tokensSnap = await this.db.collection('users').doc(userId).collection('fcm_tokens').get();
            if (tokensSnap.empty)
                return;
            const tokens = tokensSnap.docs.map(d => d.data().token);
            // 2. Construct Multicast Message
            // Type definition hack for admin.messaging if needed, but mostly standard
            const message = {
                tokens: tokens,
                notification: {
                    title: title,
                    body: body
                },
                data: data,
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        channelId: 'default'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default'
                        }
                    }
                }
            };
            // 3. Send
            const response = await admin.messaging().sendEachForMulticast(message);
            // 4. Cleanup invalid tokens
            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push(tokens[idx]);
                    }
                });
                // TODO: Delete failed tokens
                // this.cleanupTokens(userId, failedTokens);
                this.logger.warn(`Push failed for ${response.failureCount} tokens`);
            }
            this.logger.log(`Push sent to ${response.successCount} devices for user ${userId}`);
        }
        catch (e) {
            this.logger.error(`Push logic failed: ${e}`);
        }
    }
};
__decorate([
    (0, event_emitter_1.OnEvent)('ORDER_PLACED'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "handleOrderPlacedEvent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('ORDER_STATUS_CHANGED'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsService.prototype, "handleOrderStatusChangedEvent", null);
NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)()
], NotificationsService);
exports.NotificationsService = NotificationsService;
//# sourceMappingURL=notifications.service.js.map