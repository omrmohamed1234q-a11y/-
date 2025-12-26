/**
 * Product Repository
 * اطبعلي - Product Data Access Layer
 */

import { supabase } from './client';
import type { Product } from '../storage';

export class ProductRepository {
    /**
     * Get all products
     */
    async findAll(): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching products:', error);
            throw new Error(`Failed to fetch products: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Get product by ID
     */
    async findById(id: string): Promise<Product | null> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // Not found
                return null;
            }
            console.error('Error fetching product:', error);
            throw new Error(`Failed to fetch product: ${error.message}`);
        }

        return data;
    }

    /**
     * Get active products only
     */
    async findActive(): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching active products:', error);
            throw new Error(`Failed to fetch active products: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Get products by category
     */
    async findByCategory(category: string): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('category', category)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching products by category:', error);
            throw new Error(`Failed to fetch products by category: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Search products by name
     */
    async search(query: string): Promise<Product[]> {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error searching products:', error);
            throw new Error(`Failed to search products: ${error.message}`);
        }

        return data || [];
    }

    /**
     * Create new product
     */
    async create(product: Partial<Product>): Promise<Product> {
        const { data, error } = await supabase
            .from('products')
            .insert(product)
            .select()
            .single();

        if (error) {
            console.error('Error creating product:', error);
            throw new Error(`Failed to create product: ${error.message}`);
        }

        return data;
    }

    /**
     * Update product
     */
    async update(id: string, updates: Partial<Product>): Promise<Product> {
        const { data, error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating product:', error);
            throw new Error(`Failed to update product: ${error.message}`);
        }

        return data;
    }

    /**
     * Delete product
     */
    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting product:', error);
            throw new Error(`Failed to delete product: ${error.message}`);
        }
    }

    /**
     * Update product stock
     */
    async updateStock(id: string, quantity: number): Promise<Product> {
        const { data, error } = await supabase
            .from('products')
            .update({ stock: quantity })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating product stock:', error);
            throw new Error(`Failed to update product stock: ${error.message}`);
        }

        return data;
    }

    /**
     * Decrease product stock (for orders)
     */
    async decreaseStock(id: string, quantity: number): Promise<Product> {
        // Use SQL to ensure atomic operation
        const { data, error } = await supabase.rpc('decrease_product_stock', {
            product_id: id,
            decrease_by: quantity
        });

        if (error) {
            console.error('Error decreasing product stock:', error);
            throw new Error(`Failed to decrease product stock: ${error.message}`);
        }

        return data;
    }
}
