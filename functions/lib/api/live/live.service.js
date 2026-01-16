"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LiveService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveService = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
let LiveService = LiveService_1 = class LiveService {
    constructor() {
        this.logger = new common_1.Logger(LiveService_1.name);
        this.db = admin.firestore();
    }
    async getReplays(hostId) {
        try {
            // Future: filter by hostId
            // For now, list all from 'live_replays' or filter
            // const snap = await this.db.collection('live_replays').where('hostId', '==', hostId).get();
            // Temporary: Return Mocks if empty, or fetch real
            const snap = await this.db.collection('live_replays').where('hostId', '==', hostId).limit(10).get();
            if (snap.empty) {
                return [];
            }
            return snap.docs.map(doc => {
                var _a;
                return (Object.assign(Object.assign({ id: doc.id }, doc.data()), { createdAt: ((_a = doc.data().createdAt) === null || _a === void 0 ? void 0 : _a.toDate()) || new Date() }));
            });
        }
        catch (e) {
            this.logger.error(e);
            return [];
        }
    }
    async getHostProducts(hostId) {
        try {
            // Fetch products where vendorId == hostId
            const snap = await this.db.collection('products')
                .where('vendorId', '==', hostId)
                .where('status', '==', 'PUBLISHED')
                .limit(20)
                .get();
            return snap.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        }
        catch (e) {
            this.logger.error(e);
            return [];
        }
    }
    async createSession(dto, vendorId, vendorName, hostAvatar) {
        const { title, category, mode, productIds } = dto;
        const docRef = await this.db.collection('live_sessions').add({
            vendorId,
            hostId: vendorId,
            vendorName: vendorName || "Merchant",
            hostAvatar: hostAvatar || "",
            title,
            category,
            status: mode === 'LIVE' ? 'LIVE' : 'SCHEDULED',
            viewerCount: 0,
            productIds: productIds || [],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            likes: 0
        });
        return { id: docRef.id };
    }
    async updateStatus(sessionId, status, vendorId) {
        var _a;
        const docRef = this.db.collection('live_sessions').doc(sessionId);
        const doc = await docRef.get();
        if (!doc.exists)
            throw new Error("Session not found");
        if (((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.vendorId) !== vendorId)
            throw new Error("Unauthorized");
        const updateData = { status };
        if (status === 'ENDED') {
            updateData.endedAt = admin.firestore.FieldValue.serverTimestamp();
        }
        await docRef.update(updateData);
        return { success: true };
    }
    async pinProduct(sessionId, productId, vendorId) {
        var _a, _b;
        const docRef = this.db.collection('live_sessions').doc(sessionId);
        const doc = await docRef.get();
        if (!doc.exists)
            throw new Error("Session not found");
        if (((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.vendorId) !== vendorId)
            throw new Error("Unauthorized");
        // Fetch Product Details for denormalization
        const productSnap = await this.db.collection('products').doc(productId).get();
        if (!productSnap.exists)
            throw new Error("Product not found");
        const product = productSnap.data();
        await docRef.update({
            featuredProductId: productId,
            featuredProductName: product.name,
            featuredProductPrice: product.salePrice > 0 ? product.salePrice : product.basePrice,
            featuredProductImg: ((_b = product.images) === null || _b === void 0 ? void 0 : _b[0]) || null
        });
        return { success: true };
    }
    async updateSession(sessionId, data, vendorId) {
        var _a;
        const docRef = this.db.collection('live_sessions').doc(sessionId);
        const doc = await docRef.get();
        if (!doc.exists)
            throw new Error("Session not found");
        // Admin override check or vendor match
        if (((_a = doc.data()) === null || _a === void 0 ? void 0 : _a.vendorId) !== vendorId) {
            // If needed check for ADMIN role, but simplistic check here matches current controller logic
            throw new Error("Unauthorized");
        }
        const allowedUpdates = Object.assign({}, data);
        // Sanitize sensitive fields if necessary (like hostId, vendorId - ensure they aren't overwritten easily)
        delete allowedUpdates.vendorId;
        delete allowedUpdates.hostId;
        allowedUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        await docRef.update(allowedUpdates);
        return { success: true };
    }
};
LiveService = LiveService_1 = __decorate([
    (0, common_1.Injectable)()
], LiveService);
exports.LiveService = LiveService;
//# sourceMappingURL=live.service.js.map