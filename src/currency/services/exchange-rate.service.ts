
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateExchangeRateDto, ExchangeRateResponseDto } from '../dto/exchange-rate.dto';

@Injectable()
export class ExchangeRateService {
  // In-memory simulation. In production, use TypeORM/Prisma with PostgreSQL.
  private rates: ExchangeRateResponseDto[] = [
    {
      id: 'initial-rate',
      rate: 12000,
      source: 'Central Bank',
      isActive: true,
      createdAt: new Date(),
    },
  ];

  async create(dto: CreateExchangeRateDto): Promise<ExchangeRateResponseDto> {
    // Deactivate current active rate
    this.rates.forEach((r) => (r.isActive = false));

    const newRate: ExchangeRateResponseDto = {
      id: Math.random().toString(36).substring(7),
      ...dto,
      isActive: true,
      createdAt: new Date(),
    };

    this.rates.push(newRate);
    return newRate;
  }

  async getActiveRate(): Promise<ExchangeRateResponseDto> {
    const active = this.rates.find((r) => r.isActive);
    if (!active) throw new NotFoundException('No active exchange rate found');
    return active;
  }

  async findById(id: string): Promise<ExchangeRateResponseDto> {
    const rate = this.rates.find((r) => r.id === id);
    if (!rate) throw new NotFoundException('Exchange rate snapshot not found');
    return rate;
  }
}
