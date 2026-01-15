"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const logistics_service_1 = require("./logistics.service");
const admin = require("firebase-admin");
// Mock Firebase Admin
jest.mock('firebase-admin', () => {
    const mockFirestore = jest.fn().mockReturnValue({
        collection: jest.fn(),
        runTransaction: jest.fn()
    });
    mockFirestore.FieldValue = {
        serverTimestamp: jest.fn().mockReturnValue('TIMESTAMP')
    };
    mockFirestore.GeoPoint = jest.fn((lat, lng) => ({ latitude: lat, longitude: lng }));
    return {
        firestore: mockFirestore,
    };
});
describe('LogisticsService', () => {
    let service;
    let firestoreMock;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [logistics_service_1.LogisticsService],
        }).compile();
        service = module.get(logistics_service_1.LogisticsService);
        firestoreMock = admin.firestore();
    });
    describe('updateLocation', () => {
        it('should update rider location', async () => {
            const setMock = jest.fn();
            firestoreMock.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue({
                    set: setMock
                })
            });
            await service.updateLocation({
                riderId: 'rider_1',
                latitude: 40.7128,
                longitude: -74.0060,
                status: 'ONLINE'
            });
            expect(setMock).toHaveBeenCalledWith(expect.objectContaining({
                currLocation: expect.objectContaining({ latitude: 40.7128 }),
                status: 'ONLINE'
            }), { merge: true });
        });
    });
    describe('assignJob', () => {
        it('should assign job if order is open', async () => {
            // Mock Transaction
            const transactionMock = {
                get: jest.fn().mockImplementation((ref) => {
                    // Mock Order (Unassigned)
                    return Promise.resolve({
                        exists: true,
                        data: () => ({ riderId: null })
                    });
                }),
                update: jest.fn()
            };
            firestoreMock.runTransaction.mockImplementation(async (callback) => {
                return await callback(transactionMock);
            });
            firestoreMock.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue({ id: 'ref' })
            });
            const result = await service.assignJob({ orderId: 'ord_1', riderId: 'rider_1' });
            expect(result.success).toBe(true);
            expect(transactionMock.update).toHaveBeenCalledTimes(2); // Order + Rider
        });
        it('should fail if order matches double-booking condition', async () => {
            const transactionMock = {
                get: jest.fn().mockResolvedValue({
                    exists: true,
                    data: () => ({ riderId: 'other_rider' }) // Already assigned
                })
            };
            firestoreMock.runTransaction.mockImplementation(async (callback) => {
                return await callback(transactionMock);
            });
            firestoreMock.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue({ id: 'ref' })
            });
            await expect(service.assignJob({ orderId: 'ord_1', riderId: 'rider_1' }))
                .rejects.toThrow('Order already assigned');
        });
    });
});
//# sourceMappingURL=logistics.service.spec.js.map