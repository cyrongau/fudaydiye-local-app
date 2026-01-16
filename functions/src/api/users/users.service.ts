import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { CreateUserDto, UpdateProfileDto, UserRole, UpdateUserStatusDto } from './dto/users.dto';
import { CommunicationFactory } from '../../services/CommunicationFactory';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    private db = admin.firestore();
    private auth = admin.auth();

    async create(createUserDto: CreateUserDto) {
        const { uid, ...data } = createUserDto;
        try {
            await this.db.collection('users').doc(uid).set({
                ...data,
                uid,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            });

            // Set Custom Claims for RBAC
            await this.auth.setCustomUserClaims(uid, { role: data.role });

            // Notify User
            this.notifyUser(uid, `Welcome to Fudaydiye! Your account has been created as ${data.role}.`);

            this.logger.log(`Created user profile for ${uid} as ${data.role}`);
            return { uid, ...data };
        } catch (error) {
            this.logger.error(`Failed to create user ${uid}`, error);
            throw new InternalServerErrorException('Failed to create user profile');
        }
    }

    async findOne(uid: string) {
        const doc = await this.db.collection('users').doc(uid).get();
        if (!doc.exists) {
            throw new NotFoundException(`User ${uid} not found`);
        }
        return doc.data();
    }

    async update(uid: string, updateProfileDto: UpdateProfileDto) {
        try {
            await this.db.collection('users').doc(uid).update({
                ...updateProfileDto,
                updatedAt: FieldValue.serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            this.logger.error(`Failed to update user ${uid}`, error);
            throw new InternalServerErrorException('Failed to update user profile');
        }
    }

    async setRole(uid: string, role: UserRole) {
        try {
            // Update Firestore
            await this.db.collection('users').doc(uid).update({
                role,
                updatedAt: FieldValue.serverTimestamp()
            });

            // Update Auth Claims
            await this.auth.setCustomUserClaims(uid, { role });

            // Notify User of Upgrade/Role Change
            await this.notifyUser(uid, `Your account role has been updated to ${role}. You now have access to new features.`);

            this.logger.log(`Updated role for ${uid} to ${role}`);
            return { success: true };
        } catch (error) {
            this.logger.error(`Failed to set role for ${uid}`, error);
            throw new InternalServerErrorException('Failed to update user role');
        }
    }

    async findAll(role?: UserRole) {
        try {
            let query: admin.firestore.Query = this.db.collection('users');
            if (role) {
                query = query.where('role', '==', role);
            }
            const snap = await query.get();
            return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            this.logger.error('Failed to fetch users', error);
            throw new InternalServerErrorException('Failed to fetch users');
        }
    }

    async updateStatus(uid: string, updateStatusDto: UpdateUserStatusDto) {
        try {
            // Fix: Use FieldValue explicitly to avoid "undefined" crash
            const updatePayload: any = { ...updateStatusDto };
            updatePayload.updatedAt = FieldValue.serverTimestamp();

            await this.db.collection('users').doc(uid).update(updatePayload);

            // Access Control & Notifications
            let msg = '';
            const status = updateStatusDto.status || updateStatusDto.vendorStatus;

            if (status === 'SUSPENDED') {
                msg = 'Your account has been SUSPENDED. Please contact support.';
                try {
                    await this.auth.revokeRefreshTokens(uid);
                    await this.auth.updateUser(uid, { disabled: true }); // Disable Auth Login
                } catch (e) {
                    this.logger.warn(`Could not revoke tokens/disable for ${uid}: ${e}`);
                }
            } else if (status === 'ACTIVE' || status === 'VERIFIED') {
                msg = 'Your account access has been RESTORED/VERIFIED.';
                try {
                    await this.auth.updateUser(uid, { disabled: false }); // Enable Auth Login
                } catch (e) { console.warn(e); }
            }

            if (msg) await this.notifyUser(uid, msg);

            this.logger.log(`Updated status for user ${uid}`, updateStatusDto);
            return { success: true };
        } catch (error) {
            this.logger.error(`Failed to update status for ${uid}`, error);
            throw new InternalServerErrorException('Failed to update user status');
        }
    }

    async deleteUser(uid: string) {
        try {
            await this.notifyUser(uid, "Your account has been permanently deleted from Fudaydiye.");

            // 1. Delete from Auth (if exists)
            try {
                await this.auth.deleteUser(uid);
            } catch (e: any) {
                if (e.code === 'auth/user-not-found') {
                    this.logger.warn(`Auth user ${uid} already deleted or does not exist.`);
                } else {
                    throw e;
                }
            }

            // 2. Delete from Firestore
            await this.db.collection('users').doc(uid).delete();

            this.logger.log(`Permanently deleted user ${uid}`);
            return { success: true };
        } catch (error) {
            this.logger.error(`Failed to delete user ${uid}`, error);
            throw new InternalServerErrorException('Failed to delete user');
        }
    }

    async resetPassword(uid: string) {
        try {
            const userDoc = await this.db.collection('users').doc(uid).get();
            const user = userDoc.data();
            if (!user || !user.email) {
                throw new NotFoundException('User email not found for password reset');
            }

            // Generate Password Reset Link
            const link = await this.auth.generatePasswordResetLink(user.email);
            return { success: true, link };
        } catch (error) {
            this.logger.error(`Failed to generate reset link for ${uid}`, error);
            throw new InternalServerErrorException('Failed to reset password');
        }
    }

    private async notifyUser(uid: string, message: string) {
        try {
            const userDoc = await this.db.collection('users').doc(uid).get();
            const userData = userDoc.data();
            if (!userData) return;

            // Email
            if (userData.email) {
                try {
                    const emailService = CommunicationFactory.getService('EMAIL');
                    await emailService.send({
                        to: userData.email,
                        subject: 'Fudaydiye Account Update',
                        body: message
                    });
                } catch (e) { console.error("Email failed", e); }
            }

            // SMS (if phone exists)
            if (userData.phoneNumber || userData.phone) {
                try {
                    const smsService = CommunicationFactory.getService('SMS');
                    await smsService.send({
                        to: userData.phoneNumber || userData.phone,
                        body: message
                    });
                } catch (e) { console.error("SMS failed", e); }
            }
        } catch (e) {
            this.logger.error('Failed to notify user', e);
        }
    }
    async uploadKyc(uid: string, documentData: any) {
        try {
            // Ensure timestamp is server-side
            const doc = { ...documentData, uploadedAt: FieldValue.serverTimestamp() };

            await this.db.collection('users').doc(uid).update({
                kycDocuments: FieldValue.arrayUnion(doc),
                kycStatus: 'PENDING',
                updatedAt: FieldValue.serverTimestamp()
            });

            this.logger.log(`Uploaded KYC doc for ${uid}`);
            return { success: true };
        } catch (error) {
            this.logger.error(`Failed to upload KYC for ${uid}`, error);
            throw new InternalServerErrorException('Failed to upload KYC');
        }
    }
}
