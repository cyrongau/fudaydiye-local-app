
import { Controller, Post, Patch, Body, Param, UseGuards, Get } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateSystemConfigDto, SaveCMSContentDto } from './admin.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/dto/users.dto';
import { User } from '../common/decorators/user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.FUDAYDIYE_ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Patch('config')
    updateConfig(@Body() dto: UpdateSystemConfigDto, @User() user: any) {
        return this.adminService.updateSystemConfig(dto, user.uid);
    }

    @Post('cms')
    createCMSContent(@Body() dto: SaveCMSContentDto) {
        return this.adminService.saveCMSContent(undefined, dto);
    }

    @Patch('cms/:id')
    updateCMSContent(@Param('id') id: string, @Body() dto: SaveCMSContentDto) {
        return this.adminService.saveCMSContent(id, dto);
    }
    @Get('stats')
    getStats() {
        return this.adminService.getSystemStats();
    }
}
