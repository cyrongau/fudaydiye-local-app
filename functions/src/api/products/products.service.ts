
import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class ProductsService {
    private readonly logger = new Logger(ProductsService.name);
    private db: admin.firestore.Firestore;

    constructor() {
        this.db = admin.firestore();
    }

    async findAll(limit: number = 20): Promise<any[]> {
        try {
            const snapshot = await this.db.collection('products')
                .where('status', '==', 'ACTIVE')
                .limit(Number(limit))
                .get();

            if (snapshot.empty) {
                return [];
            }

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            this.logger.error(`Failed to fetch products: ${error}`);
            throw error;
        }
    }

    async findOne(id: string): Promise<any> {
        try {
            const doc = await this.db.collection('products').doc(id).get();
            if (!doc.exists) {
                return null;
            }
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            this.logger.error(`Failed to fetch product ${id}: ${error}`);
            throw error;
        }
    }

    async findByCategory(categorySlug: string, limit: number = 20): Promise<any[]> {
        try {
            const snapshot = await this.db.collection('products')
                .where('status', '==', 'ACTIVE')
                .where('categorySlug', '==', categorySlug) // Ensure you have this field or use category name
                .limit(Number(limit))
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            this.logger.error(`Failed to fetch category ${categorySlug}: ${error}`);
            throw error;
        }
    }

    async findByVendor(vendorId: string, limit: number = 50): Promise<any[]> {
        try {
            const snapshot = await this.db.collection('products')
                .where('status', '==', 'ACTIVE') // Ensure you have this field or use category name
                .where('vendorId', '==', vendorId)
                .limit(Number(limit))
                .get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            this.logger.error(`Failed to fetch products for vendor ${vendorId}: ${error}`);
            throw error;
        }
    }
}
