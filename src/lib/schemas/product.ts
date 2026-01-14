import { z } from 'zod';

export const ProductSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Product name is required"),
    price: z.number().positive("Price must be positive"),
    images: z.array(z.string().url()).optional(),
    vendorId: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    stock: z.number().int().nonnegative().optional().default(0),
    isFeatured: z.boolean().optional().default(false),
    createdAt: z.any().optional()
});

export type Product = z.infer<typeof ProductSchema>;
