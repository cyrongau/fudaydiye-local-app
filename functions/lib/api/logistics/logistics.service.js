"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var LogisticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogisticsService = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
const geofire = require("geofire-common");
let LogisticsService = LogisticsService_1 = class LogisticsService {
    constructor() {
        this.logger = new common_1.Logger(LogisticsService_1.name);
        this.db = admin.firestore();
    }
    async updateLocation(updateLocationDto) {
        const { riderId, latitude, longitude, status } = updateLocationDto;
        try {
            // Compute Geohash
            const hash = geofire.geohashForLocation([latitude, longitude]);
            const updateData = {
                currLocation: new admin.firestore.GeoPoint(latitude, longitude),
                geohash: hash,
                status: status,
                lastHeartbeat: firestore_1.FieldValue.serverTimestamp()
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
                    lastActive: firestore_1.FieldValue.serverTimestamp()
                }, { merge: true });
                // Sync with Active Order (Real-time Navigation)
                if (riderData === null || riderData === void 0 ? void 0 : riderData.currentOrderId) {
                    const orderRef = this.db.collection('orders').doc(riderData.currentOrderId);
                    t.update(orderRef, {
                        currentLocation: { lat: latitude, lng: longitude }
                    });
                }
            });
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Location update failed for ${riderId}:`, error);
            throw new common_1.InternalServerErrorException("Failed to update location.");
        }
    }
    async updateRiderStatus(riderId, status) {
        try {
            await this.db.runTransaction(async (t) => {
                const riderRef = this.db.collection('riders').doc(riderId);
                const userRef = this.db.collection('users').doc(riderId);
                t.set(riderRef, {
                    status: status,
                    updatedAt: firestore_1.FieldValue.serverTimestamp()
                }, { merge: true });
                t.set(userRef, {
                    status: status,
                    lastActive: firestore_1.FieldValue.serverTimestamp()
                }, { merge: true });
            });
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Status update failed for ${riderId}`, error);
            throw new common_1.InternalServerErrorException("Failed to update status");
        }
    }
    async assignJob(assignJobDto) {
        const { orderId, riderId } = assignJobDto;
        // Transaction to ensure atomicity (Job not double-booked)
        try {
            await this.db.runTransaction(async (t) => {
                const orderRef = this.db.collection('orders').doc(orderId);
                const orderSnap = await t.get(orderRef);
                const riderRef = this.db.collection('riders').doc(riderId);
                if (!orderSnap.exists)
                    throw new common_1.NotFoundException("Order not found");
                const orderData = orderSnap.data();
                if (orderData.riderId)
                    throw new common_1.BadRequestException("Order already assigned");
                t.update(orderRef, {
                    riderId: riderId,
                    status: 'DISPATCHED',
                    updatedAt: firestore_1.FieldValue.serverTimestamp()
                });
                t.update(riderRef, {
                    status: 'BUSY',
                    currentOrderId: orderId
                });
            });
            return { success: true, message: "Job assigned" };
        }
        catch (error) {
            this.logger.error(`Dispatch failed:`, error);
            throw error.status ? error : new common_1.InternalServerErrorException("Dispatch failed");
        }
    }
    async findNearbyRiders(latitude, longitude, radiusKm = 5) {
        const center = [latitude, longitude];
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
                    matchingDocs.push(Object.assign(Object.assign({ id: doc.id }, data), { distance: distanceInKm }));
                }
            }
        }
        // 5. Sort by Distance
        return matchingDocs.sort((a, b) => a.distance - b.distance);
    }
    async updateJobStatus(orderId, status, riderId) {
        try {
            await this.db.runTransaction(async (t) => {
                const orderRef = this.db.collection('orders').doc(orderId);
                const riderRef = this.db.collection('riders').doc(riderId);
                const orderSnap = await t.get(orderRef);
                if (!orderSnap.exists)
                    throw new common_1.NotFoundException("Order not found");
                const orderData = orderSnap.data();
                if (orderData.riderId !== riderId) {
                    throw new common_1.BadRequestException("Rider does not own this job");
                }
                if (status === 'CANCELLED') {
                    // Logic: Rider rejects/cancels -> Return job to PENDING pool
                    t.update(orderRef, {
                        riderId: firestore_1.FieldValue.delete(),
                        riderName: firestore_1.FieldValue.delete(),
                        status: 'PENDING',
                        updatedAt: firestore_1.FieldValue.serverTimestamp()
                    });
                    const riderSnap = await t.get(riderRef);
                    if (riderSnap.exists) {
                        t.update(riderRef, {
                            status: 'ONLINE',
                            currentOrderId: firestore_1.FieldValue.delete(),
                            lastAction: 'JOB_CANCELLED',
                            updatedAt: firestore_1.FieldValue.serverTimestamp()
                        });
                    }
                    else {
                        // Edge case: Rider doc missing, just recreate bare minimum status
                        t.set(riderRef, {
                            status: 'ONLINE',
                            lastAction: 'JOB_CANCELLED',
                            updatedAt: firestore_1.FieldValue.serverTimestamp()
                        });
                    }
                    // Notify Vendor? Optional but good practice
                    return;
                }
                // Map 'PICKED_UP' to 'SHIPPED' for consistency with Order Statuses
                const mappedStatus = status === 'PICKED_UP' ? 'SHIPPED' : status;
                let updates = {
                    status: mappedStatus,
                    updatedAt: firestore_1.FieldValue.serverTimestamp()
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
                }
                else if (mappedStatus === 'DELIVERED') {
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
                        link: `/customer/orders`,
                        createdAt: firestore_1.FieldValue.serverTimestamp()
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
                        completedAt: firestore_1.FieldValue.serverTimestamp(),
                        updatedAt: firestore_1.FieldValue.serverTimestamp()
                    });
                    // Free Rider
                    t.update(riderRef, {
                        currentOrderId: firestore_1.FieldValue.delete(),
                        status: 'ONLINE',
                        lastAction: 'JOB_COMPLETED'
                    });
                    // 1. Credit Rider (Earning)
                    t.set(riderWalletRef, {
                        balance: firestore_1.FieldValue.increment(deliveryFee),
                        updatedAt: firestore_1.FieldValue.serverTimestamp(),
                        role: 'RIDER'
                    }, { merge: true });
                    // 2. Credit Vendor (Sale Share)
                    t.set(vendorWalletRef, {
                        balance: firestore_1.FieldValue.increment(merchantShare),
                        updatedAt: firestore_1.FieldValue.serverTimestamp(),
                        role: 'VENDOR'
                    }, { merge: true });
                    // 3. Credit Admin (Platform Fee)
                    t.set(adminWalletRef, {
                        balance: firestore_1.FieldValue.increment(platformFee),
                        updatedAt: firestore_1.FieldValue.serverTimestamp(),
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
                        createdAt: firestore_1.FieldValue.serverTimestamp()
                    });
                }
                else {
                    t.update(orderRef, updates);
                }
            });
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Job update failed for ${orderId}`, error);
            throw error.status ? error : new common_1.InternalServerErrorException("Failed to update job");
        }
    }
    async createLogisticsOrder(dto, userId, userName) {
        // Calculate Price Logic (Mock or Distance)
        // Base Price: $3.00
        // Size Multiplier
        let price = 3.00;
        if (dto.size === 'Medium')
            price += 2.00;
        if (dto.size === 'Large')
            price += 5.00;
        if (dto.size === 'Extra Heavy')
            price += 10.00;
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
                price: price,
                createdAt: firestore_1.FieldValue.serverTimestamp(),
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
                orderNumber: `LOG-${Math.floor(1000 + Math.random() * 9000)}`
            };
            await orderRef.set(orderData);
            return { success: true, orderId: orderId, price: price };
        }
        catch (error) {
            this.logger.error("Failed to create logistics order", error);
            throw new common_1.InternalServerErrorException("Order creation failed");
        }
    }
};
LogisticsService = LogisticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], LogisticsService);
exports.LogisticsService = LogisticsService;
//# sourceMappingURL=logistics.service.js.map