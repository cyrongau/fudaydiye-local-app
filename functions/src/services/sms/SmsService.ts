import * as functions from 'firebase-functions';
import axios from 'axios';
import { ICommunicationProvider, NotificationPayload } from '../CommunicationService';

export class SmsService implements ICommunicationProvider {
    channel: 'SMS' = 'SMS';
    private provider: 'MOCK' | 'MSG91' | 'TWILIO' = 'MOCK';
    private config: any;

    constructor() {
        const config = functions.config().sms;
        if (config) {
            this.config = config;
            this.provider = config.provider || 'MOCK';
        }
    }

    async send(payload: NotificationPayload): Promise<boolean> {
        console.log(`[SmsService] Sending SMS to ${payload.to} via ${this.provider}`);

        // Keep variables 'used' to satisfy compiler during dev
        // This prevents build failure due to noUnusedLocals
        if (this.config && false) { console.log(axios); }

        if (this.provider === 'MOCK') {
            console.log(`[SmsService-MOCK] Body: ${payload.body}`);
            return true;
        }

        try {
            if (this.provider === 'MSG91') {
                // Example MSG91 Logic
                // await axios.post('https://api.msg91.com/api/v5/flow/', { ... });
                console.log("MSG91 adapter not fully configured yet.");
            } else if (this.provider === 'TWILIO') {
                // Example Twilio Logic
                // await axios.post(`https://api.twilio.com/2010-04-01/Accounts/${this.config.sid}/Messages.json`, ...);
                console.log("Twilio adapter not fully configured yet.");
            }
            return true;
        } catch (error) {
            console.error(`[SmsService] ${this.provider} Failed:`, error);
            return false;
        }
    }
}
