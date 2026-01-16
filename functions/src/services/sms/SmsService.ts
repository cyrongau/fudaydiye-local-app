import * as admin from 'firebase-admin';
// import axios from 'axios'; // Unused until Twilio/MSG91 active
import { ICommunicationProvider, NotificationPayload } from '../CommunicationService';

export class SmsService implements ICommunicationProvider {
    channel: 'SMS' = 'SMS';

    private async getConfig() {
        try {
            const doc = await admin.firestore().collection('system_config').doc('global').get();
            if (doc.exists && doc.data()?.integrations?.sms?.active) {
                return doc.data()?.integrations?.sms;
            }
            return null;
        } catch (e) {
            console.error("SmsService: Config Fetch Error", e);
            return null;
        }
    }

    async send(payload: NotificationPayload): Promise<boolean> {
        const config = await this.getConfig();
        const provider = config?.provider || 'MOCK';

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
        } catch (error: any) {
            console.error(`[SmsService] ${provider} Failed:`, error);
            return false;
        }
    }
}
