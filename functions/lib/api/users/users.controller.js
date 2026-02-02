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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const users_dto_1 = require("./dto/users.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    create(createUserDto) {
        return this.usersService.create(createUserDto);
    }
    findAll(role) {
        return this.usersService.findAll(role);
    }
    findOne(uid, req) {
        // Allow if owner or Admin
        const user = req.user;
        if (user.uid !== uid && !['ADMIN', 'FUDAYDIYE_ADMIN'].includes(user.role)) {
            throw new common_1.ForbiddenException("You can only view your own profile.");
        }
        return this.usersService.findOne(uid);
    }
    update(uid, updateProfileDto, req) {
        const user = req.user;
        if (user.uid !== uid && !['ADMIN', 'FUDAYDIYE_ADMIN'].includes(user.role)) {
            throw new common_1.ForbiddenException("You can only update your own profile.");
        }
        return this.usersService.update(uid, updateProfileDto);
    }
    setRole(uid, body) {
        return this.usersService.setRole(uid, body.role);
    }
    updateStatus(uid, body) {
        return this.usersService.updateStatus(uid, body);
    }
    delete(uid) {
        return this.usersService.deleteUser(uid);
    }
    resetPassword(uid) {
        return this.usersService.resetPassword(uid);
    }
    uploadKyc(uid, body, req) {
        const user = req.user;
        if (user.uid !== uid) {
            throw new common_1.ForbiddenException("You can only upload KYC for your own profile.");
        }
        return this.usersService.uploadKyc(uid, body);
    }
    async syncMyClaims(req) {
        // Self-service endpoint: sync custom claims from Firestore
        const user = req.user;
        return this.usersService.syncCustomClaims(user.uid);
    }
};
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [users_dto_1.CreateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(users_dto_1.UserRole.ADMIN, users_dto_1.UserRole.FUDAYDIYE_ADMIN),
    __param(0, (0, common_1.Query)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':uid'),
    __param(0, (0, common_1.Param)('uid')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':uid'),
    __param(0, (0, common_1.Param)('uid')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, users_dto_1.UpdateProfileDto, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':uid/role'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(users_dto_1.UserRole.ADMIN, users_dto_1.UserRole.FUDAYDIYE_ADMIN),
    __param(0, (0, common_1.Param)('uid')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, users_dto_1.UpdateRoleDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "setRole", null);
__decorate([
    (0, common_1.Patch)(':uid/status'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(users_dto_1.UserRole.ADMIN, users_dto_1.UserRole.FUDAYDIYE_ADMIN),
    __param(0, (0, common_1.Param)('uid')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, users_dto_1.UpdateUserStatusDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':uid'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(users_dto_1.UserRole.ADMIN, users_dto_1.UserRole.FUDAYDIYE_ADMIN),
    __param(0, (0, common_1.Param)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "delete", null);
__decorate([
    (0, common_1.Post)(':uid/reset-password'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(users_dto_1.UserRole.ADMIN, users_dto_1.UserRole.FUDAYDIYE_ADMIN),
    __param(0, (0, common_1.Param)('uid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)(':uid/kyc'),
    __param(0, (0, common_1.Param)('uid')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "uploadKyc", null);
__decorate([
    (0, common_1.Post)('me/sync-claims'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "syncMyClaims", null);
UsersController = __decorate([
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
exports.UsersController = UsersController;
//# sourceMappingURL=users.controller.js.map