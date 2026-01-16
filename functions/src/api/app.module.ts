import { Module } from '@nestjs/common';

import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';
import { LogisticsModule } from './logistics/logistics.module';
import { FinanceModule } from './finance/finance.module';
import { UsersModule } from './users/users.module';
import { InventoryModule } from './inventory/inventory.module';
import { LiveModule } from './live/live.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MediaModule } from './media/media.module';
import { SearchModule } from './search/search.module';
import { EventsModule } from './events/events.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AdminModule } from './admin/admin.module';
import { PaymentsModule } from './payments/payments.module';

import { AnalyticsModule } from './analytics/analytics.module';

@Module({
    imports: [
        EventEmitterModule.forRoot(),
        OrdersModule,
        ProductsModule,
        LogisticsModule,
        FinanceModule,
        AuthModule,
        UsersModule,
        InventoryModule,
        LiveModule,
        NotificationsModule,
        MediaModule,
        SearchModule,
        EventsModule,
        AdminModule,
        PaymentsModule,
        AnalyticsModule
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
