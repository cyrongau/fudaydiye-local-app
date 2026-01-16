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
exports.LiveController = void 0;
const common_1 = require("@nestjs/common");
const live_dto_1 = require("./live.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const users_dto_1 = require("../users/dto/users.dto");
const user_decorator_1 = require("../common/decorators/user.decorator");
const live_service_1 = require("./live.service");
let LiveController = class LiveController {
    constructor(liveService) {
        this.liveService = liveService;
    }
    getReplays(hostId) {
        return this.liveService.getReplays(hostId);
    }
    getProducts(hostId) {
        return this.liveService.getHostProducts(hostId);
    }
    createSession(dto, user) {
        // We need vendorName and avatar. Since we don't have full profile in token usually,
        // we might fetch it or rely on minimal data. 
        // For efficiency, assume token has basics or Service fetches it.
        // Let's pass basic params and let Service enrich if needed logic expands.
        // Actually, let's fetch profile in Service if needed, or just pass placeholders effectively?
        // Let's rely on token custom claims if they exist, or user record.
        // Simplest: Pass what we have.
        // TODO: ideally fetch profile first.
        // Just generic placeholders or empty for now, as profile fetch adds read cost.
        // Ideally backend logic: `this.usersService.findOne(user.uid)`
        return this.liveService.createSession(dto, user.uid, user.name || "Host", user.picture || "");
    }
    updateStatus(id, body, user) {
        return this.liveService.updateStatus(id, body.status, user.uid);
    }
    updateSession(id, body, user) {
        // Using 'any' for body temporarily or import UpdateSessionDto if available
        // Ideally: @Body() body: UpdateSessionDto
        return this.liveService.updateSession(id, body, user.uid);
    }
    pinProduct(id, body, user) {
        return this.liveService.pinProduct(id, body.productId, user.uid);
    }
};
__decorate([
    (0, common_1.Get)(':hostId/replays'),
    __param(0, (0, common_1.Param)('hostId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LiveController.prototype, "getReplays", null);
__decorate([
    (0, common_1.Get)(':hostId/products'),
    __param(0, (0, common_1.Param)('hostId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LiveController.prototype, "getProducts", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(users_dto_1.UserRole.VENDOR, users_dto_1.UserRole.FUDAYDIYE_ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [live_dto_1.CreateSessionDto, Object]),
    __metadata("design:returntype", void 0)
], LiveController.prototype, "createSession", null);
__decorate([
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, live_dto_1.UpdateSessionStatusDto, Object]),
    __metadata("design:returntype", void 0)
], LiveController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(users_dto_1.UserRole.VENDOR, users_dto_1.UserRole.FUDAYDIYE_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], LiveController.prototype, "updateSession", null);
__decorate([
    (0, common_1.Patch)(':id/pin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(users_dto_1.UserRole.VENDOR, users_dto_1.UserRole.FUDAYDIYE_ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, live_dto_1.PinProductDto, Object]),
    __metadata("design:returntype", void 0)
], LiveController.prototype, "pinProduct", null);
LiveController = __decorate([
    (0, common_1.Controller)('live'),
    __metadata("design:paramtypes", [live_service_1.LiveService])
], LiveController);
exports.LiveController = LiveController;
//# sourceMappingURL=live.controller.js.map