/**
 * Cart Repository
 * اطبعلي - Cart Data Access Layer
 */

import { supabase } from './client';
import type { CartItem } from '../storage';

export class CartRepository {
    async findByUserId(userId: string): Promise<CartItem[]> {
        const { data, error } = await supabase
            .from('cart_items')
            .select(`
        *,
        product:products (*)
      `)
            .eq('user_id', userId);

        if (error) throw new Error(`Failed to fetch cart: ${error.message}`);
        return data || [];
    }

    async addItem(item: Partial<CartItem>): Promise<CartItem> {
        const { data, error } = await supabase
            .from('cart_items')
            .upsert(item, {
                onConflict: 'user_id,product_id,source'
            })
            .select()
            .single();

        if (error) throw new Error(`Failed to add cart item: ${error.message}`);
        return data;
    }

    async updateQuantity(id: string, quantity: number): Promise<CartItem> {
        const { data, error } = await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to update cart item: ${error.message}`);
        return data;
    }

    async removeItem(id: string): Promise<void> {
        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Failed to remove cart item: ${error.message}`);
    }

    async clearCart(userId: string): Promise<void> {
        const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', userId);

        if (error) throw new Error(`Failed to clear cart: ${error.message}`);
    }
}
