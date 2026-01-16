
import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/dto/users.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('dashboard')
    async getDashboardStats() {
        return this.analyticsService.getDashboardStats();
    }

    @Get('sales')
    async getSalesChart(@Query('days') days: number) {
        return this.analyticsService.getSalesChart(Number(days) || 7);
    }

    @Get('products')
    async getTopProducts(@Query('limit') limit: number) {
        return this.analyticsService.getTopProducts(Number(limit) || 5);
    }
}
