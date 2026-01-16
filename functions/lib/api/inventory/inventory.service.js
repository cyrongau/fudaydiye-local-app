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
var InventoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
let InventoryService = InventoryService_1 = class InventoryService {
    constructor() {
        this.logger = new common_1.Logger(InventoryService_1.name);
        this.db = admin.firestore();
    }
    async adjustStock(dto, user, externalTransaction, preloadedStock) {
        const { productId, change, reason, notes, orderId } = dto;
        const productRef = this.db.collection('products').doc(productId);
        const transactionRef = this.db.collection('inventory_transactions').doc();
        const operation = async (t) => {
            let currentStock = 0;
            if (preloadedStock !== undefined) {
                currentStock = preloadedStock;
                // We can't check ownership easily here without reading.
                // Valid assumption: Internal system calls (OrdersService) are trusted (User is Customer, but System acts).
            }
            else {
                const productSnap = await t.get(productRef);
                if (!productSnap.exists) {
                    throw new common_1.NotFoundException(`Product ${productId} not found`);
                }
                const productData = productSnap.data();
                // Better: Pass `user` object to service, or role. 
                // Let's modify service signature lightly to accept role or pass the check responsibility.
                // Or just do: if product.vendorId != performedBy... wait, Admins have different ID.
                // The Caller (Controller) knows the Role.
                currentStock = (productData === null || productData === void 0 ? void 0 : productData.baseStock) || 0;
                const productVendorId = productData === null || productData === void 0 ? void 0 : productData.vendorId; // Declare here
                // Ownership Check
                if (user.role === 'VENDOR' && productVendorId !== user.uid) {
                    throw new common_1.ForbiddenException("You do not own this product.");
                }
            }
            const newStock = currentStock + change;
            // Validation: Prevent negative stock unless explicitly allowed
            if (newStock < 0) {
                throw new common_1.BadRequestException(`Insufficient stock. Current: ${currentStock}, Requested change: ${change}`);
            }
            // Update Product
            t.update(productRef, {
                baseStock: newStock,
                updatedAt: firestore_1.FieldValue.serverTimestamp()
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
                createdAt: firestore_1.FieldValue.serverTimestamp()
            });
            return { success: true, newStock };
        };
        try {
            if (externalTransaction) {
                // Use the provided transaction
                return await operation(externalTransaction);
            }
            else {
                // Start a new transaction
                return await this.db.runTransaction(operation);
            }
        }
        catch (error) {
            this.logger.error(`Stock adjustment failed for ${productId}`, error);
            if (error.status)
                throw error;
            throw new common_1.InternalServerErrorException(`Failed to adjust inventory: ${error.message}`);
        }
    }
    async getHistory(productId, limit = 20) {
        try {
            const snapshot = await this.db.collection('inventory_transactions')
                .where('productId', '==', productId)
                .orderBy('createdAt', 'desc')
                .limit(limit)
                .get();
            return snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        }
        catch (error) {
            this.logger.error(`Failed to fetch history for ${productId}`, error);
            throw new common_1.InternalServerErrorException("Failed to fetch inventory history");
        }
    }
};
InventoryService = InventoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], InventoryService);
exports.InventoryService = InventoryService;
//# sourceMappingURL=inventory.service.js.map