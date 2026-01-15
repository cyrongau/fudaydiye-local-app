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
var SettlementScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettlementScheduler = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
const finance_service_1 = require("./finance.service");
const finance_dto_1 = require("./dto/finance.dto");
let SettlementScheduler = SettlementScheduler_1 = class SettlementScheduler {
    constructor(financeService) {
        this.financeService = financeService;
        this.logger = new common_1.Logger(SettlementScheduler_1.name);
        this.db = admin.firestore();
    }
    /**
     * Triggered at 6 PM (18:00) for Day Shift (e.g., 6 AM - 6 PM)
     */
    async settleDayShift() {
        this.logger.log("Starting Day Shift Settlement...");
        await this.processSettlement('DAY_SHIFT');
    }
    /**
     * Triggered at 7 AM (07:00) for Night Shift (e.g., 6 PM - 7 AM)
     */
    async settleNightShift() {
        this.logger.log("Starting Night Shift Settlement...");
        await this.processSettlement('NIGHT_SHIFT');
    }
    async processSettlement(shiftType) {
        const ridersSnapshot = await this.db.collection('riders')
            .where('shift', '==', shiftType)
            .where('status', 'in', ['ONLINE', 'BUSY', 'OFFLINE']) // Active riders
            .get();
        if (ridersSnapshot.empty) {
            this.logger.log(`No riders found for ${shiftType}`);
            return;
        }
        let settledCount = 0;
        for (const doc of ridersSnapshot.docs) {
            const riderParams = doc.data();
            const riderId = doc.id;
            const payoutNumber = riderParams.phoneNumber; // Settlement Account
            if (!payoutNumber) {
                this.logger.warn(`Skipping Rider ${riderId}: No phone number for settlement.`);
                continue;
            }
            // Calculate Pending Earnings
            // In a real system, we'd query transactions where status=PENDING
            // ensuring we only pay what hasn't been paid.
            // For now, let's assume we check the Wallet Balance and pay it ALL out.
            const { balance } = await this.financeService.getBalance(riderId);
            if (balance > 0) {
                this.logger.log(`Settling Rider ${riderId} (${shiftType}): $${balance} to ${payoutNumber}`);
                try {
                    // 1. Create Withdrawal Transaction (Ledger)
                    await this.financeService.createTransaction({
                        userId: riderId,
                        amount: balance,
                        type: finance_dto_1.TransactionType.WITHDRAWAL,
                        description: `Auto-Settlement: ${shiftType}`,
                        referenceId: `SETTLE-${Date.now()}`
                    });
                    // 2. Trigger Mobile Money API (Mock)
                    await this.mockMobileMoneyPayout(payoutNumber, balance);
                    settledCount++;
                }
                catch (error) {
                    this.logger.error(`Failed to settle rider ${riderId}: ${error}`);
                }
            }
        }
        this.logger.log(`Settlement Complete: ${settledCount} riders paid.`);
    }
    async mockMobileMoneyPayout(phone, amount) {
        // Mock API Call
        return new Promise(resolve => setTimeout(resolve, 500));
    }
};
SettlementScheduler = SettlementScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [finance_service_1.FinanceService])
], SettlementScheduler);
exports.SettlementScheduler = SettlementScheduler;
//# sourceMappingURL=settlement.scheduler.js.map