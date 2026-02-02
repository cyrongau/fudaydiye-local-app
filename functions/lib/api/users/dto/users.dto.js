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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateRoleDto = exports.UpdateUserStatusDto = exports.UpdateProfileDto = exports.CreateUserDto = exports.KycStatus = exports.VendorStatus = exports.UserRole = void 0;
const class_validator_1 = require("class-validator");
var UserRole;
(function (UserRole) {
    UserRole["CUSTOMER"] = "CUSTOMER";
    UserRole["VENDOR"] = "VENDOR";
    UserRole["RIDER"] = "RIDER";
    UserRole["CLIENT"] = "CLIENT";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["FUDAYDIYE_ADMIN"] = "FUDAYDIYE_ADMIN";
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
})(UserRole = exports.UserRole || (exports.UserRole = {}));
var VendorStatus;
(function (VendorStatus) {
    VendorStatus["PENDING"] = "PENDING";
    VendorStatus["ACTIVE"] = "ACTIVE";
    VendorStatus["SUSPENDED"] = "SUSPENDED";
    VendorStatus["REJECTED"] = "REJECTED";
})(VendorStatus = exports.VendorStatus || (exports.VendorStatus = {}));
var KycStatus;
(function (KycStatus) {
    KycStatus["NONE"] = "NONE";
    KycStatus["PENDING"] = "PENDING";
    KycStatus["VERIFIED"] = "VERIFIED";
    KycStatus["REJECTED"] = "REJECTED";
})(KycStatus = exports.KycStatus || (exports.KycStatus = {}));
class CreateUserDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "uid", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "mobile", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(UserRole),
    __metadata("design:type", String)
], CreateUserDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "businessName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "businessLogo", void 0);
exports.CreateUserDto = CreateUserDto;
class UpdateProfileDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "businessName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "businessLogo", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "avatar", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "vehicleType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "plateNumber", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "mobile", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(KycStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "kycStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateProfileDto.prototype, "lat", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateProfileDto.prototype, "lng", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "operationalHub", void 0);
exports.UpdateProfileDto = UpdateProfileDto;
class UpdateUserStatusDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateUserStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(VendorStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateUserStatusDto.prototype, "vendorStatus", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateUserStatusDto.prototype, "isAccountLocked", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateUserStatusDto.prototype, "canStream", void 0);
exports.UpdateUserStatusDto = UpdateUserStatusDto;
class UpdateRoleDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(UserRole),
    __metadata("design:type", String)
], UpdateRoleDto.prototype, "role", void 0);
exports.UpdateRoleDto = UpdateRoleDto;
//# sourceMappingURL=users.dto.js.map