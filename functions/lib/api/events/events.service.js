"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EventsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
const event_emitter_1 = require("@nestjs/event-emitter");
let EventsService = EventsService_1 = class EventsService {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(EventsService_1.name);
        this.db = admin.firestore();
    }
    async logEvent(userId, type, data = {}) {
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
            this.eventEmitter.emit(type, Object.assign({ userId, type }, data));
        }
        catch (e) {
            this.logger.error(`Failed to log event: ${e}`);
        }
    }
    async getUserEvents(userId, limit = 20) {
        const snapshot = await this.db.collection('events')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
    }
};
EventsService = EventsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [event_emitter_1.EventEmitter2])
], EventsService);
exports.EventsService = EventsService;
//# sourceMappingURL=events.service.js.map