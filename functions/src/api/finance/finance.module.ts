import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';

import { SettlementScheduler } from './settlement.scheduler';

@Module({
    controllers: [FinanceController],
    providers: [FinanceService, SettlementScheduler],
    exports: [FinanceService]
})
export class FinanceModule { }
