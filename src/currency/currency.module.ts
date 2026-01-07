
import { Module } from '@nestjs/common';
import { ExchangeRateService } from './services/exchange-rate.service';
import { CurrencyEngineService } from './services/currency-engine.service';
import { CurrencyController } from './controllers/currency.controller';

@Module({
  controllers: [CurrencyController],
  providers: [ExchangeRateService, CurrencyEngineService],
  exports: [ExchangeRateService, CurrencyEngineService],
})
export class CurrencyModule {}
