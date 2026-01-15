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
exports.AdjustStockDto = exports.InventoryReason = void 0;
const class_validator_1 = require("class-validator");
var InventoryReason;
(function (InventoryReason) {
    InventoryReason["RESTOCK"] = "RESTOCK";
    InventoryReason["SALE"] = "SALE";
    InventoryReason["DAMAGE"] = "DAMAGE";
    InventoryReason["CORRECTION"] = "CORRECTION";
    InventoryReason["RETURN"] = "RETURN";
})(InventoryReason = exports.InventoryReason || (exports.InventoryReason = {}));
class AdjustStockDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AdjustStockDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AdjustStockDto.prototype, "change", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(InventoryReason),
    __metadata("design:type", String)
], AdjustStockDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AdjustStockDto.prototype, "notes", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AdjustStockDto.prototype, "orderId", void 0);
exports.AdjustStockDto = AdjustStockDto;
//# sourceMappingURL=adjust-stock.dto.js.map