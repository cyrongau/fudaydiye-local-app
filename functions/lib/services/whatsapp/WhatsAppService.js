"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const functions = require("firebase-functions/v1");
const axios_1 = require("axios");
class WhatsAppService {
    constructor() {
        this.channel = 'WHATSAPP';
        const config = functions.config().whatsapp;
        this.config = config;
    }
    async send(payload) {
        var _a;
        console.log(`[WhatsAppService] Sending to ${payload.to}`);
        if (!this.config || !this.config.token || !this.config.phone_id) {
            console.log(`[WhatsAppService-MOCK] Template: ${payload.templateId}`);
            console.log(`[WhatsAppService-MOCK] Variables:`, payload.data);
            return true;
        }
        try {
            const url = `https://graph.facebook.com/v17.0/${this.config.phone_id}/messages`;
            await axios_1.default.post(url, {
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
                                text: payload.data[key]
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
        }
        catch (error) {
            console.error("[WhatsAppService] API Error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            return false;
        }
    }
}
exports.WhatsAppService = WhatsAppService;
//# sourceMappingURL=WhatsAppService.js.map