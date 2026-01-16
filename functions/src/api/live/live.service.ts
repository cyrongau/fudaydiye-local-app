
import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class LiveService {
    private readonly logger = new Logger(LiveService.name);
    private db = admin.firestore();

    async getReplays(hostId: string) {
        try {
            // Future: filter by hostId
            // For now, list all from 'live_replays' or filter
            // const snap = await this.db.collection('live_replays').where('hostId', '==', hostId).get();

            // Temporary: Return Mocks if empty, or fetch real
            const snap = await this.db.collection('live_replays').where('hostId', '==', hostId).limit(10).get();

            if (snap.empty) {
                return [];
            }

            return snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));
        } catch (e) {
            this.logger.error(e);
            return [];
        }
    }

    async getHostProducts(hostId: string) {
        try {
            // Fetch products where vendorId == hostId
            const snap = await this.db.collection('products')
                .where('vendorId', '==', hostId)
                .where('status', '==', 'PUBLISHED')
                .limit(20)
                .get();

            return snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (e) {
            this.logger.error(e);
            return [];
        }
    }


    async createSession(dto: any, vendorId: string, vendorName: string, hostAvatar: string) {
        const { title, category, mode, productIds } = dto;

        const docRef = await this.db.collection('live_sessions').add({
            vendorId,
            hostId: vendorId, // Legacy/Rule support
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

    async updateStatus(sessionId: string, status: string, vendorId: string) {
        const docRef = this.db.collection('live_sessions').doc(sessionId);
        const doc = await docRef.get();

        if (!doc.exists) throw new Error("Session not found");
        if (doc.data()?.vendorId !== vendorId) throw new Error("Unauthorized");

        const updateData: any = { status };
        if (status === 'ENDED') {
            updateData.endedAt = admin.firestore.FieldValue.serverTimestamp();
        }

        await docRef.update(updateData);
        return { success: true };
    }

    async pinProduct(sessionId: string, productId: string, vendorId: string) {
        const docRef = this.db.collection('live_sessions').doc(sessionId);
        const doc = await docRef.get();

        if (!doc.exists) throw new Error("Session not found");
        if (doc.data()?.vendorId !== vendorId) throw new Error("Unauthorized");

        // Fetch Product Details for denormalization
        const productSnap = await this.db.collection('products').doc(productId).get();
        if (!productSnap.exists) throw new Error("Product not found");
        const product = productSnap.data()!;

        await docRef.update({
            featuredProductId: productId,
            featuredProductName: product.name,
            featuredProductPrice: product.salePrice > 0 ? product.salePrice : product.basePrice,
            featuredProductImg: product.images?.[0] || null
        });

        return { success: true };
    }
    async updateSession(sessionId: string, data: any, vendorId: string) {
        const docRef = this.db.collection('live_sessions').doc(sessionId);
        const doc = await docRef.get();

        if (!doc.exists) throw new Error("Session not found");

        // Admin override check or vendor match
        if (doc.data()?.vendorId !== vendorId) {
            // If needed check for ADMIN role, but simplistic check here matches current controller logic
            throw new Error("Unauthorized");
        }

        const allowedUpdates = { ...data };
        // Sanitize sensitive fields if necessary (like hostId, vendorId - ensure they aren't overwritten easily)
        delete allowedUpdates.vendorId;
        delete allowedUpdates.hostId;

        allowedUpdates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        await docRef.update(allowedUpdates);
        return { success: true };
    }
}
