import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { EventsService } from './events.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Get()
    async getMyEvents(@Request() req: any, @Query('limit') limit: number) {
        return this.eventsService.getUserEvents(req.user.uid, limit || 20);
    }
}
