import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Injectable()
export class InventoryService {
    private readonly logger = new Logger(InventoryService.name);
    private db: admin.firestore.Firestore;

    constructor() {
        this.db = admin.firestore();
    }

    async adjustStock(dto: AdjustStockDto, user: { uid: string, role: string }, externalTransaction?: admin.firestore.Transaction, preloadedStock?: number): Promise<any> {
        const { productId, change, reason, notes, orderId } = dto;
        const productRef = this.db.collection('products').doc(productId);
        const transactionRef = this.db.collection('inventory_transactions').doc();

        const operation = async (t: admin.firestore.Transaction) => {
            let currentStock = 0;

            if (preloadedStock !== undefined) {
                currentStock = preloadedStock;
                // We can't check ownership easily here without reading.
                // Valid assumption: Internal system calls (OrdersService) are trusted (User is Customer, but System acts).
            } else {
                const productSnap = await t.get(productRef);
                if (!productSnap.exists) {
                    throw new NotFoundException(`Product ${productId} not found`);
                }
                const productData = productSnap.data();
                // Better: Pass `user` object to service, or role. 
                // Let's modify service signature lightly to accept role or pass the check responsibility.
                // Or just do: if product.vendorId != performedBy... wait, Admins have different ID.
                // The Caller (Controller) knows the Role.

                currentStock = productData?.baseStock || 0;
                const productVendorId = productData?.vendorId; // Declare here

                // Ownership Check
                if (user.role === 'VENDOR' && productVendorId !== user.uid) {
                    throw new ForbiddenException("You do not own this product.");
                }
            }

            const newStock = currentStock + change;

            // Validation: Prevent negative stock unless explicitly allowed
            if (newStock < 0) {
                throw new BadRequestException(`Insufficient stock. Current: ${currentStock}, Requested change: ${change}`);
            }

            // Update Product
            t.update(productRef, {
                baseStock: newStock,
                updatedAt: FieldValue.serverTimestamp()
            });

            // Create Audit Record
            t.set(transactionRef, {
                productId,
                change,
                reason,
                previousStock: currentStock,
                newStock,
                performedBy: user.uid,
                notes: notes || '',
                orderId: orderId || null,
                createdAt: FieldValue.serverTimestamp()
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
            throw new InternalServerErrorException(`Failed to adjust inventory: ${error.message}`);
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
