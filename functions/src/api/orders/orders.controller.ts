
import { Controller, Post, Body, Get, Param, Query, UsePipes, ValidationPipe, UseGuards, Patch } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, AssignRiderDto } from './dto/orders.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { UserRole } from '../users/dto/users.dto';

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    @UsePipes(new ValidationPipe({ transform: true }))
    create(@Body() createOrderDto: CreateOrderDto, @User() user: any) {
        // Enforce user ID from token if authenticated
        // If the DTO has recipientId, verify it matches (unless admin, but let's keep simple)
        // For guest (no token), guards would block.
        // Wait, do we allow Guest checkout?
        // - "recipientId || guest_..."
        // If we apply JwtAuthGuard globally to POST, we block guests.
        // Phase 3 Plan: "Secure OrdersController with Guards and user validation."
        // If we want Guest checkout, we might need a Public POST or IsOptionalAuth.
        // Given "Migrate User/Auth", usually implies we drive auth.
        // Let's assume for now authenticated only (Mobile App flow).

        return this.ordersService.create(createOrderDto, user.uid);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @Get()
    @UseGuards(JwtAuthGuard)
    findAll(
        @Query('limit') limit: number,
        @Query('status') status: string,
        @User() user: any
    ) {
        return this.ordersService.findAll(user, limit, status);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    findOne(@Param('id') id: string) {
        return this.ordersService.findOne(id);
    }

    @Post(':id/pay')
    @UseGuards(JwtAuthGuard)
    async initiatePayment(
        @Param('id') id: string,
        @Body() body: { paymentMethod: string; paymentDetails: any },
        @User() user: any
    ) {
        return this.ordersService.initiatePayment(id, user.uid, body.paymentMethod, body.paymentDetails);
    }

    @Post(':id/cancel-v2')
    @UseGuards(JwtAuthGuard)
    async cancelOrder(@Param('id') orderId: string, @Body() body: { reason?: string }, @User() user: any) {
        return this.ordersService.cancelOrder(orderId, user.uid, body.reason, user.role);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR, UserRole.FUDAYDIYE_ADMIN)
    updateStatus(@Param('id') id: string, @Body() body: UpdateOrderStatusDto, @User() user: any) {
        return this.ordersService.updateStatus(id, body.status, user.uid);
    }

    @Patch(':id/assign-rider')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR, UserRole.FUDAYDIYE_ADMIN)
    assignRider(@Param('id') id: string, @Body() body: AssignRiderDto, @User() user: any) {
        return this.ordersService.assignRider(id, body.riderId, body.riderName, user.uid);
    }
}
