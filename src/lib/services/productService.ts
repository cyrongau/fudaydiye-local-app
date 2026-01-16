import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Product, CategoryNode } from '../../../types';
import { api } from '../../services/api';
import { ProductSchema } from '../schemas/product';

export class ProductService {

    /**
     * Subscribe to products for a specific vendor (Real-time via Firestore)
     */
    static subscribeToVendorProducts(vendorId: string, onUpdate: (products: Product[]) => void): () => void {
        const q = query(collection(db, "products"), where("vendorId", "==", vendorId));
        return onSnapshot(q, (snapshot) => {
            const products = snapshot.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    ...data,
                    productType: data.productType || 'SIMPLE',
                    category: data.category || 'Uncategorized'
                } as Product;
            });
            // Client-side sort fallback
            products.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            onUpdate(products);
        }, (error) => {
            console.error("Error fetching products:", error);
        });
    }

    /**
     * Subscribe to all categories
     */
    static subscribeToCategories(onUpdate: (categories: CategoryNode[]) => void): () => void {
        const q = query(collection(db, "categories"), orderBy("name", "asc"));
        return onSnapshot(q, (snapshot) => {
            const categories = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CategoryNode));
            onUpdate(categories);
        }, (error) => {
            console.error("Error fetching categories:", error);
        });
    }

    /**
     * Create or Update a product via NestJS API
     */
    static async upsertProduct(productData: Partial<Product>, productId?: string | null): Promise<string> {
        if (!productData.vendorId) {
            throw new Error("Missing vendorId");
        }

        // Client-side validation using Zod
        // Note: We validate against Partial because UI might send incomplete updates, 
        // but for Creation we ideally want full schema. 
        // DTO on backend will enforce strictness.
        const parseResult = ProductSchema.partial().safeParse(productData);
        if (!parseResult.success) {
            console.error("Product Validation Failed", parseResult.error);
            throw new Error(`Invalid product data: ${parseResult.error.issues.map(i => i.message).join(', ')}`);
        }

        const payload = {
            ...parseResult.data,
            basePrice: Number(productData.basePrice),
            salePrice: Number(productData.salePrice) || 0,
            baseStock: Number(productData.baseStock),
            // Ensure enums match DTO
            productType: productData.productType || 'SIMPLE',
            status: productData.status || 'ACTIVE'
        };

        try {
            if (productId && productId !== 'new') {
                // Update
                await api.patch(`/products/${productId}`, payload);
                return productId;
            } else {
                // Create
                const res = await api.post('/products', payload);
                return res.data.id;
            }
        } catch (error: any) {
            console.error("Product sync failed:", error);
            throw new Error(error.response?.data?.message || "Failed to save product");
        }
    }

    /**
     * Delete a product via NestJS API
     */
    static async deleteProduct(productId: string): Promise<void> {
        if (!productId) return;
        try {
            await api.delete(`/products/${productId}`);
        } catch (error: any) {
            console.error("Delete failed:", error);
            throw new Error(error.response?.data?.message || "Failed to delete product");
        }
    }
}
