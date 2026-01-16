import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface EventLog {
    userId: string;
    type: string; // e.g., 'ORDER_PLACED', 'LIVE_JOINED', 'REVIEW_ADDED'
    metadata?: any;
    relatedEntityId?: string; // orderId, productId, sessionId
    createdAt: Date;
    read: boolean;
}

@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name);
    private db = admin.firestore();

    constructor(private eventEmitter: EventEmitter2) { }

    async logEvent(userId: string, type: string, data: { metadata?: any, relatedEntityId?: string } = {}) {
        try {
            await this.db.collection('events').add({
                userId,
                type,
                metadata: data.metadata || {},
                relatedEntityId: data.relatedEntityId || null,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                read: false
            });
            this.logger.log(`Event Logged: ${type} for ${userId}`);

            // Broadcast Internal Event
            this.eventEmitter.emit(type, { userId, type, ...data });
        } catch (e) {
            this.logger.error(`Failed to log event: ${e}`);
        }
    }

    async getUserEvents(userId: string, limit: number = 20) {
        const snapshot = await this.db.collection('events')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // detailed timestamp handling if needed
        }));
    }
}
