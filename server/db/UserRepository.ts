/**
 * User Repository
 * اطبعلي - User Data Access Layer
 */

import { supabase } from './client';
import type { User } from '../storage';

export class UserRepository {
    async findAll(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch users: ${error.message}`);
        return data || [];
    }

    async findById(id: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error(`Failed to fetch user: ${error.message}`);
        }
        return data;
    }

    async findByEmail(email: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error(`Failed to fetch user by email: ${error.message}`);
        }
        return data;
    }

    async create(user: Partial<User>): Promise<User> {
        const { data, error } = await supabase
            .from('users')
            .insert(user)
            .select()
            .single();

        if (error) throw new Error(`Failed to create user: ${error.message}`);
        return data;
    }

    async update(id: string, updates: Partial<User>): Promise<User> {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to update user: ${error.message}`);
        return data;
    }

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Failed to delete user: ${error.message}`);
    }
}
