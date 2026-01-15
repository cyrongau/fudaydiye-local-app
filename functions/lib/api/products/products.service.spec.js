"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const products_service_1 = require("./products.service");
const admin = require("firebase-admin");
// Mock Firebase Admin
jest.mock('firebase-admin', () => {
    const mockFirestore = jest.fn().mockReturnValue({
        collection: jest.fn(),
        doc: jest.fn()
    });
    mockFirestore.FieldValue = {
        serverTimestamp: jest.fn().mockReturnValue('TIMESTAMP')
    };
    return {
        firestore: mockFirestore,
    };
});
describe('ProductsService', () => {
    let service;
    let firestoreMock;
    const mockCreateProductDto = {
        name: 'New Product',
        vendorId: 'vendor_1',
        basePrice: 50,
        status: 'ACTIVE',
        productType: 'SIMPLE',
        category: 'Electronics',
        images: ['img1.jpg'],
        baseStock: 10,
        hasVariations: false
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [products_service_1.ProductsService],
        }).compile();
        service = module.get(products_service_1.ProductsService);
        firestoreMock = admin.firestore();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('create', () => {
        it('should create a product successfully', async () => {
            const setMock = jest.fn();
            firestoreMock.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue({
                    id: 'new_prod_id',
                    set: setMock
                })
            });
            const result = await service.create(mockCreateProductDto);
            expect(result.id).toBe('new_prod_id');
            expect(result.name).toBe('New Product');
            expect(setMock).toHaveBeenCalled();
        });
    });
    describe('update', () => {
        it('should update a product successfully', async () => {
            const updateMock = jest.fn();
            firestoreMock.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue({
                    update: updateMock
                })
            });
            await service.update('prod_1', { name: 'Updated Name' });
            expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated Name' }));
        });
    });
    describe('remove', () => {
        it('should delete a product successfully', async () => {
            const deleteMock = jest.fn();
            firestoreMock.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue({
                    delete: deleteMock
                })
            });
            await service.remove('prod_1');
            expect(deleteMock).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=products.service.spec.js.map