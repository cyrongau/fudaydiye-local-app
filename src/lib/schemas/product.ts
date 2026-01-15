import { z } from 'zod';

export const ProductAttributeSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Attribute name is required"),
    values: z.array(z.string()),
});

export const ProductVariationSchema = z.object({
    id: z.string(),
    attributeValues: z.record(z.string()),
    name: z.string().min(1, "Variation name is required"),
    price: z.number().min(0),
    salePrice: z.number().min(0).optional(),
    stock: z.number().int().min(0),
    image: z.string().optional(),
    sku: z.string().optional(),
});

export const ProductSchema = z.object({
    name: z.string().min(3, "Product name must be at least 3 characters"),
    productType: z.enum(['SIMPLE', 'VARIABLE', 'EXTERNAL']),
    basePrice: z.number().min(0, "Price cannot be negative"),
    salePrice: z.number().min(0).optional(),
    tags: z.array(z.string()).optional(),
    category: z.string().min(1, "Category is required"),
    images: z.array(z.string()).min(1, "At least one image is required"),
    vendorId: z.string().min(1, "Vendor ID is required"),
    vendor: z.string().optional(), // Denormalized name
    baseStock: z.number().int().min(0),
    shortDescription: z.string().optional(),
    description: z.string().optional(),
    status: z.enum(['ACTIVE', 'HIDDEN']),
    hasVariations: z.boolean(),
    attributes: z.array(ProductAttributeSchema).optional(),
    variations: z.array(ProductVariationSchema).optional(),
    isExternal: z.boolean().optional(),
    externalUrl: z.string().url().optional().or(z.literal('')),
    // Dropshipping & Extra fields
    isDropship: z.boolean().optional(),
    weightKg: z.number().optional(),
});

export type ProductInput = z.infer<typeof ProductSchema>;
