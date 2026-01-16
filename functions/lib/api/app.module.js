"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const products_module_1 = require("./products/products.module");
const orders_module_1 = require("./orders/orders.module");
const auth_module_1 = require("./auth/auth.module");
const logistics_module_1 = require("./logistics/logistics.module");
const finance_module_1 = require("./finance/finance.module");
const users_module_1 = require("./users/users.module");
const inventory_module_1 = require("./inventory/inventory.module");
const live_module_1 = require("./live/live.module");
const notifications_module_1 = require("./notifications/notifications.module");
const media_module_1 = require("./media/media.module");
const search_module_1 = require("./search/search.module");
const events_module_1 = require("./events/events.module");
const event_emitter_1 = require("@nestjs/event-emitter");
const admin_module_1 = require("./admin/admin.module");
const payments_module_1 = require("./payments/payments.module");
const analytics_module_1 = require("./analytics/analytics.module");
let AppModule = class AppModule {
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            event_emitter_1.EventEmitterModule.forRoot(),
            orders_module_1.OrdersModule,
            products_module_1.ProductsModule,
            logistics_module_1.LogisticsModule,
            finance_module_1.FinanceModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            inventory_module_1.InventoryModule,
            live_module_1.LiveModule,
            notifications_module_1.NotificationsModule,
            media_module_1.MediaModule,
            search_module_1.SearchModule,
            events_module_1.EventsModule,
            admin_module_1.AdminModule,
            payments_module_1.PaymentsModule,
            analytics_module_1.AnalyticsModule
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map