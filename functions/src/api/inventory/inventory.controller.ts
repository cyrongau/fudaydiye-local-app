
import { Controller, Post, Body, Get, Param, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/dto/users.dto';
import { User } from '../common/decorators/user.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Post('adjust')
    @Roles(UserRole.VENDOR, UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN)
    @UsePipes(new ValidationPipe({ transform: true }))
    async adjustStock(@Body() adjustStockDto: AdjustStockDto, @User() user: any) {
        // TODO: Verify Vendor owns the product if user.role === VENDOR
        return this.inventoryService.adjustStock(adjustStockDto, user);
    }

    @Get(':productId/history')
    @Roles(UserRole.VENDOR, UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN)
    async getHistory(@Param('productId') productId: string, @Query('limit') limit: number) {
        return this.inventoryService.getHistory(productId, Number(limit) || 20);
    }
}
