
import { IsNumber, IsString, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExchangeRateDto {
  @ApiProperty({ example: 12500, description: 'How many SLSH for 1 USD' })
  @IsNumber()
  @Min(1)
  rate: number;

  @ApiProperty({ example: 'Central Bank of Somaliland', description: 'Reference source for this rate' })
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiProperty({ example: 'Morning update following market shift' })
  @IsString()
  notes?: string;
}

export class ExchangeRateResponseDto {
  id: string;
  rate: number;
  source: string;
  isActive: boolean;
  createdAt: Date;
}
