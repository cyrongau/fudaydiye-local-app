"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const admin = require("firebase-admin");
class SmsService {
    constructor() {
        this.channel = 'SMS';
    }
    async getConfig() {
        var _a, _b, _c, _d, _e;
        try {
            const doc = await admin.firestore().collection('system_config').doc('global').get();
            if (doc.exists && ((_c = (_b = (_a = doc.data()) === null || _a === void 0 ? void 0 : _a.integrations) === null || _b === void 0 ? void 0 : _b.sms) === null || _c === void 0 ? void 0 : _c.active)) {
                return (_e = (_d = doc.data()) === null || _d === void 0 ? void 0 : _d.integrations) === null || _e === void 0 ? void 0 : _e.sms;
            }
            return null;
        }
        catch (e) {
            console.error("SmsService: Config Fetch Error", e);
            return null;
        }
    }
    async send(payload) {
        const config = await this.getConfig();
        const provider = (config === null || config === void 0 ? void 0 : config.provider) || 'MOCK';
        console.log(`[SmsService] Sending SMS to ${payload.to} via ${provider}`);
        if (provider === 'MOCK' || !config) {
            console.log(`[SmsService-MOCK] Body: ${payload.body}`);
            return true;
        }
        try {
            if (provider === 'firebase') {
                // Firebase Auth SMS is mainly for OTP. For generic SMS via Firebase, 
                // we typically use Extensions or FCM. 
                // Here we will just log it as a "Firebase Event" for now, or 
                // potentially create a custom collection that a cloud function trigger could pick up if we were using an extension.
                console.log(`[SmsService-FIREBASE] (Simulated) To: ${payload.to}, Body: ${payload.body}`);
                // In a real scenario, we might delegate to:
                // admin.messaging().send(...) if it was a push notif, but for SMS this is usually adequate for the "Firebase integration" placeholder
                return true;
            }
            if (provider === 'msg91') {
                // await axios.post('https://api.msg91.com/api/v5/flow/', { ... });
                console.log(`[SmsService-MSG91] (Simulated) Key: ${config.apiKey}`);
                return true;
            }
            if (provider === 'twilio') {
                const sid = config.sid || process.env.TWILIO_ACCOUNT_SID; // Fallback
                const token = config.token || process.env.TWILIO_AUTH_TOKEN; // Fallback
                const from = config.fromNumber || process.env.TWILIO_FROM_NUMBER;
                if (!sid || !token || !from) {
                    console.error('[SmsService-TWILIO] Missing Credentials');
                    return false;
                }
                const client = require('twilio')(sid, token);
                const message = await client.messages.create({
                    body: payload.body,
                    from: from,
                    to: payload.to
                });
                console.log(`[SmsService-TWILIO] Sent SID: ${message.sid}`);
                return true;
            }
            return true;
        }
        catch (error) {
            console.error(`[SmsService] ${provider} Failed:`, error);
            return false;
        }
    }
}
exports.SmsService = SmsService;
//# sourceMappingURL=SmsService.js.map