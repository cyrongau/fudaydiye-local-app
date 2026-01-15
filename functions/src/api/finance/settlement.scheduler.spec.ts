
import { Test, TestingModule } from '@nestjs/testing';
import { SettlementScheduler } from './settlement.scheduler';
import { FinanceService } from './finance.service';

const mockFinanceService = {
    createTransaction: jest.fn(),
    getBalance: jest.fn(),
    requestPayout: jest.fn()
};

// Mock Firebase Admin
const mockFirestore = {
    collection: jest.fn(),
    runTransaction: jest.fn()
};

jest.mock('firebase-admin', () => ({
    firestore: () => mockFirestore,
}));

describe('SettlementScheduler', () => {
    let scheduler: SettlementScheduler;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SettlementScheduler,
                { provide: FinanceService, useValue: mockFinanceService }
            ],
        }).compile();

        scheduler = module.get<SettlementScheduler>(SettlementScheduler);
    });

    it('should be defined', () => {
        expect(scheduler).toBeDefined();
    });

    // Add more tests for settleDayShift logic if needed
    // simulating query results and verifying createTransaction calls
});
