
export type ChannelType = 'EMAIL' | 'SMS' | 'WHATSAPP';

export interface NotificationPayload {
    to: string; // Phone or Email based on channel
    subject?: string;
    body: string;
    templateId?: string; // For WA/SMS templates variables
    data?: Record<string, string>; // Dynamic variables
}

export interface ICommunicationProvider {
    send(payload: NotificationPayload): Promise<boolean>;
    channel: ChannelType;
}

export interface ICommunicationService {
    sendEmail(to: string, subject: string, body: string): Promise<boolean>;
    sendSms(to: string, message: string): Promise<boolean>;
    sendWhatsApp(to: string, template: string, variables?: any): Promise<boolean>;
}
