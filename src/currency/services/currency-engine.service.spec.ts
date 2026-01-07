
// Add explicit imports for Jest globals to fix "Cannot find name" errors
import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyEngineService } from './currency-engine.service';
import { ExchangeRateService } from './exchange-rate.service';
import { PaymentMethod, Currency } from '../constants/currency.constants';

describe('CurrencyEngineService', () => {
  let service: CurrencyEngineService;
  let exchangeService: ExchangeRateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyEngineService,
        {
          provide: ExchangeRateService,
          useValue: {
            getActiveRate: jest.fn().mockResolvedValue({ id: '1', rate: 12000 }),
          },
        },
      ],
    }).compile();

    service = module.get<CurrencyEngineService>(CurrencyEngineService);
    exchangeService = module.get<ExchangeRateService>(ExchangeRateService);
  });

  it('should force SLSH for mobile money under $100', async () => {
    const result = await service.preparePaymentPayload({
      totalUsd: 50,
      paymentMethod: PaymentMethod.ZAAD,
      preferredCurrency: Currency.USD,
    });
    expect(result.paymentCurrency).toBe(Currency.SLSH);
    expect(result.totalConverted).toBe(600000); // 50 * 12000
  });

  it('should allow USD for mobile money at or above $100', async () => {
    const result = await service.preparePaymentPayload({
      totalUsd: 100,
      paymentMethod: PaymentMethod.ZAAD,
      preferredCurrency: Currency.USD,
    });
    expect(result.paymentCurrency).toBe(Currency.USD);
    expect(result.totalConverted).toBe(100);
  });

  it('should force USD for cards regardless of total', async () => {
    const result = await service.preparePaymentPayload({
      totalUsd: 200,
      paymentMethod: PaymentMethod.STRIPE_CARD,
    });
    expect(result.paymentCurrency).toBe(Currency.USD);
  });

  it('should throw error if card payment requests SLSH', async () => {
    await expect(service.preparePaymentPayload({
      totalUsd: 200,
      paymentMethod: PaymentMethod.STRIPE_CARD,
      preferredCurrency: Currency.SLSH,
    })).rejects.toThrow('Card payments only support USD');
  });
});
