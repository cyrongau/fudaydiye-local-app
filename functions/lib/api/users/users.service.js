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
let UsersService = UsersService_1 = class UsersService {
    constructor() {
        this.logger = new common_1.Logger(UsersService_1.name);
        this.db = admin.firestore();
        this.auth = admin.auth();
    }
    async create(createUserDto) {
        const { uid } = createUserDto, data = __rest(createUserDto, ["uid"]);
        try {
            await this.db.collection('users').doc(uid).set(Object.assign(Object.assign({}, data), { uid, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
            // Set Custom Claims for RBAC
            await this.auth.setCustomUserClaims(uid, { role: data.role });
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
            await this.db.collection('users').doc(uid).update(Object.assign(Object.assign({}, updateProfileDto), { updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
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
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Update Auth Claims
            await this.auth.setCustomUserClaims(uid, { role });
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
            await this.db.collection('users').doc(uid).update(Object.assign(Object.assign({}, updateStatusDto), { updatedAt: admin.firestore.FieldValue.serverTimestamp() }));
            // If status is SUSPENDED, revoke tokens (security measure)
            if (updateStatusDto.status === 'SUSPENDED' || updateStatusDto.vendorStatus === 'SUSPENDED' || updateStatusDto.isAccountLocked) {
                await this.auth.revokeRefreshTokens(uid);
            }
            this.logger.log(`Updated status for user ${uid}`, updateStatusDto);
            return { success: true };
        }
        catch (error) {
            this.logger.error(`Failed to update status for ${uid}`, error);
            throw new common_1.InternalServerErrorException('Failed to update user status');
        }
    }
};
UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)()
], UsersService);
exports.UsersService = UsersService;
//# sourceMappingURL=users.service.js.map