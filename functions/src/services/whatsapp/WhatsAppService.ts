import * as functions from 'firebase-functions';
import axios from 'axios';
import { ICommunicationProvider, NotificationPayload } from '../CommunicationService';

export class WhatsAppService implements ICommunicationProvider {
    channel: 'WHATSAPP' = 'WHATSAPP';
    private config: any;

    constructor() {
        const config = functions.config().whatsapp;
        this.config = config;
    }

    async send(payload: NotificationPayload): Promise<boolean> {
        console.log(`[WhatsAppService] Sending to ${payload.to}`);

        if (!this.config || !this.config.token || !this.config.phone_id) {
            console.log(`[WhatsAppService-MOCK] Template: ${payload.templateId}`);
            console.log(`[WhatsAppService-MOCK] Variables:`, payload.data);
            return true;
        }

        try {
            const url = `https://graph.facebook.com/v17.0/${this.config.phone_id}/messages`;
            await axios.post(url, {
                messaging_product: "whatsapp",
                to: payload.to,
                type: "template",
                template: {
                    name: payload.templateId,
                    language: { code: "en_US" },
                    components: [
                        {
                            type: "body",
                            parameters: Object.keys(payload.data || {}).map(key => ({
                                type: "text",
                                text: payload.data![key]
                            }))
                        }
                    ]
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${this.config.token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log("[WhatsAppService] Message sent.");
            return true;
        } catch (error: any) {
            console.error("[WhatsAppService] API Error:", error.response?.data || error.message);
            return false;
        }
    }
}
