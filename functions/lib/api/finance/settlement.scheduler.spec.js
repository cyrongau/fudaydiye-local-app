"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const settlement_scheduler_1 = require("./settlement.scheduler");
const finance_service_1 = require("./finance.service");
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
    let scheduler;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                settlement_scheduler_1.SettlementScheduler,
                { provide: finance_service_1.FinanceService, useValue: mockFinanceService }
            ],
        }).compile();
        scheduler = module.get(settlement_scheduler_1.SettlementScheduler);
    });
    it('should be defined', () => {
        expect(scheduler).toBeDefined();
    });
    // Add more tests for settleDayShift logic if needed
    // simulating query results and verifying createTransaction calls
});
//# sourceMappingURL=settlement.scheduler.spec.js.map