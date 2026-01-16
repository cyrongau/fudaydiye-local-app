import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/dto/users.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Post('test')
    @Roles(UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN)
    async sendTest(@Body() body: { type: 'EMAIL' | 'SMS', to: string }) {
        return this.notificationsService.sendTestNotification(body.type, body.to);
    }

    @Post('send')
    @Roles(UserRole.ADMIN, UserRole.FUDAYDIYE_ADMIN) // Restricted to admins for raw sending
    async sendGeneric(@Body() body: { type: 'EMAIL' | 'SMS', to: string, subject: string, body: string }) {
        return this.notificationsService.sendGenericNotification(body.type, body.to, body.subject || 'Notification', body.body);
    }

    @Post('token')
    // Accessible to all authenticated users (default JwtAuthGuard from class level)
    async registerToken(@Body() body: { token: string }, @Request() req: any) {
        return this.notificationsService.registerFcmToken(req.user.uid, body.token);
    }
}
