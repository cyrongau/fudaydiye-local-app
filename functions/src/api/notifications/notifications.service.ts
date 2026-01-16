import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CommunicationFactory } from '../../services/CommunicationFactory';
import * as admin from 'firebase-admin';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    private db = admin.firestore();

    @OnEvent('ORDER_PLACED')
    async handleOrderPlacedEvent(payload: any) {
        this.logger.log(`Processing Order Notification for ${payload.userId}`);
        // 1. Fetch User Email
        try {
            const userDoc = await this.db.collection('users').doc(payload.userId).get();
            if (!userDoc.exists) return;
            const userData = userDoc.data();
            if (!userData) return;
            const email = userData.email;

            if (email) {
                await this.sendGenericNotification(
                    'EMAIL',
                    email,
                    `Order Confirmation #${payload.metadata?.orderNumber}`,
                    `Thank you for your order! Your order #${payload.metadata?.orderNumber} has been placed successfully. Total: ${payload.metadata?.total}`
                );
            }
            if (userData.mobile) {
                await this.sendGenericNotification(
                    'SMS',
                    userData.mobile,
                    '',
                    `Fudaydiye: Order #${payload.metadata?.orderNumber} confirmed! Total: ${payload.metadata?.total}.`
                );
            }

            // Send Push Notification
            await this.sendPushNotification(
                payload.userId,
                `Order Confirmation`,
                `Order #${payload.metadata?.orderNumber} placed successfully!`,
                { type: 'ORDER', id: payload.metadata?.orderId }
            );

        } catch (e) {
            this.logger.error(`Failed to handle Order Event: ${e}`);
        }
    }

    @OnEvent('ORDER_STATUS_CHANGED')
    async handleOrderStatusChangedEvent(payload: any) {
        const { status, orderId } = payload.metadata || {};
        // const vendorId = payload.userId; // Event logged by vendor

        if (['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) {
            this.logger.log(`Processing ${status} Notification for Order ${orderId}`);
            try {
                // 1. Need Customer ID. Fetch Order.
                const orderDoc = await this.db.collection('orders').doc(orderId).get();
                if (!orderDoc.exists) return;
                const orderData = orderDoc.data();
                if (!orderData) return;
                const customerId = orderData.customerId;

                // 2. Fetch Customer Email & Phone
                const userDoc = await this.db.collection('users').doc(customerId).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    if (!userData) return;
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
                    await this.sendPushNotification(
                        customerId,
                        subject,
                        smsBody, // Use SMS body as it's concise
                        { type: 'ORDER', id: orderId, status }
                    );
                }
            } catch (e) {
                this.logger.error(`Failed to handle ${status} Event: ${e}`);
            }
        }
    }

    async registerFcmToken(userId: string, token: string) {
        if (!userId || !token) throw new BadRequestException("Missing data");
        try {
            // Save token to a subcollection to support multiple devices per user
            await this.db.collection('users').doc(userId).collection('fcm_tokens').doc(token).set({
                token,
                lastActive: new Date(),
                platform: 'mobile' // TODO: Detect platform from headers if needed
            });
            return { success: true };
        } catch (e) {
            this.logger.error(`Token Reg Failed: ${e}`);
            throw new BadRequestException("Failed to save token");
        }
    }

    async sendTestNotification(type: 'EMAIL' | 'SMS', to: string) {
        try {
            const service = CommunicationFactory.getService(type);
            const success = await service.send({
                to,
                subject: `FDDY Test ${type}`,
                body: `This is a test notification from the Fudaydiye Ecosystem used to verify your ${type} configuration at ${new Date().toISOString()}.`
            });

            if (!success) throw new BadRequestException(`Failed to send ${type} notification. Check server logs.`);

            return { success: true, message: `${type} sent to ${to}` };
        } catch (error) {
            this.logger.error(`Test Notification Failed: ${error}`);
            throw new BadRequestException("Notification failed");
        }
    }

    async sendGenericNotification(type: 'EMAIL' | 'SMS', to: string, subject: string, body: string) {
        try {
            const service = CommunicationFactory.getService(type);
            const success = await service.send({ to, subject, body });
            return { success };
        } catch (error) {
            this.logger.error(`Generic Notification Failed: ${error}`);
            throw new BadRequestException("Notification failed");
        }
    }

    // --- Private Push Methods ---

    private async sendPushNotification(userId: string, title: string, body: string, data: any = {}) {
        try {
            // 1. Get tokens
            const tokensSnap = await this.db.collection('users').doc(userId).collection('fcm_tokens').get();
            if (tokensSnap.empty) return;

            const tokens = tokensSnap.docs.map(d => d.data().token);

            // 2. Construct Multicast Message
            // Type definition hack for admin.messaging if needed, but mostly standard
            const message: admin.messaging.MulticastMessage = {
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
                const failedTokens: string[] = [];
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

        } catch (e) {
            this.logger.error(`Push logic failed: ${e}`);
        }
    }
}
