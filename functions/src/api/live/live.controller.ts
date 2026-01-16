
import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { CreateSessionDto, UpdateSessionStatusDto, PinProductDto } from './live.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/dto/users.dto';
import { User } from '../common/decorators/user.decorator';
import { LiveService } from './live.service';

@Controller('live')
export class LiveController {
    constructor(private readonly liveService: LiveService) { }

    @Get(':hostId/replays')
    getReplays(@Param('hostId') hostId: string) {
        return this.liveService.getReplays(hostId);
    }

    @Get(':hostId/products')
    getProducts(@Param('hostId') hostId: string) {
        return this.liveService.getHostProducts(hostId);
    }


    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR, UserRole.FUDAYDIYE_ADMIN)
    createSession(@Body() dto: CreateSessionDto, @User() user: any) {
        // We need vendorName and avatar. Since we don't have full profile in token usually,
        // we might fetch it or rely on minimal data. 
        // For efficiency, assume token has basics or Service fetches it.
        // Let's pass basic params and let Service enrich if needed logic expands.
        // Actually, let's fetch profile in Service if needed, or just pass placeholders effectively?
        // Let's rely on token custom claims if they exist, or user record.
        // Simplest: Pass what we have.
        // TODO: ideally fetch profile first.
        // Just generic placeholders or empty for now, as profile fetch adds read cost.
        // Ideally backend logic: `this.usersService.findOne(user.uid)`
        return this.liveService.createSession(dto, user.uid, user.name || "Host", user.picture || "");
    }

    updateStatus(@Param('id') id: string, @Body() body: UpdateSessionStatusDto, @User() user: any) {
        return this.liveService.updateStatus(id, body.status, user.uid);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR, UserRole.FUDAYDIYE_ADMIN)
    updateSession(@Param('id') id: string, @Body() body: any, @User() user: any) {
        // Using 'any' for body temporarily or import UpdateSessionDto if available
        // Ideally: @Body() body: UpdateSessionDto
        return this.liveService.updateSession(id, body, user.uid);
    }

    @Patch(':id/pin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.VENDOR, UserRole.FUDAYDIYE_ADMIN)
    pinProduct(@Param('id') id: string, @Body() body: PinProductDto, @User() user: any) {
        return this.liveService.pinProduct(id, body.productId, user.uid);
    }
}
