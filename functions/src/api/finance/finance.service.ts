import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { CreateTransactionDto, RequestPayoutDto, TransactionStatus, TransactionType } from './dto/finance.dto';

@Injectable()
export class FinanceService {
    private readonly logger = new Logger(FinanceService.name);
    private db = admin.firestore();

    async getBalance(userId: string): Promise<{ balance: number; pendingPayouts: number }> {
        const walletRef = this.db.collection('wallets').doc(userId);
        const doc = await walletRef.get();
        if (!doc.exists) return { balance: 0, pendingPayouts: 0 };
        const data = doc.data();
        return {
            balance: data?.balance || 0,
            pendingPayouts: data?.pendingPayouts || 0
        };
    }

    async createTransaction(dto: CreateTransactionDto) {
        // Double-Entry Ledger System
        // 1. Create Transaction Record (Immutable)
        // 2. Update Wallet Balance (Atomic)

        const walletRef = this.db.collection('wallets').doc(dto.userId);
        const txRef = this.db.collection('transactions').doc();

        try {
            await this.db.runTransaction(async (t) => {
                const walletDoc = await t.get(walletRef);
                const currentBalance = walletDoc.exists ? (walletDoc.data()?.balance || 0) : 0;

                // Validate sufficient funds for debit
                if ([TransactionType.WITHDRAWAL, TransactionType.PAYMENT].includes(dto.type)) {
                    if (currentBalance < dto.amount) {
                        throw new BadRequestException("Insufficient Funds");
                    }
                }

                // Create Transaction
                t.set(txRef, {
                    ...dto,
                    status: TransactionStatus.COMPLETED,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    previousBalance: currentBalance,
                    newBalance: this.calculateNewBalance(currentBalance, dto.amount, dto.type)
                });

                // Update Wallet
                const increment = this.calculateIncrement(dto.amount, dto.type);
                t.set(walletRef, {
                    balance: admin.firestore.FieldValue.increment(increment),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            });

            return { success: true, txId: txRef.id };
        } catch (error) {
            this.logger.error(`Transaction failed: ${error}`);
            throw error;
        }
    }

    private calculateNewBalance(current: number, amount: number, type: TransactionType): number {
        return current + this.calculateIncrement(amount, type);
    }

    private calculateIncrement(amount: number, type: TransactionType): number {
        switch (type) {
            case TransactionType.DEPOSIT:
            case TransactionType.EARNING:
            case TransactionType.REFUND:
                return amount;
            case TransactionType.WITHDRAWAL:
            case TransactionType.PAYMENT:
                return -amount;
            default:
                return 0;
        }
    }

    // Manual Payout Request (User Initiated)
    async requestPayout(dto: RequestPayoutDto) {
        const walletRef = this.db.collection('wallets').doc(dto.userId);
        const payoutRef = this.db.collection('payouts').doc();

        try {
            await this.db.runTransaction(async (t) => {
                const walletDoc = await t.get(walletRef);
                const data = walletDoc.data() || { balance: 0, pendingPayouts: 0 };

                if (data.balance < dto.amount) throw new BadRequestException("Insufficient Funds");

                // Lock funds
                t.update(walletRef, {
                    balance: admin.firestore.FieldValue.increment(-dto.amount),
                    pendingPayouts: admin.firestore.FieldValue.increment(dto.amount)
                });

                t.set(payoutRef, {
                    ...dto,
                    status: 'PENDING',
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });
            return { success: true, payoutId: payoutRef.id };
        } catch (error) {
            this.logger.error(`Payout Request Failed: ${error}`);
            throw error;
        }
    }
    // Admin Authorize Payout
    async authorizePayout(payoutId: string, adminId: string) {
        const payoutRef = this.db.collection('payouts').doc(payoutId);
        const ledgerRef = this.db.collection('transactions').doc();

        try {
            await this.db.runTransaction(async (t) => {
                const payoutDoc = await t.get(payoutRef);
                if (!payoutDoc.exists) throw new BadRequestException("Payout request not found");
                const payoutData = payoutDoc.data()!;

                if (payoutData.status !== 'PENDING') {
                    throw new BadRequestException("Payout is not pending.");
                }

                // 1. Update payout status
                t.update(payoutRef, {
                    status: 'SETTLED',
                    authorizedAt: admin.firestore.FieldValue.serverTimestamp(),
                    authorizedBy: adminId
                });

                // 2. Funds were already locked (deducted from balance, moved to pendingPayouts) during Request.
                // Now we just confirm it. 
                // Wait, if we want to reflect "Settled" in wallet, we might decrement pendingPayouts?
                // Logic check: requestPayout increments pendingPayouts, decrements balance.
                // So funds are "gone" from usable. 
                // So we just need to decrement pendingPayouts if we want to clear that liability?
                // Or keep it for history. Usually clear pending.
                const vendorRef = this.db.collection('wallets').doc(payoutData.userId);
                t.update(vendorRef, {
                    pendingPayouts: admin.firestore.FieldValue.increment(-payoutData.amount)
                });

                // 3. Record Payout Transaction (Ledger)
                t.set(ledgerRef, {
                    userId: payoutData.userId,
                    type: TransactionType.WITHDRAWAL, // Or PAYOUT_CONFIRMED
                    amount: payoutData.amount,
                    status: TransactionStatus.SETTLED,
                    referenceId: payoutId,
                    description: `Authorized Payout to ${payoutData.method}`,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });

                // 4. Notify Vendor
                const notifRef = this.db.collection("notifications").doc();
                t.set(notifRef, {
                    userId: payoutData.userId,
                    title: "Payout Authorized",
                    message: `System node has authorized your $${payoutData.amount} withdrawal via ${payoutData.method}.`,
                    type: 'FINANCE',
                    isRead: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            });

            return { success: true };
        } catch (error) {
            this.logger.error(`Payout Authorization Failed: ${error}`);
            throw error;
        }
    }

    async getAllPayouts(limit: number = 50) {
        const snapshot = await this.db.collection('payouts')
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async getAllTransactions(limit: number = 50) {
        const snapshot = await this.db.collection('transactions')
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
}
