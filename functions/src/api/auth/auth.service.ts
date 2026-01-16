
import { Injectable, Logger, BadRequestException, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { RequestOtpDto, VerifyOtpDto, RegisterUserDto } from './dto/auth.dto';
import { CommunicationFactory } from '../../services/CommunicationFactory';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private db: admin.firestore.Firestore;

    constructor() {
        this.db = admin.firestore();
    }

    async requestOtp(requestOtpDto: RequestOtpDto) {
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
        } catch (e) {
            this.logger.error("OTP Storage Failed:", e);
            throw new InternalServerErrorException("Failed to generate OTP secure storage.");
        }

        // 3. Send via Communication Service
        try {
            // Re-using the CommunicationFactory from legacy (ensure it's imported or moved)
            // Assuming CommunicationFactory is available in sibling services directory
            const commService = CommunicationFactory.getService(method === 'email' ? 'EMAIL' : 'SMS');

            let body = `Your Fudaydiye Secure Login Code is: ${code}. Valid for 5 minutes.`;
            if (method === 'email') {
                await commService.send({
                    to: identifier,
                    subject: "Login Verification Code",
                    body
                });
            } else {
                await commService.send({
                    to: identifier,
                    body: `FDDY code: ${code}`
                });
            }

            return { success: true };

        } catch (e: any) {
            this.logger.error("OTP Delivery Failed:", e);
            // Log code for MOCK mode visibility, same as legacy
            this.logger.warn(`[OTP-BACKUP] Identifier: ${identifier}, Code: ${code}`);
            return { success: true, warning: "Delivery delayed, check logs if mock." };
        }
    }

    async verifyOtp(verifyOtpDto: VerifyOtpDto) {
        const { identifier, code } = verifyOtpDto;

        const docRef = this.db.collection("access_codes").doc(identifier);
        const doc = await docRef.get();

        if (!doc.exists) {
            throw new NotFoundException("No OTP request found. Request a new one.");
        }

        const record = doc.data()!;

        // 1. Check Expiry
        if (record.expiresAt.toDate() < new Date()) {
            throw new BadRequestException("Code expired. Request a new one.");
        }

        // 2. Check Attempts
        if (record.attempts >= 3) {
            await docRef.delete(); // Security: Burn it
            throw new BadRequestException("Too many failed attempts. Request a new code.");
        }

        // 3. Validate Code
        if (record.code !== code) {
            await docRef.update({ attempts: admin.firestore.FieldValue.increment(1) });
            throw new ForbiddenException("Invalid code.");
        }

        // 4. Find or Create User (Shadow Profile) logic
        // ... (Mirrored from legacy) ...
        let uid = '';

        const usersRef = this.db.collection("users");
        let query;
        if (record.method === 'email') query = usersRef.where('email', '==', identifier);
        else query = usersRef.where('phoneNumber', '==', identifier);

        const userSnap = await query.limit(1).get();

        if (!userSnap.empty) {
            uid = userSnap.docs[0].id;
        } else {
            try {
                const authUser = record.method === 'email'
                    ? await admin.auth().getUserByEmail(identifier)
                    : await admin.auth().getUserByPhoneNumber(identifier);
                uid = authUser.uid;
            } catch (e: any) {
                if (e.code === 'auth/user-not-found') {
                    throw new NotFoundException("User not registered. Please create a profile first.");
                }
                throw new InternalServerErrorException("Auth lookup failed.");
            }
        }

        // 5. Mint Token
        try {
            const customToken = await admin.auth().createCustomToken(uid);
            await docRef.delete();
            return { token: customToken, uid };
        } catch (e) {
            this.logger.error("Token Minting Failed:", e);
            throw new InternalServerErrorException("Failed to authenticate session.");
        }
    }
    async registerUser(dto: RegisterUserDto) {
        const { email, password, fullName, mobile, anonUid, role = 'CUSTOMER' } = dto;
        let uid = anonUid;

        // Security: Prevent Admin Creation via Public API
        if (role === 'ADMIN' as any || role === 'FUDAYDIYE_ADMIN' as any) {
            throw new ForbiddenException("Administrative accounts cannot be created publicly.");
        }

        try {
            // 1. Create or Update Auth User
            if (uid) {
                // Upgrade Anon
                await admin.auth().updateUser(uid, {
                    email,
                    password,
                    displayName: fullName,
                    emailVerified: false
                });
            } else {
                // Create New
                const user = await admin.auth().createUser({
                    email,
                    password,
                    displayName: fullName,
                    emailVerified: false,
                    disabled: false
                });
                uid = user.uid;
            }

            // 2. Set Custom Claims (Role based)
            await admin.auth().setCustomUserClaims(uid!, { role });

            // 3. Prepare Firestore Profile Data
            const baseProfile = {
                uid,
                email,
                fullName,
                mobile: mobile || '',
                role,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                isVerified: false, // Default to false
                walletBalance: 0,
                trustScore: 60,
                trustTier: 'BRONZE'
            };

            let extraFields = {};
            if (role === 'VENDOR') {
                extraFields = {
                    businessName: dto.businessName || dto.fullName,
                    businessCategory: dto.businessCategory || 'General',
                };
            } else if (role === 'RIDER') {
                extraFields = {
                    vehicleType: dto.vehicleType || 'Motorcycle',
                    plateNumber: dto.plateNumber || 'Pending'
                };
            } else if (role === 'CLIENT') {
                extraFields = {
                    enterpriseName: dto.businessName, // Re-use businessName field from DTO for enterprise
                }
            }

            // 4. Create/Update Document
            await this.db.collection('users').doc(uid!).set({
                ...baseProfile,
                ...extraFields
            }, { merge: true });

            const customToken = await admin.auth().createCustomToken(uid!);

            return {
                success: true,
                uid,
                token: customToken,
                role,
                message: `Account created successfully as ${role}.`
            };

        } catch (e: any) {
            this.logger.error("Registration Failed", e);
            if (e.code === 'auth/email-already-exists') {
                throw new BadRequestException("Email already in use.");
            }
            throw new InternalServerErrorException("Registration failed: " + e.message);
        }
    }
}
