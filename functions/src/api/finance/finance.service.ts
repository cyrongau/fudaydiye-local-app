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
}
