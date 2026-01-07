import * as nodemailer from 'nodemailer';
import * as functions from 'firebase-functions';
import { ICommunicationProvider, NotificationPayload } from '../CommunicationService';

export class EmailService implements ICommunicationProvider {
    channel: 'EMAIL' = 'EMAIL';
    private transporter: nodemailer.Transporter | null = null;
    private fromEmail: string = "noreply@fddy-commerce.com";

    constructor() {
        const config = functions.config().email;
        if (config && config.smtp_host) {
            this.transporter = nodemailer.createTransport({
                host: config.smtp_host,
                port: parseInt(config.smtp_port) || 587,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: config.smtp_user,
                    pass: config.smtp_pass,
                },
            });
            this.fromEmail = config.from_email || this.fromEmail;
        } else {
            console.log("EmailService: No SMTP config found. Running in MOCK mode.");
        }
    }

    async send(payload: NotificationPayload): Promise<boolean> {
        console.log(`[EmailService] Attempting to send to ${payload.to}`);

        if (!this.transporter) {
            console.log(`[EmailService-MOCK] Subject: ${payload.subject}`);
            console.log(`[EmailService-MOCK] Body: ${payload.body}`);
            return true;
        }

        try {
            await this.transporter.sendMail({
                from: this.fromEmail,
                to: payload.to,
                subject: payload.subject || "Notification",
                text: payload.body,
                html: payload.body // Assuming body is HTML safe or simple text
            });
            console.log(`[EmailService] Sent successfully to ${payload.to}`);
            return true;
        } catch (error) {
            console.error("[EmailService] Failed:", error);
            return false;
        }
    }
}
