"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
const CommunicationFactory_1 = require("../../services/CommunicationFactory");
let UsersService = UsersService_1 = class UsersService {
    constructor() {
        this.logger = new common_1.Logger(UsersService_1.name);
        this.db = admin.firestore();
        this.auth = admin.auth();
    }
    async create(createUserDto) {
        const { uid } = createUserDto, data = __rest(createUserDto, ["uid"]);
        try {
            await this.db.collection('users').doc(uid).set(Object.assign(Object.assign({}, data), { uid, createdAt: firestore_1.FieldValue.serverTimestamp(), updatedAt: firestore_1.FieldValue.serverTimestamp() }));
            // Set Custom Claims for RBAC
            await this.auth.setCustomUserClaims(uid, { role: data.role });
            // Notify User
            this.notifyUser(uid, `Welcome to Fudaydiye! Your account has been created as ${data.role}.`);
            this.logger.log(`Created user profile for ${uid} as ${data.role}`);
            return Object.assign({ uid }, data);
        }
        catch (error) {
            this.logger.error(`Failed to create user ${uid}`, error);
            throw new common_1.InternalServerErrorException('Failed to create user profile');
        }
    }
    async findOne(uid) {
        const doc = await this.db.collection('users').doc(uid).get();
        if (!doc.exists) {
            throw new common_1.NotFoundException(`User ${uid} not found`);
        }
        return doc.data();
    }
    async update(uid, updateProfileDto) {
        try {
            await this.db.collection('users').doc(uid).update(Object.assign(Object.assign({}, updateProfileDto), { updatedAt: firestore_1.FieldValue.serverTimestamp() }));
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Failed to update user ${uid}`, error);
            throw new common_1.InternalServerErrorException('Failed to update user profile');
        }
    }
    async setRole(uid, role) {
        try {
            // Update Firestore
            await this.db.collection('users').doc(uid).update({
                role,
                updatedAt: firestore_1.FieldValue.serverTimestamp()
            });
            // Update Auth Claims
            await this.auth.setCustomUserClaims(uid, { role });
            // Notify User of Upgrade/Role Change
            await this.notifyUser(uid, `Your account role has been updated to ${role}. You now have access to new features.`);
            this.logger.log(`Updated role for ${uid} to ${role}`);
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Failed to set role for ${uid}`, error);
            throw new common_1.InternalServerErrorException('Failed to update user role');
        }
    }
    async findAll(role) {
        try {
            let query = this.db.collection('users');
            if (role) {
                query = query.where('role', '==', role);
            }
            const snap = await query.get();
            return snap.docs.map(doc => (Object.assign({ id: doc.id }, doc.data())));
        }
        catch (error) {
            this.logger.error('Failed to fetch users', error);
            throw new common_1.InternalServerErrorException('Failed to fetch users');
        }
    }
    async updateStatus(uid, updateStatusDto) {
        try {
            // Fix: Use FieldValue explicitly to avoid "undefined" crash
            const updatePayload = Object.assign({}, updateStatusDto);
            updatePayload.updatedAt = firestore_1.FieldValue.serverTimestamp();
            await this.db.collection('users').doc(uid).update(updatePayload);
            // Access Control & Notifications
            let msg = '';
            const status = updateStatusDto.status || updateStatusDto.vendorStatus;
            if (status === 'SUSPENDED') {
                msg = 'Your account has been SUSPENDED. Please contact support.';
                try {
                    await this.auth.revokeRefreshTokens(uid);
                    await this.auth.updateUser(uid, { disabled: true }); // Disable Auth Login
                }
                catch (e) {
                    this.logger.warn(`Could not revoke tokens/disable for ${uid}: ${e}`);
                }
            }
            else if (status === 'ACTIVE' || status === 'VERIFIED') {
                msg = 'Your account access has been RESTORED/VERIFIED.';
                try {
                    await this.auth.updateUser(uid, { disabled: false }); // Enable Auth Login
                }
                catch (e) {
                    console.warn(e);
                }
            }
            if (msg)
                await this.notifyUser(uid, msg);
            this.logger.log(`Updated status for user ${uid}`, updateStatusDto);
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Failed to update status for ${uid}`, error);
            throw new common_1.InternalServerErrorException('Failed to update user status');
        }
    }
    async deleteUser(uid) {
        try {
            await this.notifyUser(uid, "Your account has been permanently deleted from Fudaydiye.");
            // 1. Delete from Auth (if exists)
            try {
                await this.auth.deleteUser(uid);
            }
            catch (e) {
                if (e.code === 'auth/user-not-found') {
                    this.logger.warn(`Auth user ${uid} already deleted or does not exist.`);
                }
                else {
                    throw e;
                }
            }
            // 2. Delete from Firestore
            await this.db.collection('users').doc(uid).delete();
            this.logger.log(`Permanently deleted user ${uid}`);
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Failed to delete user ${uid}`, error);
            throw new common_1.InternalServerErrorException('Failed to delete user');
        }
    }
    async resetPassword(uid) {
        try {
            const userDoc = await this.db.collection('users').doc(uid).get();
            const user = userDoc.data();
            if (!user || !user.email) {
                throw new common_1.NotFoundException('User email not found for password reset');
            }
            // Generate Password Reset Link
            const link = await this.auth.generatePasswordResetLink(user.email);
            return { success: true, link };
        }
        catch (error) {
            this.logger.error(`Failed to generate reset link for ${uid}`, error);
            throw new common_1.InternalServerErrorException('Failed to reset password');
        }
    }
    async notifyUser(uid, message) {
        try {
            const userDoc = await this.db.collection('users').doc(uid).get();
            const userData = userDoc.data();
            if (!userData)
                return;
            // Email
            if (userData.email) {
                try {
                    const emailService = CommunicationFactory_1.CommunicationFactory.getService('EMAIL');
                    await emailService.send({
                        to: userData.email,
                        subject: 'Fudaydiye Account Update',
                        body: message
                    });
                }
                catch (e) {
                    console.error("Email failed", e);
                }
            }
            // SMS (if phone exists)
            if (userData.phoneNumber || userData.phone) {
                try {
                    const smsService = CommunicationFactory_1.CommunicationFactory.getService('SMS');
                    await smsService.send({
                        to: userData.phoneNumber || userData.phone,
                        body: message
                    });
                }
                catch (e) {
                    console.error("SMS failed", e);
                }
            }
        }
        catch (e) {
            this.logger.error('Failed to notify user', e);
        }
    }
    async uploadKyc(uid, documentData) {
        try {
            // Ensure timestamp is server-side
            const doc = Object.assign(Object.assign({}, documentData), { uploadedAt: firestore_1.FieldValue.serverTimestamp() });
            await this.db.collection('users').doc(uid).update({
                kycDocuments: firestore_1.FieldValue.arrayUnion(doc),
                kycStatus: 'PENDING',
                updatedAt: firestore_1.FieldValue.serverTimestamp()
            });
            this.logger.log(`Uploaded KYC doc for ${uid}`);
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Failed to upload KYC for ${uid}`, error);
            throw new common_1.InternalServerErrorException('Failed to upload KYC');
        }
    }
};
UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)()
], UsersService);
exports.UsersService = UsersService;
//# sourceMappingURL=users.service.js.map