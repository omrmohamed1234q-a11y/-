/**
 * Order Repository
 * اطبعلي - Order Data Access Layer
 */

import { supabase } from './client';
import type { Order } from '../storage';

export class OrderRepository {
    async findAll(): Promise<Order[]> {
        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        order_items (*)
      `)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch orders: ${error.message}`);
        return data || [];
    }

    async findById(id: string): Promise<Order | null> {
        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        order_items (*)
      `)
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error(`Failed to fetch order: ${error.message}`);
        }
        return data;
    }

    async findByUserId(userId: string): Promise<Order[]> {
        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        order_items (*)
      `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch user orders: ${error.message}`);
        return data || [];
    }

    async findByStatus(status: string): Promise<Order[]> {
        const { data, error } = await supabase
            .from('orders')
            .select(`
        *,
        order_items (*)
      `)
            .eq('status', status)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch orders by status: ${error.message}`);
        return data || [];
    }

    async create(order: Partial<Order>, items: any[]): Promise<Order> {
        // Use transaction to create order and items together
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert(order)
            .select()
            .single();

        if (orderError) throw new Error(`Failed to create order: ${orderError.message}`);

        // Create order items
        const orderItems = items.map(item => ({
            ...item,
            order_id: orderData.id
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            // Rollback: delete the order
            await supabase.from('orders').delete().eq('id', orderData.id);
            throw new Error(`Failed to create order items: ${itemsError.message}`);
        }

        // Return order with items
        return this.findById(orderData.id) as Promise<Order>;
    }

    async update(id: string, updates: Partial<Order>): Promise<Order> {
        const { data, error } = await supabase
            .from('orders')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to update order: ${error.message}`);
        return data;
    }

    async updateStatus(id: string, status: string): Promise<Order> {
        return this.update(id, { status });
    }

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('orders')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Failed to delete order: ${error.message}`);
    }
}
