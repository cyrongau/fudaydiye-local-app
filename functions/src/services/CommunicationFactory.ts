import { ICommunicationProvider } from './CommunicationService';
import { EmailService } from './email/EmailService';
import { SmsService } from './sms/SmsService';
import { WhatsAppService } from './whatsapp/WhatsAppService';

export class CommunicationFactory {
    static getService(type: 'EMAIL' | 'SMS' | 'WHATSAPP'): ICommunicationProvider {
        switch (type) {
            case 'EMAIL':
                return new EmailService();
            case 'SMS':
                return new SmsService();
            case 'WHATSAPP':
                return new WhatsAppService();
            default:
                throw new Error(`Service type ${type} not supported.`);
        }
    }
}
