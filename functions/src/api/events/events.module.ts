import { Module, Global } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Global() // Make it global so we can inject EventsService into Orders/Live without imports everywhere
@Module({
    controllers: [EventsController],
    providers: [EventsService],
    exports: [EventsService],
})
export class EventsModule { }
