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
let InventoryService = InventoryService_1 = class InventoryService {
    constructor() {
        this.logger = new common_1.Logger(InventoryService_1.name);
        this.db = admin.firestore();
    }
    async adjustStock(dto, performedBy, externalTransaction) {
        const { productId, change, reason, notes, orderId } = dto;
        const productRef = this.db.collection('products').doc(productId);
        const transactionRef = this.db.collection('inventory_transactions').doc();
        const operation = async (t) => {
            const productSnap = await t.get(productRef);
            if (!productSnap.exists) {
                throw new common_1.NotFoundException(`Product ${productId} not found`);
            }
            const productData = productSnap.data();
            const currentStock = (productData === null || productData === void 0 ? void 0 : productData.baseStock) || 0;
            const newStock = currentStock + change;
            // Validation: Prevent negative stock unless explicitly allowed
            if (newStock < 0) {
                throw new common_1.BadRequestException(`Insufficient stock. Current: ${currentStock}, Requested change: ${change}`);
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
            throw new common_1.InternalServerErrorException("Failed to adjust inventory");
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