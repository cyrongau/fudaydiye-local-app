import { z } from 'zod';

export const LiveSessionSchema = z.object({
    id: z.string().optional(),
    vendorId: z.string(),
    vendorName: z.string(),
    hostAvatar: z.string().optional(),
    title: z.string().min(1, "Title is required"),
    category: z.string().min(1, "Category is required"),
    status: z.enum(['SCHEDULED', 'LIVE', 'ENDED']),
    viewerCount: z.number().int().nonnegative().default(0),

    // Featured Product State
    featuredProductId: z.string().nullable().optional(),
    featuredProductName: z.string().nullable().optional(),
    featuredProductPrice: z.number().nullable().optional(),
    featuredProductImg: z.string().nullable().optional(),

    streamUrl: z.string().optional(),
    scheduledAt: z.any().optional(),
    startedAt: z.any().optional(),
    endedAt: z.any().optional(),
    createdAt: z.any().optional(),

    likes: z.number().int().default(0)
});

export const CreateSessionPayloadSchema = z.object({
    vendorId: z.string(),
    vendorName: z.string(),
    hostAvatar: z.string().optional(),
    title: z.string().min(1, "Title is required"),
    category: z.string().min(1, "Category is required"),
    mode: z.enum(['LIVE', 'SCHEDULE']),
    featuredProduct: z.any().optional(), // Looser validation here as it comes from UI object
    scheduledAt: z.any().optional()
});

export const ChatMessageSchema = z.object({
    text: z.string().min(1, "Message cannot be empty"),
    userId: z.string(),
    userName: z.string(),
    createdAt: z.any().optional()
});

export type LiveSession = z.infer<typeof LiveSessionSchema>;
export type CreateSessionPayload = z.infer<typeof CreateSessionPayloadSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
