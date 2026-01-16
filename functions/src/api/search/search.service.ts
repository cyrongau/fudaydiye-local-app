import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class SearchService {
    private db = admin.firestore();

    async searchProducts(params: {
        query?: string;
        category?: string;
        minPrice?: number;
        maxPrice?: number;
        vendorId?: string;
        limit?: number;
        lastValue?: string | number;
        lastId?: string;
    }) {
        const { query, category, minPrice, maxPrice, vendorId, limit = 20, lastValue, lastId } = params;

        let collectionRef: admin.firestore.Query = this.db.collection('products')
            .where('status', '==', 'ACTIVE');

        // 1. Equality Filters (Category, Vendor)
        if (category && category !== 'All') {
            collectionRef = collectionRef.where('category', '==', category);
        }
        if (vendorId) {
            collectionRef = collectionRef.where('vendorId', '==', vendorId);
        }

        // 2. Text Search (Prefix) - Takes precedence for ordering
        if (query && query.length >= 2) {
            const term = query;
            const endTerm = term + '\uf8ff';
            collectionRef = collectionRef.orderBy('name')
                .startAt(term)
                .endAt(endTerm);

            // Pagination for text search (cursor logic might be tricky with startAt/endAt restrictions, 
            // but we can try startAfter if we are strictly paging within the range).
            // Actually, combining startAt/endAt with startAfter is complex in Firestore. 
            // For this specific 'prefix search' implementation, traditional cursors (startAfter) 
            // might conflict with the range cursors (startAt/endAt).
            // However, Firestore allows startAfter logic if it follows the sort order.
            // If we are paging, we essentially want to 'continue' from the last item.
            // But since we use startAt(term) to define the range, startAfter(lastValue) must be >= startAt(term).
            // For simplicity in this text search implementation, let's assume client handles paging 
            // or we skip startAfter for query search if it complicates things, or we try:
            if (lastValue) {
                // If we have a cursor, we replace startAt with startAfter? 
                // No, we need both: range restriction AND pagination.
                // Firestore doesn't support multiple cursor clauses easily like that for the same field.
                // Strategy: If paging, we use startAfter(lastValue) AND endAt(endTerm).
                // We drop startAt(term) because lastValue should be >= term anyway.
                collectionRef = this.db.collection('products').where('status', '==', 'ACTIVE'); // Reset to apply order correctly
                if (category && category !== 'All') collectionRef = collectionRef.where('category', '==', category);
                if (vendorId) collectionRef = collectionRef.where('vendorId', '==', vendorId);

                collectionRef = collectionRef.orderBy('name')
                    .startAfter(lastValue)
                    .endAt(endTerm);
            }

        } else {
            // 3. Sorting (Default to Newest if not text searching)
            if (minPrice !== undefined) collectionRef = collectionRef.where('basePrice', '>=', Number(minPrice));
            if (maxPrice !== undefined) collectionRef = collectionRef.where('basePrice', '<=', Number(maxPrice));

            if (minPrice !== undefined || maxPrice !== undefined) {
                collectionRef = collectionRef.orderBy('basePrice', 'asc')
                    .orderBy(admin.firestore.FieldPath.documentId());
                if (lastValue && lastId) {
                    collectionRef = collectionRef.startAfter(Number(lastValue), lastId);
                }
            } else {
                collectionRef = collectionRef.orderBy('createdAt', 'desc')
                    .orderBy(admin.firestore.FieldPath.documentId());
                if (lastValue && lastId) {
                    // Assuming lastValue is ISO string or timestamp
                    const dateCursor = new Date(lastValue);
                    if (!isNaN(dateCursor.getTime())) {
                        collectionRef = collectionRef.startAfter(dateCursor, lastId);
                    }
                }
            }
        }

        const snapshot = await collectionRef.limit(Number(limit)).get();
        return {
            results: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
            total: snapshot.size // consistent return shape, though strictly it's page size here. 
            // Real total count requires a separate aggregation query if needed.
        };
    }

    async getRecentProducts(limit: number = 10) {
        const snapshot = await this.db.collection('products')
            .where('status', '==', 'ACTIVE')
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
}
