
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Currency, PaymentMethod } from '../constants/currency.constants';

export class ValidatePaymentDto {
  @ApiProperty({ example: 45.50 })
  @IsNumber()
  @Min(0.01)
  totalUsd: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ enum: Currency, required: false })
  @IsOptional()
  @IsEnum(Currency)
  preferredCurrency?: Currency;
}

export class PreparedPaymentResponseDto {
  totalUsd: number;
  totalConverted: number;
  paymentCurrency: Currency;
  exchangeRateUsed: number;
  exchangeRateId: string;
  isConversionRequired: boolean;
  message: string;
}
