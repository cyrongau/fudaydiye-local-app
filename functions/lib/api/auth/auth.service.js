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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
const CommunicationFactory_1 = require("../../services/CommunicationFactory");
let AuthService = AuthService_1 = class AuthService {
    constructor() {
        this.logger = new common_1.Logger(AuthService_1.name);
        this.db = admin.firestore();
    }
    async requestOtp(requestOtpDto) {
        const { identifier, method } = requestOtpDto;
        // 1. Generate Code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = admin.firestore.Timestamp.fromDate(new Date(Date.now() + 5 * 60 * 1000)); // 5 mins
        // 2. Store in Firestore
        try {
            await this.db.collection("access_codes").doc(identifier).set({
                code,
                expiresAt,
                attempts: 0,
                method
            });
        }
        catch (e) {
            this.logger.error("OTP Storage Failed:", e);
            throw new common_1.InternalServerErrorException("Failed to generate OTP secure storage.");
        }
        // 3. Send via Communication Service
        try {
            // Re-using the CommunicationFactory from legacy (ensure it's imported or moved)
            // Assuming CommunicationFactory is available in sibling services directory
            const commService = CommunicationFactory_1.CommunicationFactory.getService(method === 'email' ? 'EMAIL' : 'SMS');
            let body = `Your Fudaydiye Secure Login Code is: ${code}. Valid for 5 minutes.`;
            if (method === 'email') {
                await commService.send({
                    to: identifier,
                    subject: "Login Verification Code",
                    body
                });
            }
            else {
                await commService.send({
                    to: identifier,
                    body: `FDDY code: ${code}`
                });
            }
            return { success: true };
        }
        catch (e) {
            this.logger.error("OTP Delivery Failed:", e);
            // Log code for MOCK mode visibility, same as legacy
            this.logger.warn(`[OTP-BACKUP] Identifier: ${identifier}, Code: ${code}`);
            return { success: true, warning: "Delivery delayed, check logs if mock." };
        }
    }
    async verifyOtp(verifyOtpDto) {
        const { identifier, code } = verifyOtpDto;
        const docRef = this.db.collection("access_codes").doc(identifier);
        const doc = await docRef.get();
        if (!doc.exists) {
            throw new common_1.NotFoundException("No OTP request found. Request a new one.");
        }
        const record = doc.data();
        // 1. Check Expiry
        if (record.expiresAt.toDate() < new Date()) {
            throw new common_1.BadRequestException("Code expired. Request a new one.");
        }
        // 2. Check Attempts
        if (record.attempts >= 3) {
            await docRef.delete(); // Security: Burn it
            throw new common_1.BadRequestException("Too many failed attempts. Request a new code.");
        }
        // 3. Validate Code
        if (record.code !== code) {
            await docRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
            throw new common_1.ForbiddenException("Invalid code.");
        }
        // 4. Find or Create User (Shadow Profile) logic
        // ... (Mirrored from legacy) ...
        let uid = '';
        const usersRef = this.db.collection("users");
        let query;
        if (record.method === 'email')
            query = usersRef.where('email', '==', identifier);
        else
            query = usersRef.where('phoneNumber', '==', identifier);
        const userSnap = await query.limit(1).get();
        if (!userSnap.empty) {
            uid = userSnap.docs[0].id;
        }
        else {
            try {
                const authUser = record.method === 'email'
                    ? await admin.auth().getUserByEmail(identifier)
                    : await admin.auth().getUserByPhoneNumber(identifier);
                uid = authUser.uid;
            }
            catch (e) {
                if (e.code === 'auth/user-not-found') {
                    throw new common_1.NotFoundException("User not registered. Please create a profile first.");
                }
                throw new common_1.InternalServerErrorException("Auth lookup failed.");
            }
        }
        // 5. Mint Token
        try {
            const customToken = await admin.auth().createCustomToken(uid);
            await docRef.delete();
            return { token: customToken, uid };
        }
        catch (e) {
            this.logger.error("Token Minting Failed:", e);
            throw new common_1.InternalServerErrorException("Failed to authenticate session.");
        }
    }
};
AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AuthService);
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map