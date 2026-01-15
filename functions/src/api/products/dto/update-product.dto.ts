import { PartialType } from '@nestjs/swagger'; // Or mapped-types if swagger unused, but swagger is good
// If @nestjs/swagger not installed/configured properly, use @nestjs/mapped-types
import { CreateProductDto } from './create-product.dto';

// Since we might not have mapped-types installed or prefer standalone:
// Actually PartialType from mapped-types is standard. Product uses swagger package in package.json?
// Checked package.json: "@nestjs/swagger": "^11.2.3". Good.

export class UpdateProductDto extends PartialType(CreateProductDto) { }
