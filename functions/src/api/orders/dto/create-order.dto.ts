
import { IsNotEmpty, IsNumber, IsString, IsArray, ValidateNested, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CartItemDto {
    @IsString()
    @IsNotEmpty()
    productId!: string;

    @IsString()
    @IsOptional()
    variationId?: string;

    @IsNumber()
    qty!: number;

    @IsString()
    @IsNotEmpty()
    vendorId!: string;
}

export class CreateOrderDto {
    @IsString()
    @IsOptional()
    recipientId?: string;

    @IsString()
    @IsNotEmpty()
    recipientName!: string;

    @IsString()
    @IsNotEmpty()
    recipientPhone!: string;

    @IsString()
    @IsNotEmpty()
    recipientAddress!: string;

    @IsString()
    @IsNotEmpty()
    paymentMethod!: string;

    @IsOptional()
    paymentDetails?: any;

    @IsNumber()
    deliveryFee!: number;

    @IsBoolean()
    isAtomic!: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CartItemDto)
    cartItems!: CartItemDto[];

    @IsBoolean()
    @IsOptional()
    savePayment?: boolean;

    @IsString()
    @IsOptional()
    syncCartId?: string;
}
