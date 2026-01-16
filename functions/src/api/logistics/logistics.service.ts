
import { Injectable, Logger, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
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

            const updateData = {
                currLocation: new admin.firestore.GeoPoint(latitude, longitude),
                geohash: hash, // For Geo-Queries
                status: status,
                lastHeartbeat: FieldValue.serverTimestamp()
            };

            await this.db.runTransaction(async (t) => {
                const riderRef = this.db.collection('riders').doc(riderId);
                const userRef = this.db.collection('users').doc(riderId);

                // Read Rider State to check for Active Job
                const riderSnap = await t.get(riderRef);
                const riderData = riderSnap.data();

                // Update Riders (Telemetry)
                t.set(riderRef, updateData, { merge: true });

                // Sync with Users (Profile/Frontend)
                t.set(userRef, {
                    currentGeo: { lat: latitude, lng: longitude },
                    status: status,
                    lastActive: FieldValue.serverTimestamp()
                }, { merge: true });

                // Sync with Active Order (Real-time Navigation)
                if (riderData?.currentOrderId) {
                    const orderRef = this.db.collection('orders').doc(riderData.currentOrderId);
                    t.update(orderRef, {
                        currentLocation: { lat: latitude, lng: longitude }
                    });
                }
            });

            return { success: true };
        } catch (error) {
            this.logger.error(`Location update failed for ${riderId}:`, error);
            throw new InternalServerErrorException("Failed to update location.");
        }
    }



    async updateRiderStatus(riderId: string, status: string) {
        try {
            await this.db.runTransaction(async (t) => {
                const riderRef = this.db.collection('riders').doc(riderId);
                const userRef = this.db.collection('users').doc(riderId);

                t.set(riderRef, {
                    status: status,
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });

                t.set(userRef, {
                    status: status,
                    lastActive: FieldValue.serverTimestamp()
                }, { merge: true });
            });
            return { success: true };
        } catch (error) {
            this.logger.error(`Status update failed for ${riderId}`, error);
            throw new InternalServerErrorException("Failed to update status");
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
                    updatedAt: FieldValue.serverTimestamp()
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

                if (status === 'CANCELLED') {
                    // Logic: Rider rejects/cancels -> Return job to PENDING pool
                    t.update(orderRef, {
                        riderId: FieldValue.delete(),
                        riderName: FieldValue.delete(),
                        status: 'PENDING',
                        updatedAt: FieldValue.serverTimestamp()
                    });

                    const riderSnap = await t.get(riderRef);
                    if (riderSnap.exists) {
                        t.update(riderRef, {
                            status: 'ONLINE',
                            currentOrderId: FieldValue.delete(),
                            lastAction: 'JOB_CANCELLED',
                            updatedAt: FieldValue.serverTimestamp()
                        });
                    } else {
                        // Edge case: Rider doc missing, just recreate bare minimum status
                        t.set(riderRef, {
                            status: 'ONLINE',
                            lastAction: 'JOB_CANCELLED',
                            updatedAt: FieldValue.serverTimestamp()
                        });
                    }

                    // Notify Vendor? Optional but good practice
                    return;
                }

                // Map 'PICKED_UP' to 'SHIPPED' for consistency with Order Statuses
                const mappedStatus = status === 'PICKED_UP' ? 'SHIPPED' : status;

                let updates: any = {
                    status: mappedStatus,
                    updatedAt: FieldValue.serverTimestamp()
                };

                // Notification Logic
                const notificationRef = this.db.collection('notifications').doc();
                let notifyCustomer = false;
                let notificationTitle = "";
                let notificationMessage = "";

                if (mappedStatus === 'SHIPPED') {
                    notifyCustomer = true;
                    notificationTitle = "On The Way! 🛵";
                    notificationMessage = `Your order #${orderData.orderNumber || orderId} has been picked up by ${orderData.riderName || 'the rider'} and is on its way to you!`;
                } else if (mappedStatus === 'DELIVERED') {
                    notifyCustomer = true;
                    notificationTitle = "Delivered! 📦";
                    notificationMessage = `Order #${orderData.orderNumber || orderId} has been successfully delivered. Enjoy!`;
                }

                if (notifyCustomer && orderData.customerId) {
                    t.set(notificationRef, {
                        userId: orderData.customerId,
                        title: notificationTitle,
                        message: notificationMessage,
                        type: 'ORDER',
                        isRead: false,
                        link: `/customer/orders`, // Direct to Order Hub
                        createdAt: FieldValue.serverTimestamp()
                    });
                }

                if (mappedStatus === 'DELIVERED') {
                    // Check logic from RiderDeliveryConfirmation
                    const orderTotal = orderData.total || 0;
                    const deliveryFee = orderData.deliveryFee || 5.00; // Use updated default

                    const platformFee = orderTotal * 0.10;
                    const merchantShare = orderTotal * 0.90;

                    // Identify Actors
                    const vendorId = orderData.vendorId;

                    const vendorWalletRef = this.db.collection('wallets').doc(vendorId);
                    const riderWalletRef = this.db.collection('wallets').doc(riderId);
                    const adminWalletRef = this.db.collection('wallets').doc("system_super_admin");
                    const txRef = this.db.collection('transactions').doc();

                    // Update Order
                    t.update(orderRef, {
                        status: 'DELIVERED',
                        completedAt: FieldValue.serverTimestamp(),
                        updatedAt: FieldValue.serverTimestamp()
                    });

                    // Free Rider
                    t.update(riderRef, {
                        currentOrderId: FieldValue.delete(),
                        status: 'ONLINE',
                        lastAction: 'JOB_COMPLETED'
                    });

                    // 1. Credit Rider (Earning)
                    t.set(riderWalletRef, {
                        balance: FieldValue.increment(deliveryFee),
                        updatedAt: FieldValue.serverTimestamp(),
                        role: 'RIDER'
                    }, { merge: true });

                    // 2. Credit Vendor (Sale Share)
                    t.set(vendorWalletRef, {
                        balance: FieldValue.increment(merchantShare),
                        updatedAt: FieldValue.serverTimestamp(),
                        role: 'VENDOR'
                    }, { merge: true });

                    // 3. Credit Admin (Platform Fee)
                    t.set(adminWalletRef, {
                        balance: FieldValue.increment(platformFee),
                        updatedAt: FieldValue.serverTimestamp(),
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
                        createdAt: FieldValue.serverTimestamp()
                    });
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
    async createLogisticsOrder(dto: any, userId: string, userName: string) {
        // Calculate Price Logic (Mock or Distance)
        // Base Price: $3.00
        // Size Multiplier
        let price = 3.00;
        if (dto.size === 'Medium') price += 2.00;
        if (dto.size === 'Large') price += 5.00;
        if (dto.size === 'Extra Heavy') price += 10.00;

        // Mock Distance Pricing (Random for now without specific coordinates from client string)
        price += 2.00;

        try {
            // Create Order Directly (No Transaction needed for single doc creation unless wallet check)
            // But we likely want to verify user/wallet? 
            // Start simple: Create PENDING order
            const orderRef = this.db.collection('orders').doc();
            const orderId = orderRef.id;

            const orderData = {
                type: 'LOGISTICS',
                status: 'PENDING',
                customerId: userId,
                customerName: userName,
                pickupLocation: { address: dto.pickup },
                dropoffLocation: { address: dto.dropoff },
                packageSize: dto.size,
                packageConditions: dto.conditions || [],
                notes: dto.notes || '',
                price: price, // Server Calculated
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
                orderNumber: `LOG-${Math.floor(1000 + Math.random() * 9000)}`
            };

            await orderRef.set(orderData);

            return { success: true, orderId: orderId, price: price };
        } catch (error) {
            this.logger.error("Failed to create logistics order", error);
            throw new InternalServerErrorException("Order creation failed");
        }
    }
}
