
import { Injectable, Logger, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { UpdateLocationDto, AssignJobDto } from './dto/logistics.dto';
import * as geofire from 'geofire-common';

@Injectable()
export class LogisticsService {
    private readonly logger = new Logger(LogisticsService.name);
    private db: admin.firestore.Firestore;

    constructor() {
        this.db = admin.firestore();
    }

    async updateLocation(updateLocationDto: UpdateLocationDto) {
        const { riderId, latitude, longitude, status } = updateLocationDto;

        try {
            // Compute Geohash
            const hash = geofire.geohashForLocation([latitude, longitude]);

            await this.db.collection('riders').doc(riderId).set({
                currLocation: new admin.firestore.GeoPoint(latitude, longitude),
                geohash: hash, // For Geo-Queries
                status: status,
                lastHeartbeat: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            return { success: true };
        } catch (error) {
            this.logger.error(`Location update failed for ${riderId}:`, error);
            throw new InternalServerErrorException("Failed to update location.");
        }
    }

    async assignJob(assignJobDto: AssignJobDto) {
        const { orderId, riderId } = assignJobDto;

        // Transaction to ensure atomicity (Job not double-booked)
        try {
            await this.db.runTransaction(async (t) => {
                const orderRef = this.db.collection('orders').doc(orderId);
                const orderSnap = await t.get(orderRef);
                const riderRef = this.db.collection('riders').doc(riderId);

                if (!orderSnap.exists) throw new NotFoundException("Order not found");

                const orderData = orderSnap.data()!;
                if (orderData.riderId) throw new BadRequestException("Order already assigned");

                t.update(orderRef, {
                    riderId: riderId,
                    status: 'DISPATCHED',
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });

                t.update(riderRef, {
                    status: 'BUSY',
                    currentOrderId: orderId
                });
            });

            return { success: true, message: "Job assigned" };

        } catch (error: any) {
            this.logger.error(`Dispatch failed:`, error);
            throw error.status ? error : new InternalServerErrorException("Dispatch failed");
        }
    }

    async findNearbyRiders(latitude: number, longitude: number, radiusKm: number = 5) {
        const center: [number, number] = [latitude, longitude];
        const radiusInM = radiusKm * 1000;

        // 1. Calculate Geohash Bounds
        const bounds = geofire.geohashQueryBounds(center, radiusInM);
        const promises = [];

        // 2. Query each bound (usually 4-9 queries)
        for (const b of bounds) {
            const q = this.db.collection('riders')
                .where('status', '==', 'ONLINE')
                .orderBy('geohash')
                .startAt(b[0])
                .endAt(b[1]);

            promises.push(q.get());
        }

        // 3. Collect Results
        const snapshots = await Promise.all(promises);
        const matchingDocs = [];

        for (const snap of snapshots) {
            for (const doc of snap.docs) {
                const data = doc.data();
                const lat = data.currLocation.latitude;
                const lng = data.currLocation.longitude;

                // 4. Client-side filtering for exact distance (False positives removal)
                const distanceInKm = geofire.distanceBetween([lat, lng], center);
                const distanceInM = distanceInKm * 1000;

                if (distanceInM <= radiusInM) {
                    matchingDocs.push({ id: doc.id, ...data, distance: distanceInKm });
                }
            }
        }

        // 5. Sort by Distance
        return matchingDocs.sort((a, b) => a.distance - b.distance);
    }

    async updateRiderStatus(riderId: string, status: string) {
        try {
            await this.db.collection('riders').doc(riderId).update({
                status: status,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            this.logger.error(`Status update failed for ${riderId}`, error);
            throw new InternalServerErrorException("Failed to update status");
        }
    }

    async updateJobStatus(orderId: string, status: string, riderId: string) {
        try {
            await this.db.runTransaction(async (t) => {
                const orderRef = this.db.collection('orders').doc(orderId);
                const riderRef = this.db.collection('riders').doc(riderId);

                const orderSnap = await t.get(orderRef);
                if (!orderSnap.exists) throw new NotFoundException("Order not found");

                const orderData = orderSnap.data()!;
                if (orderData.riderId !== riderId) {
                    throw new BadRequestException("Rider does not own this job");
                }

                let updates: any = {
                    status: status,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                };

                // If DELIVERED or CANCELLED, free up the rider?
                // Or keep them BUSY until they manually go ONLINE?
                // Usually, DELIVERED -> ONLINE (Auto) or BUSY (remain busy).
                // Let's assume Auto-Online on Delivery for MVP simplicity, or just keep BUSY.

                t.update(orderRef, updates);

                if (status === 'DELIVERED') {
                    // Check logic from RiderDeliveryConfirmation
                    const orderTotal = orderData.total || 0;
                    const deliveryFee = orderData.deliveryFee || 3.50;

                    const platformFee = orderTotal * 0.10;
                    const merchantShare = orderTotal * 0.90; // Assuming total includes goods only, if total includes delivery fee this math changes. Stick to client logic.

                    // Identify Actors
                    const vendorId = orderData.vendorId;

                    // Implementation Plan says: Wallet Entity (Firestore: wallets/{userId})
                    // But RiderDeliveryConfirmation uses `users` collection for walletBalance.
                    // FinanceService uses `wallets`.
                    // MIGRATION CONFLICT: FinanceService uses `wallets` collection. Legacy Frontend uses `users` doc fields.
                    // To follow NEW ARCHITECTURE, we must use `wallets`.
                    // BUT if the Frontend expects `users` to have balance, we might break UI.
                    // WalletView uses `FinanceService.getBalance` which reads `wallets`.
                    // So we should write to `wallets`.

                    const vendorWalletRef = this.db.collection('wallets').doc(vendorId);
                    const riderWalletRef = this.db.collection('wallets').doc(riderId);
                    const adminWalletRef = this.db.collection('wallets').doc("system_super_admin");
                    const txRef = this.db.collection('transactions').doc();

                    // Update Order
                    t.update(orderRef, {
                        status: 'DELIVERED',
                        completedAt: admin.firestore.FieldValue.serverTimestamp(),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp()
                    });

                    // Free Rider
                    t.update(riderRef, {
                        currentOrderId: admin.firestore.FieldValue.delete(),
                        status: 'ONLINE',
                        lastAction: 'JOB_COMPLETED'
                    });

                    // 1. Credit Rider (Earning)
                    t.set(riderWalletRef, {
                        balance: admin.firestore.FieldValue.increment(deliveryFee),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        role: 'RIDER' // Ensure doc exists
                    }, { merge: true });

                    // 2. Credit Vendor (Sale Share)
                    t.set(vendorWalletRef, {
                        balance: admin.firestore.FieldValue.increment(merchantShare),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        role: 'VENDOR'
                    }, { merge: true });

                    // 3. Credit Admin (Platform Fee)
                    t.set(adminWalletRef, {
                        balance: admin.firestore.FieldValue.increment(platformFee),
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        role: 'ADMIN'
                    }, { merge: true });

                    // 4. Create Transaction Record (Rider Earning)
                    t.set(txRef, {
                        userId: riderId,
                        type: 'EARNING',
                        amount: deliveryFee,
                        status: 'COMPLETED',
                        referenceId: orderId,
                        description: `Dispatch Earning for Order #${orderData.orderNumber || orderId}`,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    });

                    // Optional: Create Transaction Records for Vendor and Admin? 
                    // For MVP, focus on Rider Earning visibility.
                } else {
                    t.update(orderRef, updates);
                }
            });
            return { success: true };
        } catch (error: any) {
            this.logger.error(`Job update failed for ${orderId}`, error);
            throw error.status ? error : new InternalServerErrorException("Failed to update job");
        }
    }
}
