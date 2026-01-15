
import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from './finance.service';
import * as admin from 'firebase-admin';
import { TransactionType } from './dto/finance.dto';
import { BadRequestException } from '@nestjs/common';

// Mock Firebase
const mockFirestore = {
    collection: jest.fn(),
    runTransaction: jest.fn()
};

jest.mock('firebase-admin', () => ({
    firestore: () => mockFirestore,
    credential: {
        applicationDefault: jest.fn(),
    },
    initializeApp: jest.fn(),
}));

// Mock Firestore FieldValue
(admin.firestore as any).FieldValue = {
    serverTimestamp: () => 'MOCK_TIMESTAMP',
    increment: (n: number) => n
};


describe('FinanceService', () => {
    let service: FinanceService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [FinanceService],
        }).compile();

        service = module.get<FinanceService>(FinanceService);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createTransaction', () => {
        it('should process a DEPOSIT transaction via ledger', async () => {
            // Mock Transaction Runner
            mockFirestore.runTransaction.mockImplementation(async (callback) => {
                const mockTx = {
                    get: jest.fn().mockResolvedValue({
                        exists: true,
                        data: () => ({ balance: 100 })
                    }),
                    set: jest.fn(),
                    update: jest.fn()
                };
                await callback(mockTx);
            });

            // Mock References
            mockFirestore.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue({ id: 'docId' })
            });

            const result = await service.createTransaction({
                userId: 'user123',
                amount: 50.00,
                type: TransactionType.DEPOSIT,
                description: 'Topup'
            });

            expect(mockFirestore.runTransaction).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should reject WITHDRAWAL if insufficient funds', async () => {
            // Mock Transaction Runner returning low balance
            mockFirestore.runTransaction.mockImplementation(async (callback) => {
                const mockTx = {
                    get: jest.fn().mockResolvedValue({
                        exists: true,
                        data: () => ({ balance: 10 })
                    }),
                };
                await callback(mockTx);
            });

            mockFirestore.collection.mockReturnValue({
                doc: jest.fn().mockReturnValue({ id: 'docId' })
            });

            await expect(service.createTransaction({
                userId: 'user123',
                amount: 50.00, // > 10
                type: TransactionType.WITHDRAWAL,
                description: 'Cashout'
            })).rejects.toThrow(BadRequestException);
        });
    });
    describe('requestPayout', () => {
        it('should create a payout request and lock funds', async () => {
            mockFirestore.runTransaction.mockImplementation(async (callback) => {
                const mockTx = {
                    get: jest.fn().mockResolvedValue({
                        exists: true,
                        data: () => ({ balance: 200, pendingPayouts: 0 })
                    }),
                    set: jest.fn(),
                    update: jest.fn()
                };
                await callback(mockTx);
            });

            const result = await service.requestPayout({
                userId: 'user123',
                amount: 100,
                method: 'MOBILE_MONEY',
                accountNumber: '123'
            });

            expect(mockFirestore.runTransaction).toHaveBeenCalled();
            expect(result.success).toBe(true);
        });

        it('should fail request if insufficient balance', async () => {
            mockFirestore.runTransaction.mockImplementation(async (callback) => {
                const mockTx = {
                    get: jest.fn().mockResolvedValue({
                        exists: true,
                        data: () => ({ balance: 50 })
                    }),
                };
                await callback(mockTx);
            });

            await expect(service.requestPayout({
                userId: 'user123',
                amount: 100,
                method: 'MOBILE_MONEY',
                accountNumber: '123'
            })).rejects.toThrow(BadRequestException);
        });
    });
});
