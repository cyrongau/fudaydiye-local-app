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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const inventory_service_1 = require("./inventory.service");
const adjust_stock_dto_1 = require("./dto/adjust-stock.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const users_dto_1 = require("../users/dto/users.dto");
const user_decorator_1 = require("../common/decorators/user.decorator");
let InventoryController = class InventoryController {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    async adjustStock(adjustStockDto, user) {
        // TODO: Verify Vendor owns the product if user.role === VENDOR
        return this.inventoryService.adjustStock(adjustStockDto, user.uid);
    }
    async getHistory(productId, limit) {
        return this.inventoryService.getHistory(productId, Number(limit) || 20);
    }
};
__decorate([
    (0, common_1.Post)('adjust'),
    (0, roles_decorator_1.Roles)(users_dto_1.UserRole.VENDOR, users_dto_1.UserRole.ADMIN, users_dto_1.UserRole.FUDAYDIYE_ADMIN),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [adjust_stock_dto_1.AdjustStockDto, Object]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "adjustStock", null);
__decorate([
    (0, common_1.Get)(':productId/history'),
    (0, roles_decorator_1.Roles)(users_dto_1.UserRole.VENDOR, users_dto_1.UserRole.ADMIN, users_dto_1.UserRole.FUDAYDIYE_ADMIN),
    __param(0, (0, common_1.Param)('productId')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getHistory", null);
InventoryController = __decorate([
    (0, common_1.Controller)('inventory'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
exports.InventoryController = InventoryController;
//# sourceMappingURL=inventory.controller.js.map