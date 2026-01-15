"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProductDto = void 0;
const swagger_1 = require("@nestjs/swagger"); // Or mapped-types if swagger unused, but swagger is good
// If @nestjs/swagger not installed/configured properly, use @nestjs/mapped-types
const create_product_dto_1 = require("./create-product.dto");
// Since we might not have mapped-types installed or prefer standalone:
// Actually PartialType from mapped-types is standard. Product uses swagger package in package.json?
// Checked package.json: "@nestjs/swagger": "^11.2.3". Good.
class UpdateProductDto extends (0, swagger_1.PartialType)(create_product_dto_1.CreateProductDto) {
}
exports.UpdateProductDto = UpdateProductDto;
//# sourceMappingURL=update-product.dto.js.map