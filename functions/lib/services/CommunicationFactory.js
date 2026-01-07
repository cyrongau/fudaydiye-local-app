"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationFactory = void 0;
const EmailService_1 = require("./email/EmailService");
const SmsService_1 = require("./sms/SmsService");
const WhatsAppService_1 = require("./whatsapp/WhatsAppService");
class CommunicationFactory {
    static getService(type) {
        switch (type) {
            case 'EMAIL':
                return new EmailService_1.EmailService();
            case 'SMS':
                return new SmsService_1.SmsService();
            case 'WHATSAPP':
                return new WhatsAppService_1.WhatsAppService();
            default:
                throw new Error(`Service type ${type} not supported.`);
        }
    }
}
exports.CommunicationFactory = CommunicationFactory;
//# sourceMappingURL=CommunicationFactory.js.map