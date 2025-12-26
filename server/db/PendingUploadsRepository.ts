/**
 * Pending Uploads Repository
 * اطبعلي - Print Service Uploads Data Access Layer
 */

import { supabase } from './client';

export interface PendingUpload {
    id: string;
    user_id: string;
    file_name: string;
    file_url: string;
    file_size?: number;
    file_type?: string;
    print_options?: any;
    status?: string;
    metadata?: any;
    created_at?: Date;
    updated_at?: Date;
}

export class PendingUploadsRepository {
    async findByUserId(userId: string): Promise<PendingUpload[]> {
        const { data, error } = await supabase
            .from('pending_uploads')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw new Error(`Failed to fetch uploads: ${error.message}`);
        return data || [];
    }

    async findById(id: string): Promise<PendingUpload | null> {
        const { data, error } = await supabase
            .from('pending_uploads')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw new Error(`Failed to fetch upload: ${error.message}`);
        }
        return data;
    }

    async create(upload: Partial<PendingUpload>): Promise<PendingUpload> {
        const { data, error } = await supabase
            .from('pending_uploads')
            .insert(upload)
            .select()
            .single();

        if (error) throw new Error(`Failed to create upload: ${error.message}`);
        return data;
    }

    async update(id: string, updates: Partial<PendingUpload>): Promise<PendingUpload> {
        const { data, error } = await supabase
            .from('pending_uploads')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw new Error(`Failed to update upload: ${error.message}`);
        return data;
    }

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('pending_uploads')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Failed to delete upload: ${error.message}`);
    }

    async deleteByUserId(userId: string): Promise<void> {
        const { error } = await supabase
            .from('pending_uploads')
            .delete()
            .eq('user_id', userId);

        if (error) throw new Error(`Failed to clear uploads: ${error.message}`);
    }
}
