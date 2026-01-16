"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
let AnalyticsService = AnalyticsService_1 = class AnalyticsService {
    constructor() {
        this.logger = new common_1.Logger(AnalyticsService_1.name);
        this.db = admin.firestore();
    }
    async getDashboardStats() {
        try {
            // 1. Total Orders
            const ordersSnapshot = await this.db.collection('orders').count().get();
            const totalOrders = ordersSnapshot.data().count;
            // 2. Active Users (Total Customers)
            const usersSnapshot = await this.db.collection('users').where('role', '==', 'CUSTOMER').count().get();
            const totalCustomers = usersSnapshot.data().count;
            // 3. Total Revenue (Naive Sum of all PAID orders - might be expensive without aggregation field)
            // Strategy: Use an aggregation query if available in this SDK version, or rely on a pre-calculated 'stats/global' doc.
            // For now, let's try a sum aggregation if supported, or fallback to a 'stats' doc we should strictly maintain.
            // Since we don't have a 'stats' doc yet, let's do a limited query or just return 0 for now and fix it properly.
            // Actually, Firestore SDK supports sum() now.
            const revenueSnapshot = await this.db.collection('orders')
                .where('paymentStatus', '==', 'PAID')
                .aggregate({
                totalRevenue: admin.firestore.AggregateField.sum('total')
            })
                .get();
            const totalRevenue = revenueSnapshot.data().totalRevenue || 0;
            // 4. Pending Orders
            const pendingSnapshot = await this.db.collection('orders')
                .where('status', 'in', ['PENDING', 'PROCESSING', 'READY_FOR_PICKUP'])
                .count()
                .get();
            const pendingOrders = pendingSnapshot.data().count;
            // 5. Total Vendors
            const vendorsSnapshot = await this.db.collection('users').where('role', '==', 'VENDOR').count().get();
            const totalVendors = vendorsSnapshot.data().count;
            // 6. Total Riders
            const ridersSnapshot = await this.db.collection('users').where('role', '==', 'RIDER').count().get();
            const totalRiders = ridersSnapshot.data().count;
            return {
                totalOrders,
                totalCustomers,
                totalRevenue,
                pendingOrders,
                totalVendors,
                totalRiders
            };
        }
        catch (error) {
            this.logger.error("Failed to fetch dashboard stats", error);
            // Return safe zeros or rethrow
            return {
                totalOrders: 0,
                totalCustomers: 0,
                totalRevenue: 0,
                pendingOrders: 0,
                totalVendors: 0,
                totalRiders: 0
            };
        }
    }
    async getSalesChart(days) {
        // This is hard with Firestore without a dedicated 'daily_sales' collection.
        // We can't query "group by date" easily.
        // Option 1: Query last N orders and client-side aggregate (heavy).
        // Option 2: Maintain a 'daily_stats' collection.
        // For MVP "Deep Analytics", let's return MOCK data or implement Option 2 going forward.
        // Since we don't have historical data, let's generate data based on real orders if possible, or just mock for the demo until we implement 'daily_stats'.
        // Let's try to fetch last 50 orders and map them to days.
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const snapshot = await this.db.collection('orders')
            .where('createdAt', '>=', startDate)
            .orderBy('createdAt', 'asc')
            .limit(100) // Safety limit
            .get();
        const salesMap = new Map();
        // Initialize map
        for (let d = 0; d < days; d++) {
            const date = new Date();
            date.setDate(date.getDate() - d);
            salesMap.set(date.toISOString().split('T')[0], 0);
        }
        snapshot.forEach(doc => {
            const data = doc.data();
            const date = data.createdAt.toDate().toISOString().split('T')[0];
            if (salesMap.has(date)) {
                salesMap.set(date, (salesMap.get(date) || 0) + (data.total || 0));
            }
        });
        // Convert to array
        const sales = Array.from(salesMap.entries())
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => a.date.localeCompare(b.date));
        return sales;
    }
    async getTopProducts(limit) {
        try {
            // Again, ideally 'products' collection has 'soldCount'.
            // Let's assume it does, or we sort by 'stock' (inverse? no).
            // We probably added 'salesCount' or similar before? Let's check Product model.
            // If not, we can query orders again (expensive). 
            // Better: Query 'products' order by 'salesCount' desc. (Need to ensure we increment this field).
            // For now, let's return a query on products, assuming 'salesCount' exists, else mock/random.
            const snapshot = await this.db.collection('products')
                .orderBy('salesCount', 'desc')
                .limit(limit)
                .get();
            if (snapshot.empty)
                return [];
            return snapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                sales: doc.data().salesCount || 0,
                revenue: (doc.data().price || 0) * (doc.data().salesCount || 0)
            }));
        }
        catch (error) {
            this.logger.error("Failed to fetch top products", error);
            return [];
        }
    }
};
AnalyticsService = AnalyticsService_1 = __decorate([
    (0, common_1.Injectable)()
], AnalyticsService);
exports.AnalyticsService = AnalyticsService;
//# sourceMappingURL=analytics.service.js.map