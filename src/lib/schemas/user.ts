import { z } from 'zod';

export const UserSchema = z.object({
    uid: z.string(),
    email: z.string().email().optional(),
    fullName: z.string().min(1, "Full name is required"),
    mobile: z.string().optional(),
    role: z.enum(['ADMIN', 'VENDOR', 'RIDER', 'CUSTOMER', 'FUDAYDIYE_ADMIN']).default('CUSTOMER'),
    location: z.string().optional(),
    createdAt: z.any().optional(), // Allow Firestore Timestamp or null
    updatedAt: z.any().optional()
});

export type User = z.infer<typeof UserSchema>;
