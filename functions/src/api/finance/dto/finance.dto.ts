import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

export enum TransactionType {
    DEPOSIT = 'DEPOSIT',
    WITHDRAWAL = 'WITHDRAWAL',
    EARNING = 'EARNING',
    PAYMENT = 'PAYMENT',
    REFUND = 'REFUND'
}

export enum TransactionStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    SETTLED = 'SETTLED' // For automated payouts
}

export class CreateTransactionDto {
    @IsString()
    userId!: string;

    @IsNumber()
    @Min(0.01)
    amount!: number;

    @IsEnum(TransactionType)
    type!: TransactionType;

    @IsString()
    description!: string;

    @IsString()
    @IsOptional()
    referenceId?: string; // Order ID or Payout Request ID
}

export class RequestPayoutDto {
    @IsString()
    userId!: string;

    @IsNumber()
    @Min(1)
    amount!: number;

    @IsString()
    method!: 'MOBILE_MONEY' | 'BANK';

    @IsString()
    accountNumber!: string;
}
