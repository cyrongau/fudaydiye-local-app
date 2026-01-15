"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const orders_service_1 = require("./orders.service");
const admin = require("firebase-admin");
const inventory_service_1 = require("../inventory/inventory.service");
// Mock Firebase Admin
jest.mock('firebase-admin', () => {
    const mockFirestore = jest.fn().mockReturnValue({
        collection: jest.fn(),
        runTransaction: jest.fn()
    });
    mockFirestore.FieldValue = {
        increment: jest.fn().mockReturnValue('INCREMENTED'),
        serverTimestamp: jest.fn().mockReturnValue('TIMESTAMP'),
        arrayUnion: jest.fn().mockReturnValue('ARRAY_UNION')
    };
    return {
        firestore: mockFirestore,
    };
});
describe('OrdersService', () => {
    let service;
    let firestoreMock;
    const mockCartItem = {
        productId: 'prod_1',
        qty: 2,
        vendorId: 'vendor_1',
        name: 'Test Product',
        price: 100
    };
    const mockCreateOrderDto = {
        cartItems: [mockCartItem],
        recipientName: 'John Doe',
        recipientPhone: '123456789',
        recipientAddress: '123 Main St',
        paymentMethod: 'CASH',
        deliveryFee: 10,
        isAtomic: false,
        recipientId: 'user_1',
        savePayment: false,
        syncCartId: null,
        paymentDetails: {}
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                orders_service_1.OrdersService,
                {
                    provide: inventory_service_1.InventoryService,
                    useValue: {
                        adjustStock: jest.fn().mockResolvedValue({ success: true })
                    }
                }
            ],
        }).compile();
        service = module.get(orders_service_1.OrdersService);
        firestoreMock = admin.firestore();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('create', () => {
        it('should create an order successfully', async () => {
            // Mock Transaction
            const transactionMock = {
                get: jest.fn().mockImplementation((ref) => {
                    // Return Mock Product Snapshot
                    return Promise.resolve({
                        exists: true,
                        data: () => ({
                            name: 'Test Product',
                            baseStock: 10,
                            basePrice: 100,
                            salePrice: 0,
                            vendor: 'Vendor Inc',
                            vendorId: 'vendor_1'
                        })
                    });
                }),
                update: jest.fn(),
                set: jest.fn()
            };
            // Mock runTransaction to execute the callback immediately
            firestoreMock.runTransaction.mockImplementation(async (callback) => {
                return await callback(transactionMock);
            });
            // Mock Collection/Doc for references inside service create
            firestoreMock.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue({ id: 'new_order_id' })
            });
            const result = await service.create(mockCreateOrderDto, 'user_123');
            expect(result.success).toBe(true);
            expect(result.orderId).toBeDefined();
            // Verify stock was checked (get called)
            expect(transactionMock.get).toHaveBeenCalled();
            // Verify create
            expect(transactionMock.set).toHaveBeenCalled();
            // NOTE: stock deduction is now delegated to InventoryService, handled by that mock.
        });
        it('should throw BadRequestException if stock is insufficient', async () => {
            // Testing logic inside transaction via Service is tricky if we mock InventoryService.
            // If we want to test stock logic failure, we must mock InventoryService to throw?
            // Or if logic is still in OrdersService (the check matches).
            // My implementation HAS logic: "if (currentStock < item.qty) throw ..." inside OrdersService BEFORE calling InventoryService.
            const transactionMock = {
                get: jest.fn().mockResolvedValue({
                    exists: true,
                    data: () => ({
                        baseStock: 1,
                        basePrice: 100,
                        vendorId: 'vendor_1'
                    })
                })
            };
            firestoreMock.runTransaction.mockImplementation(async (callback) => {
                return await callback(transactionMock);
            });
            firestoreMock.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue({ id: 'ref' })
            });
            await expect(service.create(mockCreateOrderDto, 'user_123')).rejects.toThrow('Insufficient stock');
        });
    });
});
//# sourceMappingURL=orders.service.spec.js.map