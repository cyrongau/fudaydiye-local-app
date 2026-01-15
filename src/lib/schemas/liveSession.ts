import { z } from 'zod';

export const LiveSessionSchema = z.object({
    id: z.string().optional(),
    vendorId: z.string(),
    vendorName: z.string(),
    title: z.string().min(1, "Title is required").max(100, "Title is too long"),
    category: z.string().min(1, "Category is required"),
    status: z.enum(['SCHEDULED', 'LIVE', 'ENDED']),
    featuredProductId: z.string().optional().nullable(),
    featuredProductName: z.string().optional().nullable(),
    featuredProductPrice: z.number().optional().nullable(),
    featuredProductImg: z.string().optional().nullable(),
    streamUrl: z.string().optional(),
    provider: z.enum(['AGORA', 'LIVEKIT']).optional(),
    scheduledAt: z.any().optional(),
    createdAt: z.any().optional(),
    hostId: z.string().optional(),
    hostAvatar: z.string().optional(),
    viewerCount: z.number().optional(),
    productIds: z.array(z.string()).optional(),
    likes: z.number().optional()
});

export const ChatMessageSchema = z.object({
    id: z.string().optional(),
    text: z.string().min(1, "Message cannot be empty").max(500),
    userId: z.string(),
    userName: z.string(),
    createdAt: z.any().optional()
});

export const CreateSessionPayloadSchema = z.object({
    vendorId: z.string(),
    vendorName: z.string(),
    hostAvatar: z.string().optional(),
    title: z.string().min(5),
    category: z.string(),
    mode: z.enum(['LIVE', 'SCHEDULE']),
    featuredProduct: z.any().optional(),
    productIds: z.array(z.string()).optional(),
    scheduledAt: z.any().optional(),
});

export type LiveSession = z.infer<typeof LiveSessionSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type LiveSessionInput = z.infer<typeof LiveSessionSchema>;
