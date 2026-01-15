import { z } from 'zod';

export const UserRoleSchema = z.enum(['CUSTOMER', 'VENDOR', 'RIDER', 'CLIENT', 'ADMIN', 'FUDAYDIYE_ADMIN']);

export const UserProfileSchema = z.object({
    uid: z.string(),
    fullName: z.string().min(1, "Full Name is required"),
    role: UserRoleSchema,
    mobile: z.string(), // Could add phone validation regex later
    email: z.string().email(),
    businessName: z.string().optional(),
    businessLogo: z.string().optional(),
    vendorStatus: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED']).optional(),
    avatar: z.string().optional(),
    location: z.string().optional(),
    vehicleType: z.string().optional(),
    plateNumber: z.string().optional(),
    kycStatus: z.enum(['NONE', 'PENDING', 'VERIFIED', 'REJECTED']).optional(),
});

export type UserProfileInput = z.infer<typeof UserProfileSchema>;
