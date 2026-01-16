import * as nodemailer from 'nodemailer';
import * as admin from 'firebase-admin';
import { ICommunicationProvider, NotificationPayload } from '../CommunicationService';

export class EmailService implements ICommunicationProvider {
    channel: 'EMAIL' = 'EMAIL';

    private async getConfig() {
        try {
            const doc = await admin.firestore().collection('system_config').doc('global').get();
            if (doc.exists && doc.data()?.integrations?.smtp?.active) {
                return doc.data()?.integrations?.smtp;
            }
            return null;
        } catch (e) {
            console.error("EmailService: Config Fetch Error", e);
            return null;
        }
    }

    async send(payload: NotificationPayload): Promise<boolean> {
        const config = await this.getConfig();

        if (!config) {
            console.log(`[EmailService-MOCK] (No Active SMTP Config) Subject: ${payload.subject}`);
            return true;
        }

        try {
            const transporter = nodemailer.createTransport({
                host: config.host,
                port: parseInt(config.port) || 587,
                secure: parseInt(config.port) === 465, // true for 465, false for other ports
                auth: {
                    user: config.user,
                    pass: config.pass,
                },
            });

            await transporter.sendMail({
                from: config.fromEmail || "noreply@fudaydiye.so",
                to: payload.to,
                subject: payload.subject || "Notification",
                text: payload.body,
                html: payload.body // Assuming HTML
            });

            console.log(`[EmailService] Sent successfully to ${payload.to}`);
            return true;
        } catch (error) {
            console.error("[EmailService] Failed:", error);
            return false;
        }
    }
}
