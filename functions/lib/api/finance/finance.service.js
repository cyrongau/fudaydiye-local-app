"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var FinanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
const finance_dto_1 = require("./dto/finance.dto");
let FinanceService = FinanceService_1 = class FinanceService {
    constructor() {
        this.logger = new common_1.Logger(FinanceService_1.name);
        this.db = admin.firestore();
    }
    async getBalance(userId) {
        const walletRef = this.db.collection('wallets').doc(userId);
        const doc = await walletRef.get();
        if (!doc.exists)
            return { balance: 0, pendingPayouts: 0 };
        const data = doc.data();
        return {
            balance: (data === null || data === void 0 ? void 0 : data.balance) || 0,
            pendingPayouts: (data === null || data === void 0 ? void 0 : data.pendingPayouts) || 0
        };
    }
    async createTransaction(dto) {
        // Double-Entry Ledger System
        // 1. Create Transaction Record (Immutable)
        // 2. Update Wallet Balance (Atomic)
        const walletRef = this.db.collection('wallets').doc(dto.userId);
        const txRef = this.db.collection('transactions').doc();
        try {
            await this.db.runTransaction(async (t) => {
                var _a;
                const walletDoc = await t.get(walletRef);
                const currentBalance = walletDoc.exists ? (((_a = walletDoc.data()) === null || _a === void 0 ? void 0 : _a.balance) || 0) : 0;
                // Validate sufficient funds for debit
                if ([finance_dto_1.TransactionType.WITHDRAWAL, finance_dto_1.TransactionType.PAYMENT].includes(dto.type)) {
                    if (currentBalance < dto.amount) {
                        throw new common_1.BadRequestException("Insufficient Funds");
                    }
                }
                // Create Transaction
                t.set(txRef, Object.assign(Object.assign({}, dto), { status: finance_dto_1.TransactionStatus.COMPLETED, createdAt: admin.firestore.FieldValue.serverTimestamp(), previousBalance: currentBalance, newBalance: this.calculateNewBalance(currentBalance, dto.amount, dto.type) }));
                // Update Wallet
                const increment = this.calculateIncrement(dto.amount, dto.type);
                t.set(walletRef, {
                    balance: admin.firestore.FieldValue.increment(increment),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            });
            return { success: true, txId: txRef.id };
        }
        catch (error) {
            this.logger.error(`Transaction failed: ${error}`);
            throw error;
        }
    }
    calculateNewBalance(current, amount, type) {
        return current + this.calculateIncrement(amount, type);
    }
    calculateIncrement(amount, type) {
        switch (type) {
            case finance_dto_1.TransactionType.DEPOSIT:
            case finance_dto_1.TransactionType.EARNING:
            case finance_dto_1.TransactionType.REFUND:
                return amount;
            case finance_dto_1.TransactionType.WITHDRAWAL:
            case finance_dto_1.TransactionType.PAYMENT:
                return -amount;
            default:
                return 0;
        }
    }
    // Manual Payout Request (User Initiated)
    async requestPayout(dto) {
        const walletRef = this.db.collection('wallets').doc(dto.userId);
        const payoutRef = this.db.collection('payouts').doc();
        try {
            await this.db.runTransaction(async (t) => {
                const walletDoc = await t.get(walletRef);
                const data = walletDoc.data() || { balance: 0, pendingPayouts: 0 };
                if (data.balance < dto.amount)
                    throw new common_1.BadRequestException("Insufficient Funds");
                // Lock funds
                t.update(walletRef, {
                    balance: admin.firestore.FieldValue.increment(-dto.amount),
                    pendingPayouts: admin.firestore.FieldValue.increment(dto.amount)
                });
                t.set(payoutRef, Object.assign(Object.assign({}, dto), { status: 'PENDING', createdAt: admin.firestore.FieldValue.serverTimestamp() }));
            });
            return { success: true, payoutId: payoutRef.id };
        }
        catch (error) {
            this.logger.error(`Payout Request Failed: ${error}`);
            throw error;
        }
    }
};
FinanceService = FinanceService_1 = __decorate([
    (0, common_1.Injectable)()
], FinanceService);
exports.FinanceService = FinanceService;
//# sourceMappingURL=finance.service.js.map