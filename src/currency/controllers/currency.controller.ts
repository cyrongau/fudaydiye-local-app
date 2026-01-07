
import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExchangeRateService } from '../services/exchange-rate.service';
import { CurrencyEngineService } from '../services/currency-engine.service';
import { CreateExchangeRateDto, ExchangeRateResponseDto } from '../dto/exchange-rate.dto';
import { ValidatePaymentDto, PreparedPaymentResponseDto } from '../dto/checkout-currency.dto';

@ApiTags('Currency & Exchange')
@Controller('currency')
export class CurrencyController {
  constructor(
    private readonly exchangeRateService: ExchangeRateService,
    private readonly engine: CurrencyEngineService,
  ) {}

  @Post('admin/rates')
  @ApiOperation({ summary: 'Update global exchange rate (Admin Only)' })
  @ApiResponse({ type: ExchangeRateResponseDto })
  async updateRate(@Body() dto: CreateExchangeRateDto) {
    return this.exchangeRateService.create(dto);
  }

  @Get('rates/active')
  @ApiOperation({ summary: 'Get currently active exchange rate' })
  async getActive() {
    return this.exchangeRateService.getActiveRate();
  }

  @Post('checkout/prepare')
  @ApiOperation({ summary: 'Validate and prepare payment payload for gateways' })
  @ApiResponse({ type: PreparedPaymentResponseDto })
  async validate(@Body() dto: ValidatePaymentDto) {
    return this.engine.preparePaymentPayload(dto);
  }
}
