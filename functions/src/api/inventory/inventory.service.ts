import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Injectable()
export class InventoryService {
    private readonly logger = new Logger(InventoryService.name);
    private db: admin.firestore.Firestore;

    constructor() {
        this.db = admin.firestore();
    }

    async adjustStock(dto: AdjustStockDto, performedBy: string, externalTransaction?: admin.firestore.Transaction): Promise<any> {
        const { productId, change, reason, notes, orderId } = dto;
        const productRef = this.db.collection('products').doc(productId);
        const transactionRef = this.db.collection('inventory_transactions').doc();

        const operation = async (t: admin.firestore.Transaction) => {
            const productSnap = await t.get(productRef);

            if (!productSnap.exists) {
                throw new NotFoundException(`Product ${productId} not found`);
            }

            const productData = productSnap.data();
            const currentStock = productData?.baseStock || 0;
            const newStock = currentStock + change;

            // Validation: Prevent negative stock unless explicitly allowed
            if (newStock < 0) {
                throw new BadRequestException(`Insufficient stock. Current: ${currentStock}, Requested change: ${change}`);
            }

            // Update Product
            t.update(productRef, {
                baseStock: newStock,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Create Audit Record
            t.set(transactionRef, {
                productId,
                change,
                reason,
                previousStock: currentStock,
                newStock,
                performedBy,
                notes: notes || '',
                orderId: orderId || null,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return { success: true, newStock };
        };

        try {
            if (externalTransaction) {
                // Use the provided transaction
                return await operation(externalTransaction);
            } else {
                // Start a new transaction
                return await this.db.runTransaction(operation);
            }
        } catch (error: any) {
            this.logger.error(`Stock adjustment failed for ${productId}`, error);
            if (error.status) throw error;
            throw new InternalServerErrorException("Failed to adjust inventory");
        }
    }

    async getHistory(productId: string, limit: number = 20): Promise<any[]> {
        try {
            const snapshot = await this.db.collection('inventory_transactions')
                .where('productId', '==', productId)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();

            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            this.logger.error(`Failed to fetch history for ${productId}`, error);
            throw new InternalServerErrorException("Failed to fetch inventory history");
        }
    }
}
