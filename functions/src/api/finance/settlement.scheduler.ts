import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FinanceService } from './finance.service';
import { TransactionType } from './dto/finance.dto';

@Injectable()
export class SettlementScheduler {
    private readonly logger = new Logger(SettlementScheduler.name);
    private db = admin.firestore();

    constructor(private readonly financeService: FinanceService) { }

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

    private async processSettlement(shiftType: 'DAY_SHIFT' | 'NIGHT_SHIFT') {
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
                        type: TransactionType.WITHDRAWAL,
                        description: `Auto-Settlement: ${shiftType}`,
                        referenceId: `SETTLE-${Date.now()}`
                    });

                    // 2. Trigger Mobile Money API (Mock)
                    await this.mockMobileMoneyPayout(payoutNumber, balance);

                    settledCount++;
                } catch (error) {
                    this.logger.error(`Failed to settle rider ${riderId}: ${error}`);
                }
            }
        }

        this.logger.log(`Settlement Complete: ${settledCount} riders paid.`);
    }

    private async mockMobileMoneyPayout(phone: string, amount: number) {
        // Mock API Call
        return new Promise(resolve => setTimeout(resolve, 500));
    }
}
