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
exports.LogisticsController = void 0;
const common_1 = require("@nestjs/common");
const logistics_service_1 = require("./logistics.service");
const logistics_dto_1 = require("./dto/logistics.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const users_dto_1 = require("../users/dto/users.dto");
const user_decorator_1 = require("../common/decorators/user.decorator");
let LogisticsController = class LogisticsController {
    constructor(logisticsService) {
        this.logisticsService = logisticsService;
    }
    updateLocation(updateLocationDto, user) {
        // Enforce Rider Identity
        if (updateLocationDto.riderId !== user.uid) {
            // Admins can update any? Let's say yes for debugging, but mostly Riders update self.
            const isAdmin = [users_dto_1.UserRole.ADMIN, users_dto_1.UserRole.FUDAYDIYE_ADMIN].includes(user.role);
            if (!isAdmin) {
                throw new common_1.ForbiddenException("Cannot update location of another rider");
            }
        }
        return this.logisticsService.updateLocation(updateLocationDto);
    }
    assignJob(assignJobDto) {
        return this.logisticsService.assignJob(assignJobDto);
    }
    findNearby(lat, lng, radius) {
        return this.logisticsService.findNearbyRiders(Number(lat), Number(lng), Number(radius));
    }
    updateStatus(body, user) {
        if (body.riderId !== user.uid) {
            const isAdmin = [users_dto_1.UserRole.ADMIN, users_dto_1.UserRole.FUDAYDIYE_ADMIN].includes(user.role);
            if (!isAdmin) {
                throw new common_1.ForbiddenException("Cannot update status of another rider");
            }
        }
        return this.logisticsService.updateRiderStatus(body.riderId, body.status);
    }
    updateJobStatus(body, user) {
        // Rider confirming their own job
        if (body.riderId !== user.uid) {
            const isAdmin = [users_dto_1.UserRole.ADMIN, users_dto_1.UserRole.FUDAYDIYE_ADMIN].includes(user.role);
            if (!isAdmin) {
                throw new common_1.ForbiddenException("Cannot update job for another rider");
            }
        }
        return this.logisticsService.updateJobStatus(body.orderId, body.status, body.riderId);
    }
};
__decorate([
    (0, common_1.Post)('rider/location'),
    (0, roles_decorator_1.Roles)(users_dto_1.UserRole.RIDER, users_dto_1.UserRole.ADMIN, users_dto_1.UserRole.FUDAYDIYE_ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [logistics_dto_1.UpdateLocationDto, Object]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "updateLocation", null);
__decorate([
    (0, common_1.Post)('jobs/assign'),
    (0, roles_decorator_1.Roles)(users_dto_1.UserRole.ADMIN, users_dto_1.UserRole.FUDAYDIYE_ADMIN) // Future: DISPATCHER role
    ,
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [logistics_dto_1.AssignJobDto]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "assignJob", null);
__decorate([
    (0, common_1.Get)('riders/nearby'),
    (0, roles_decorator_1.Roles)(users_dto_1.UserRole.ADMIN, users_dto_1.UserRole.FUDAYDIYE_ADMIN) // Protect rider location data
    ,
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lng')),
    __param(2, (0, common_1.Query)('radius')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "findNearby", null);
__decorate([
    (0, common_1.Post)('rider/status'),
    (0, roles_decorator_1.Roles)(users_dto_1.UserRole.RIDER, users_dto_1.UserRole.ADMIN, users_dto_1.UserRole.FUDAYDIYE_ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Post)('jobs/status'),
    (0, roles_decorator_1.Roles)(users_dto_1.UserRole.RIDER, users_dto_1.UserRole.ADMIN, users_dto_1.UserRole.FUDAYDIYE_ADMIN),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, user_decorator_1.User)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "updateJobStatus", null);
LogisticsController = __decorate([
    (0, common_1.Controller)('logistics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [logistics_service_1.LogisticsService])
], LogisticsController);
exports.LogisticsController = LogisticsController;
//# sourceMappingURL=logistics.controller.js.map