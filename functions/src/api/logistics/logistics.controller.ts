
import { Controller, Post, Body, Get, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { LogisticsService } from './logistics.service';
import { UpdateLocationDto, AssignJobDto } from './dto/logistics.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/dto/users.dto';
import { User } from '../common/decorators/user.decorator';

@Controller('logistics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LogisticsController {
    constructor(private readonly logisticsService: LogisticsService) { }

    @Post('rider/location')
    @Roles(UserRole.RIDER, UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN)
    updateLocation(@Body() updateLocationDto: UpdateLocationDto, @User() user: any) {
        // Enforce Rider Identity
        if (updateLocationDto.riderId !== user.uid) {
            // Admins can update any? Let's say yes for debugging, but mostly Riders update self.
            const isAdmin = [UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN].includes(user.role);
            if (!isAdmin) {
                throw new ForbiddenException("Cannot update location of another rider");
            }
        }
        return this.logisticsService.updateLocation(updateLocationDto);
    }

    @Post('jobs/assign')
    @Roles(UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN) // Future: DISPATCHER role
    assignJob(@Body() assignJobDto: AssignJobDto) {
        return this.logisticsService.assignJob(assignJobDto);
    }

    @Get('riders/nearby')
    @Roles(UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN) // Protect rider location data
    findNearby(@Query('lat') lat: number, @Query('lng') lng: number, @Query('radius') radius: number) {
        return this.logisticsService.findNearbyRiders(Number(lat), Number(lng), Number(radius));
    }

    @Post('rider/status')
    @Roles(UserRole.RIDER, UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN)
    updateStatus(@Body() body: { riderId: string, status: string }, @User() user: any) {
        if (body.riderId !== user.uid) {
            const isAdmin = [UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN].includes(user.role);
            if (!isAdmin) {
                throw new ForbiddenException("Cannot update status of another rider");
            }
        }
        return this.logisticsService.updateRiderStatus(body.riderId, body.status);
    }

    @Post('jobs/status')
    @Roles(UserRole.RIDER, UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN)
    updateJobStatus(@Body() body: { orderId: string, status: string, riderId: string }, @User() user: any) {
        // Rider confirming their own job
        if (body.riderId !== user.uid) {
            const isAdmin = [UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN].includes(user.role);
            if (!isAdmin) {
                throw new ForbiddenException("Cannot update job for another rider");
            }
        }
        return this.logisticsService.updateJobStatus(body.orderId, body.status, body.riderId);
    }

    @Post('orders')
    @Roles(UserRole.CLIENT, UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN) // Allow registered CLIENTs
    createOrder(@Body() dto: any, @User() user: any) {
        // Temporarily 'any' for DTO import, ideally CreateLogisticsOrderDto
        return this.logisticsService.createLogisticsOrder(dto, user.uid, user.name || 'Client');
    }
}
