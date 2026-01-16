
import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { UpdateSystemConfigDto, SaveCMSContentDto } from './admin.dto';

@Injectable()
export class AdminService {
    private db = admin.firestore();

    async updateSystemConfig(dto: UpdateSystemConfigDto, uid: string) {
        const ref = this.db.collection('system_config').doc('global');

        // Prepare update object to merge
        const updateData: any = {
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: uid // Audit trail
        };

        if (dto.integrations) updateData.integrations = dto.integrations;
        if (dto.settings) updateData.settings = dto.settings;
        if (dto.business) updateData.business = dto.business;

        await ref.set(updateData, { merge: true });
        return { success: true };
    }

    async saveCMSContent(id: string | undefined, dto: SaveCMSContentDto) {
        // If ID is provided, use it, else generate one
        const docId = id || this.db.collection('cms_content').doc().id;
        const ref = this.db.collection('cms_content').doc(docId);

        const data: any = {
            ...dto,
            updatedAt: FieldValue.serverTimestamp()
        };

        if (!id) {
            data.createdAt = FieldValue.serverTimestamp();
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
}
