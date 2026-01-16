
import { Controller, Get, Post, Body, Query, UseGuards, Param } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateTransactionDto, RequestPayoutDto } from './dto/finance.dto';
import { SettlementScheduler } from './settlement.scheduler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/dto/users.dto';
import { User } from '../common/decorators/user.decorator';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
    constructor(
        private readonly financeService: FinanceService,
        private readonly settlementScheduler: SettlementScheduler
    ) { }

    @Get('balance')
    async getBalance(@Query('userId') userId: string, @User() user: any) {
        // Allow Admins to view any balance, but Users only their own.
        // If userId is provided and different from user.uid, check Role.
        if (userId && userId !== user.uid) {
            // If user is NOT admin, forbid.
            // We need to implement manual role check here or assume specific endpoints?
            // Simplest: If userId provided, must be Admin or Self.
            // Ideally we use a wrapper, but for now logic is fine.
            const isAdmin = [UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN].includes(user.role);
            if (!isAdmin) {
                // Force return self balance
                return this.financeService.getBalance(user.uid);
            }
        }
        return this.financeService.getBalance(userId || user.uid);
    }

    @Post('transaction')
    @Roles(UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN)
    async createTransaction(@Body() dto: CreateTransactionDto) {
        return this.financeService.createTransaction(dto);
    }

    @Post('payout/request')
    @Roles(UserRole.RIDER, UserRole.VENDOR)
    async requestPayout(@Body() dto: RequestPayoutDto, @User() user: any) {
        // Enforce userId matches token
        if (dto.userId !== user.uid) {
            // Override or reject? Let's override to be safe.
            dto.userId = user.uid;
        }
        return this.financeService.requestPayout(dto);
    }

    /**
     * Manual Trigger for Settlement (Protected Admin Check)
     */
    @Post('settle/day')
    @Roles(UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN)
    async triggerDaySettlement() {
        return this.settlementScheduler.settleDayShift();
    }

    @Post('settle/night')
    @Roles(UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN)
    async triggerNightSettlement() {
        return this.settlementScheduler.settleNightShift();
    }

    @Post('payout/:id/authorize')
    @Roles(UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN)
    async authorizePayout(@Param('id') id: string, @User() user: any) {
        return this.financeService.authorizePayout(id, user.uid);
    }

    @Get('payouts')
    @Roles(UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN)
    async getAllPayouts() {
        return this.financeService.getAllPayouts();
    }

    @Get('transactions')
    @Roles(UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN)
    async getAllTransactions() {
        return this.financeService.getAllTransactions();
    }
}
