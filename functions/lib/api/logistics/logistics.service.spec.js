"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const testing_1 = require("@nestjs/testing");
const logistics_service_1 = require("./logistics.service");
// Mock Firebase Admin
const mockFirestore = {
    collection: jest.fn(),
    runTransaction: jest.fn()
};
jest.mock('firebase-admin', () => {
    mockFirestore.FieldValue = {
        serverTimestamp: jest.fn().mockReturnValue('TIMESTAMP')
    };
    mockFirestore.GeoPoint = jest.fn((lat, lng) => ({ latitude: lat, longitude: lng }));
    return {
        firestore: jest.fn().mockReturnValue(mockFirestore),
    };
});
// Chainable Query Mock
const queryMock = {
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    startAt: jest.fn().mockReturnThis(),
    endAt: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({ docs: [] })
};
describe('LogisticsService', () => {
    let service;
    beforeEach(async () => {
        jest.clearAllMocks();
        // Reset default collection mock to return queryMock for findNearbyRiders
        // or docMock for updates. We'll refine per test.
        mockFirestore.collection.mockReturnValue(queryMock);
        const module = await testing_1.Test.createTestingModule({
            providers: [logistics_service_1.LogisticsService],
        }).compile();
        service = module.get(logistics_service_1.LogisticsService);
    });
    describe('updateLocation', () => {
        it('should update rider location with geohash', async () => {
            const setMock = jest.fn();
            mockFirestore.collection.mockReturnValue({
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
                status: 'ONLINE',
                geohash: expect.any(String) // Verify geohash is generated
            }), { merge: true });
        });
    });
    describe('findNearbyRiders', () => {
        it('should generate geo-queries', async () => {
            // Mock return for queries
            // We just want to see if it called startAt/endAt
            mockFirestore.collection.mockReturnValue(queryMock);
            await service.findNearbyRiders(40.7128, -74.0060, 5);
            expect(queryMock.where).toHaveBeenCalledWith('status', '==', 'ONLINE');
            // Geofire-common usually generates 4-9 hashes.
            expect(queryMock.startAt).toHaveBeenCalled();
            expect(queryMock.endAt).toHaveBeenCalled();
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
            mockFirestore.runTransaction.mockImplementation(async (callback) => {
                return await callback(transactionMock);
            });
            mockFirestore.collection.mockReturnValue({
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
            mockFirestore.runTransaction.mockImplementation(async (callback) => {
                return await callback(transactionMock);
            });
            mockFirestore.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue({ id: 'ref' })
            });
            await expect(service.assignJob({ orderId: 'ord_1', riderId: 'rider_1' }))
                .rejects.toThrow('Order already assigned');
        });
    });
});
//# sourceMappingURL=logistics.service.spec.js.map