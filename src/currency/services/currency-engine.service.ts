
import { Injectable, BadRequestException } from '@nestjs/common';
import { ExchangeRateService } from './exchange-rate.service';
import { ValidatePaymentDto, PreparedPaymentResponseDto } from '../dto/checkout-currency.dto';
import { 
  Currency, 
  MOBILE_MONEY_METHODS, 
  CARD_METHODS, 
  USD_MIN_THRESHOLD 
} from '../constants/currency.constants';

@Injectable()
export class CurrencyEngineService {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  async preparePaymentPayload(dto: ValidatePaymentDto): Promise<PreparedPaymentResponseDto> {
    const activeRate = await this.exchangeRateService.getActiveRate();
    let finalCurrency: Currency;
    let message = 'Payment validated.';

    // Rule 1: Card payments are always USD
    if (CARD_METHODS.includes(dto.paymentMethod)) {
      if (dto.preferredCurrency && dto.preferredCurrency !== Currency.USD) {
        throw new BadRequestException('Card payments only support USD.');
      }
      finalCurrency = Currency.USD;
    } 
    // Rule 2: Mobile Money Constraints
    else if (MOBILE_MONEY_METHODS.includes(dto.paymentMethod)) {
      if (dto.totalUsd < USD_MIN_THRESHOLD) {
        finalCurrency = Currency.SLSH;
        if (dto.preferredCurrency === Currency.USD) {
          message = `Mobile money payments under $${USD_MIN_THRESHOLD} are restricted to SLSH. Converted automatically.`;
        }
      } else {
        // Above $100, allow user preference or default to USD
        finalCurrency = dto.preferredCurrency || Currency.USD;
      }
    }

    const isConverted = finalCurrency === Currency.SLSH;
    const finalAmount = isConverted 
      ? this.roundToWhole(dto.totalUsd * activeRate.rate)
      : dto.totalUsd;

    return {
      totalUsd: dto.totalUsd,
      totalConverted: finalAmount,
      paymentCurrency: finalCurrency,
      exchangeRateUsed: activeRate.rate,
      exchangeRateId: activeRate.id,
      isConversionRequired: isConverted,
      message,
    };
  }

  private roundToWhole(amount: number): number {
    // SLSH transactions are typically handled in whole units
    return Math.round(amount);
  }
}
