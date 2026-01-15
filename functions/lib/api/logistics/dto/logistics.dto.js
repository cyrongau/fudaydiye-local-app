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
exports.UpdateJobStatusDto = exports.UpdateRiderStatusDto = exports.AssignJobDto = exports.UpdateLocationDto = void 0;
const class_validator_1 = require("class-validator");
class UpdateLocationDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateLocationDto.prototype, "riderId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateLocationDto.prototype, "latitude", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UpdateLocationDto.prototype, "longitude", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['ONLINE', 'OFFLINE', 'BUSY']),
    __metadata("design:type", String)
], UpdateLocationDto.prototype, "status", void 0);
exports.UpdateLocationDto = UpdateLocationDto;
class AssignJobDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AssignJobDto.prototype, "orderId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AssignJobDto.prototype, "riderId", void 0);
exports.AssignJobDto = AssignJobDto;
class UpdateRiderStatusDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateRiderStatusDto.prototype, "riderId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['ONLINE', 'OFFLINE', 'BUSY']),
    __metadata("design:type", String)
], UpdateRiderStatusDto.prototype, "status", void 0);
exports.UpdateRiderStatusDto = UpdateRiderStatusDto;
class UpdateJobStatusDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateJobStatusDto.prototype, "orderId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['ACCEPTED', 'PICKED_UP', 'DELIVERED', 'CANCELLED']),
    __metadata("design:type", String)
], UpdateJobStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateJobStatusDto.prototype, "riderId", void 0);
exports.UpdateJobStatusDto = UpdateJobStatusDto;
//# sourceMappingURL=logistics.dto.js.map