import { IsString, IsNumber, IsOptional, IsArray, IsEnum, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductAttributeDto {
    @IsString()
    id!: string;

    @IsString()
    name!: string;

    @IsArray()
    @IsString({ each: true })
    values!: string[];
}

export class CreateProductDto {
    @IsString()
    name!: string;

    @IsEnum(['SIMPLE', 'VARIABLE', 'EXTERNAL'])
    productType!: string;

    @IsNumber()
    basePrice!: number;

    @IsNumber()
    @IsOptional()
    salePrice?: number;

    @IsString()
    category!: string;

    // categorySlug might be derived or passed? Let's assume passed or handled by service
    @IsString()
    @IsOptional()
    categorySlug?: string;

    @IsArray()
    @IsString({ each: true })
    images!: string[];

    @IsString()
    vendorId!: string;

    @IsNumber()
    baseStock!: number;

    @IsString()
    @IsOptional()
    shortDescription?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsEnum(['ACTIVE', 'HIDDEN'])
    status!: string;

    @IsBoolean()
    hasVariations!: boolean;

    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => ProductAttributeDto)
    attributes?: ProductAttributeDto[];

    // simplified variations handling for now - assuming array of objects
    @IsArray()
    @IsOptional()
    variations?: any[];
}
