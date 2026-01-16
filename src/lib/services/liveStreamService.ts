import {
    doc,
    getDoc,
    updateDoc,
    collection,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    where,
    getDocs,
    addDoc,
    deleteDoc,
    limit,
    DocumentData,
    FirestoreError
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { api } from '@/src/services/api';

import { LiveSession, ChatMessage, CreateSessionPayloadSchema, ChatMessageSchema } from '../schemas/liveSession';
import { Product } from '../../../types';

export type { LiveSession, ChatMessage, Product };

class LiveStreamService {

    /**
     * Subscribe to a vendor's live sessions (history and active).
     */
    subscribeToVendorSessions(vendorId: string, onUpdate: (sessions: LiveSession[]) => void, onError?: (error: FirestoreError) => void) {
        const q = query(
            collection(db, "live_sessions"),
            where("vendorId", "==", vendorId),
            orderBy("createdAt", "desc"),
            limit(50)
        );
        return onSnapshot(q, (snap) => {
            const sessions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as LiveSession));
            onUpdate(sessions);
        }, onError);
    }

    /**
     * Subscribe to real-time updates for a specific live session.
     */
    subscribeToSession(sessionId: string, onUpdate: (data: LiveSession | null) => void, onError?: (error: FirestoreError) => void) {
        return onSnapshot(
            doc(db, "live_sessions", sessionId),
            (snap) => {
                if (snap.exists()) {
                    onUpdate({ id: snap.id, ...snap.data() } as unknown as LiveSession);
                } else {
                    onUpdate(null);
                }
            },
            onError
        );
    }

    /**
     * Send a new chat message to the live session.
     */
    async sendChatMessage(sessionId: string, message: { text: string; userId: string; userName: string; }): Promise<void> {
        try {
            // Validate Message
            const validatedMessage = ChatMessageSchema.parse(message);

            const chatRef = collection(db, "live_sessions", sessionId, "chat");
            await addDoc(chatRef, {
                ...validatedMessage,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    }

    /**
     * Subscribe to the chat stream for a live session.
     */
    subscribeToChat(sessionId: string, onUpdate: (messages: ChatMessage[]) => void, onError?: (error: FirestoreError) => void) {
        const qChat = query(collection(db, "live_sessions", sessionId, "chat"), orderBy("createdAt", "asc"));
        return onSnapshot(qChat, (snap) => {
            const messages = snap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as ChatMessage));
            onUpdate(messages);
        }, onError);
    }

    /**
     * Fetch all products belonging to a specific vendor (for pinning).
     */
    async fetchVendorProducts(vendorId: string): Promise<Product[]> {
        try {
            const q = query(
                collection(db, "products"),
                where("vendorId", "==", vendorId),
                // orderBy("createdAt", "desc"), // Temporarily removed to fix Index Error
                limit(50)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        } catch (error) {
            console.error("Error fetching vendor products:", error);
            // Fallback: Try without sort if index is missing (common dev issue)
            try {
                const qFallback = query(
                    collection(db, "products"),
                    where("vendorId", "==", vendorId),
                    limit(50)
                );
                const snapFallback = await getDocs(qFallback);
                return snapFallback.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            } catch (fallbackError) {
                console.error("Fallback fetch failed:", fallbackError);
                throw fallbackError;
            }
        }
    }

    /**
     * Update session status (e.g. from SCHEDULED to LIVE, or to ENDED).
     */
    async updateSessionStatus(sessionId: string, status: 'LIVE' | 'ENDED'): Promise<void> {
        try {
            await api.patch(`/live/${sessionId}/status`, { status });
        } catch (error) {
            console.error("Error updating session status:", error);
            throw error;
        }
    }



    /**
     * Create a new live session.
     */
    async createSession(data: {
        vendorId: string;
        vendorName: string; // Deprecated: Handled by Backend
        hostAvatar: string; // Deprecated: Handled by Backend
        title: string;
        category: string;
        mode: 'LIVE' | 'SCHEDULE';
        featuredProduct?: Product;
        productIds?: string[];
        scheduledAt?: any;
    }): Promise<string> {
        try {
            // Backend handles vendorId etc from token ideally, but we pass payload
            const payload = {
                title: data.title,
                category: data.category,
                mode: data.mode,
                productIds: data.productIds || []
            };
            const res = await api.post('/live', payload);
            return res.data.id;
        } catch (error) {
            console.error("Error creating session:", error);
            throw error;
        }
    }

    /**
     * Update an existing live session.
     */
    async updateSession(sessionId: string, data: Partial<LiveSession>): Promise<void> {
        try {
            await api.patch(`/live/${sessionId}`, data);
        } catch (error) {
            console.error("Error updating session:", error);
            throw error;
        }
    }

    /**
     * Pin a product to the live stream.
     */
    async pinProductToStream(sessionId: string, product: Product): Promise<void> {
        try {
            await api.patch(`/live/${sessionId}/pin`, { productId: product.id });
        } catch (error) {
            console.error("Error pinning product:", error);
            throw error;
        }
    }

    /**
     * Toggle like on a session.
     */
    async toggleLike(sessionId: string, userId: string): Promise<void> {
        const sessionRef = doc(db, "live_sessions", sessionId);
        const sessionSnap = await getDoc(sessionRef);
        if (sessionSnap.exists()) {
            const currentLikes = sessionSnap.data().likes || 0;
            await updateDoc(sessionRef, { likes: currentLikes + 1 });
        }
    }

    /**
     * Delete a live session.
     */
    async deleteSession(sessionId: string): Promise<void> {
        try {
            await deleteDoc(doc(db, "live_sessions", sessionId));
        } catch (error) {
            console.error("Error deleting session:", error);
            throw error;
        }
    }
    /**
     * Initialize Agora (Placeholder for now, keeping Agora logic in component or moving later)
     * Note: Agora SDK is browser-only and heavily tied to DOM refs (video element). 
     * It is often better to keep Agora/WebRTC logic in a custom hook or specialized class 
     * rather than a pure data service, but we can fetch config here.
     */
    async getAgoraAppId(): Promise<string | null> {
        try {
            const configSnap = await getDoc(doc(db, "system_config", "global"));
            return configSnap.data()?.integrations?.agora?.appId || null;
        } catch (error) {
            console.error("Error fetching Agora config:", error);
            return null;
        }
    }
}

export const liveStreamService = new LiveStreamService();
