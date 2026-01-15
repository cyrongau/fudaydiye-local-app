import { Module } from '@nestjs/common';

import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { AuthModule } from './auth/auth.module';
import { LogisticsModule } from './logistics/logistics.module';
import { FinanceModule } from './finance/finance.module';
import { UsersModule } from './users/users.module';
import { InventoryModule } from './inventory/inventory.module';

@Module({
    imports: [
        OrdersModule,
        ProductsModule,
        LogisticsModule,
        FinanceModule,
        AuthModule,
        UsersModule,
        InventoryModule
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
