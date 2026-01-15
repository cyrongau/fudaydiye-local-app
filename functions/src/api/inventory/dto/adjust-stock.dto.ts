import { IsString, IsNumber, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';

export enum InventoryReason {
    RESTOCK = 'RESTOCK',
    SALE = 'SALE',
    DAMAGE = 'DAMAGE',
    CORRECTION = 'CORRECTION',
    RETURN = 'RETURN'
}

export class AdjustStockDto {
    @IsString()
    @IsNotEmpty()
    productId!: string;

    @IsNumber()
    change!: number;

    @IsEnum(InventoryReason)
    reason!: InventoryReason;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsOptional()
    orderId?: string;
}
