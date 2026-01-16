import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/dto/users.dto';

@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MediaController {
    constructor(private readonly mediaService: MediaService) { }

    @Post('upload')
    @Roles(UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN)
    async upload(@Req() req: any) {
        const url = await this.mediaService.uploadFile(req);
        return { success: true, url };
    }
}
