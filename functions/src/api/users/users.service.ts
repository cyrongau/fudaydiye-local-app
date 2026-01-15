import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { CreateUserDto, UpdateProfileDto, UserRole, UpdateUserStatusDto } from './dto/users.dto';

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
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Set Custom Claims for RBAC
            await this.auth.setCustomUserClaims(uid, { role: data.role });

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
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
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
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Update Auth Claims
            await this.auth.setCustomUserClaims(uid, { role });

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
            await this.db.collection('users').doc(uid).update({
                ...updateStatusDto,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // If status is SUSPENDED, revoke tokens (security measure)
            if (updateStatusDto.status === 'SUSPENDED' || updateStatusDto.vendorStatus === 'SUSPENDED' || updateStatusDto.isAccountLocked) {
                await this.auth.revokeRefreshTokens(uid);
            }

            this.logger.log(`Updated status for user ${uid}`, updateStatusDto);
            return { success: true };
        } catch (error) {
            this.logger.error(`Failed to update status for ${uid}`, error);
            throw new InternalServerErrorException('Failed to update user status');
        }
    }
}
