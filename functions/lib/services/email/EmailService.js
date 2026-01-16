"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");
class EmailService {
    constructor() {
        this.channel = 'EMAIL';
    }
    async getConfig() {
        var _a, _b, _c, _d, _e;
        try {
            const doc = await admin.firestore().collection('system_config').doc('global').get();
            if (doc.exists && ((_c = (_b = (_a = doc.data()) === null || _a === void 0 ? void 0 : _a.integrations) === null || _b === void 0 ? void 0 : _b.smtp) === null || _c === void 0 ? void 0 : _c.active)) {
                return (_e = (_d = doc.data()) === null || _d === void 0 ? void 0 : _d.integrations) === null || _e === void 0 ? void 0 : _e.smtp;
            }
            return null;
        }
        catch (e) {
            console.error("EmailService: Config Fetch Error", e);
            return null;
        }
    }
    async send(payload) {
        const config = await this.getConfig();
        if (!config) {
            console.log(`[EmailService-MOCK] (No Active SMTP Config) Subject: ${payload.subject}`);
            return true;
        }
        try {
            const transporter = nodemailer.createTransport({
                host: config.host,
                port: parseInt(config.port) || 587,
                secure: parseInt(config.port) === 465,
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
        }
        catch (error) {
            console.error("[EmailService] Failed:", error);
            return false;
        }
    }
}
exports.EmailService = EmailService;
//# sourceMappingURL=EmailService.js.map