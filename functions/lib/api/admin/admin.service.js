"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
let AdminService = class AdminService {
    constructor() {
        this.db = admin.firestore();
    }
    async updateSystemConfig(dto, uid) {
        const ref = this.db.collection('system_config').doc('global');
        // Prepare update object to merge
        const updateData = {
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
            updatedBy: uid // Audit trail
        };
        if (dto.integrations)
            updateData.integrations = dto.integrations;
        if (dto.settings)
            updateData.settings = dto.settings;
        if (dto.business)
            updateData.business = dto.business;
        await ref.set(updateData, { merge: true });
        return { success: true };
    }
    async saveCMSContent(id, dto) {
        // If ID is provided, use it, else generate one
        const docId = id || this.db.collection('cms_content').doc().id;
        const ref = this.db.collection('cms_content').doc(docId);
        const data = Object.assign(Object.assign({}, dto), { updatedAt: firestore_1.FieldValue.serverTimestamp() });
        if (!id) {
            data.createdAt = firestore_1.FieldValue.serverTimestamp();
        }
        await ref.set(data, { merge: true });
        return { success: true, id: docId };
    }
    async getSystemStats() {
        const db = this.db;
        // 1. Order Aggregations (Total Orders, GMV)
        // Note: For large datasets, use Distributed Counters or Aggr queries. 
        // Prototype: Client-side logic but on Server (Read optimization needed later).
        // Improving: Use Count() queries for standard counts.
        const ordersColl = db.collection('orders');
        const countSnap = await ordersColl.count().get();
        const totalOrders = countSnap.data().count;
        // GMV (Simulated efficient aggregation via query or sum field maintainer)
        // For accurate GMV without reading all docs, we should maintain a 'stats' doc.
        // For now, let's do a limited query logic or check 'system_config/stats' if we had one.
        // Let's implement a quick aggregation usage if supported, or manual logical sum on recent orders.
        // Fallback: Read last 100 orders for "Recent Volume" to show connectivity.
        // Or better: We assume there's a 'stats' aggregation document updated by triggers.
        // Since we don't have triggers set up, let's mock the "Reads" by checking actual recent transactions.
        // Real logic override:
        const paidOrdersSnap = await ordersColl.where('status', 'in', ['CONFIRMED', 'SHIPPED', 'DELIVERED']).get();
        const gmv = paidOrdersSnap.docs.reduce((acc, doc) => acc + (doc.data().total || 0), 0);
        // 2. Platform Revenue (10% of GMV + Fees)
        const revenue = gmv * 0.10; // Simplified
        // 3. Active Riders
        const ridersSnap = await db.collection('riders').where('status', 'in', ['ONLINE', 'BUSY']).count().get();
        const activeRiders = ridersSnap.data().count;
        // 4. Pending Payouts
        const payoutsSnap = await db.collection('payouts').where('status', '==', 'PENDING').get();
        const pendingPayouts = payoutsSnap.docs.reduce((acc, doc) => acc + (doc.data().amount || 0), 0);
        return {
            totalOrders,
            gmv,
            revenue,
            activeRiders,
            pendingPayouts
        };
    }
};
AdminService = __decorate([
    (0, common_1.Injectable)()
], AdminService);
exports.AdminService = AdminService;
//# sourceMappingURL=admin.service.js.map