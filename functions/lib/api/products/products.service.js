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
var ProductsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
let ProductsService = ProductsService_1 = class ProductsService {
    constructor() {
        this.logger = new common_1.Logger(ProductsService_1.name);
        this.db = admin.firestore();
    }
    async findAll(limit = 20) {
        try {
            const snapshot = await this.db.collection('products')
                .where('status', '==', 'ACTIVE')
                .limit(Number(limit))
                .get();
            if (snapshot.empty) {
                return [];
            }
            return snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        }
        catch (error) {
            this.logger.error(`Failed to fetch products: ${error}`);
            throw error;
        }
    }
    async findOne(id) {
        try {
            const doc = await this.db.collection('products').doc(id).get();
            if (!doc.exists) {
                return null;
            }
            return Object.assign({ id: doc.id }, doc.data());
        }
        catch (error) {
            this.logger.error(`Failed to fetch product ${id}: ${error}`);
            throw error;
        }
    }
    async findByCategory(categorySlug, limit = 20) {
        try {
            const snapshot = await this.db.collection('products')
                .where('status', '==', 'ACTIVE')
                .where('categorySlug', '==', categorySlug) // Ensure you have this field or use category name
                .limit(Number(limit))
                .get();
            return snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        }
        catch (error) {
            this.logger.error(`Failed to fetch category ${categorySlug}: ${error}`);
            throw error;
        }
    }
    async findByVendor(vendorId, limit = 50) {
        try {
            const snapshot = await this.db.collection('products')
                .where('status', '==', 'ACTIVE') // Ensure you have this field or use category name
                .where('vendorId', '==', vendorId)
                .limit(Number(limit))
                .get();
            return snapshot.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        }
        catch (error) {
            this.logger.error(`Failed to fetch products for vendor ${vendorId}: ${error}`);
            throw error;
        }
    }
};
ProductsService = ProductsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ProductsService);
exports.ProductsService = ProductsService;
//# sourceMappingURL=products.service.js.map