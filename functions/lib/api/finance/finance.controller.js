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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceController = void 0;
const common_1 = require("@nestjs/common");
const finance_service_1 = require("./finance.service");
const finance_dto_1 = require("./dto/finance.dto");
const settlement_scheduler_1 = require("./settlement.scheduler");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const users_dto_1 = require("../users/dto/users.dto");
const user_decorator_1 = require("../common/decorators/user.decorator");
let FinanceController = class FinanceController {
    constructor(financeService, settlementScheduler) {
        this.financeService = financeService;
        this.settlementScheduler = settlementScheduler;
    }
    async getBalance(userId, user) {
        // Allow Admins to view any balance, but Users only their own.
        // If userId is provided and different from user.uid, check Role.
        if (userId && userId !== user.uid) {
            // If user is NOT admin, forbid.
            // We need to implement manual role check here or assume specific endpoints?
            // Simplest: If userId provided, must be Admin or Self.
            // Ideally we use a wrapper, but for now logic is fine.
            const isAdmin = [users_dto_1.UserRole.ADMIN, users_dto_1.UserRole.FUDAYDIYE_ADMIN].includes(user.role);
            if (!isAdmin) {
                // Force return self balance
                return this.financeService.getBalance(user.uid);
            }
        }
        return this.financeService.getBalance(userId || user.uid);
    }
    async createTransaction(dto) {
        return this.financeService.createTransaction(dto);
    }
    async requestPayout(dto, user) {
        // Enforce userId matches token
        if (dto.userId !== user.uid) {
            // Override or reject? Let's override to be safe.
            dto.userId = user.uid;
        }
        return this.financeService.requestPayout(dto);
    }
    /**
     * Manual Trigger for Settlement (Protected Admin Check)
     */
    async triggerDaySettlement() {
        return this.settlementScheduler.settleDayShift();
    }
    async triggerNightSettlement() {
        return this.settlementScheduler.settleNightShift();
    }
    async authorizePayout(id, user) {
        return this.financeService.authorizePayout(id, user.uid);
    }
    async getAllPayouts() {
        return this.financeService.getAllPayouts();
    }
    async getAllTransactions() {
        return this.financeService.getAllTransactions();
    }
};
__decorate([
    (0, common_1.Get)('balance'),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Post)('transaction'),
    (0, roles_decorator_1.Roles)(users_dto_1.UserRole.ADMIN, users_dto_1.UserRole.FUDAYDIYE_ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.CreateTransactionDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "createTransaction", null);
__decorate([
    (0, common_1.Post)('payout/request'),
    (0, roles_decorator_1.Roles)(users_dto_1.UserRole.RIDER, users_dto_1.UserRole.VENDOR),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [finance_dto_1.RequestPayoutDto, Object]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "requestPayout", null);
__decorate([
    (0, common_1.Post)('settle/day'),
    (0, roles_decorator_1.Roles)(users_dto_1.UserRole.ADMIN, users_dto_1.UserRole.FUDAYDIYE_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "triggerDaySettlement", null);
__decorate([
    (0, common_1.Post)('settle/night'),
    (0, roles_decorator_1.Roles)(users_dto_1.UserRole.ADMIN, users_dto_1.UserRole.FUDAYDIYE_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "triggerNightSettlement", null);
__decorate([
    (0, common_1.Post)('payout/:id/authorize'),
    (0, roles_decorator_1.Roles)(users_dto_1.UserRole.ADMIN, users_dto_1.UserRole.FUDAYDIYE_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "authorizePayout", null);
__decorate([
    (0, common_1.Get)('payouts'),
    (0, roles_decorator_1.Roles)(users_dto_1.UserRole.ADMIN, users_dto_1.UserRole.FUDAYDIYE_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getAllPayouts", null);
__decorate([
    (0, common_1.Get)('transactions'),
    (0, roles_decorator_1.Roles)(users_dto_1.UserRole.ADMIN, users_dto_1.UserRole.FUDAYDIYE_ADMIN),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getAllTransactions", null);
FinanceController = __decorate([
    (0, common_1.Controller)('finance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [finance_service_1.FinanceService,
        settlement_scheduler_1.SettlementScheduler])
], FinanceController);
exports.FinanceController = FinanceController;
//# sourceMappingURL=finance.controller.js.map