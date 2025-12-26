/**
 * Supabase Database Client
 * اطبعلي - Database Connection
 */

import { createClient } from '@supabase/supabase-js';

// Get credentials from environment
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
}

// Create Supabase client with service role key (for server-side operations)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Test connection
export async function testConnection(): Promise<boolean> {
    try {
        const { error } = await supabase.from('users').select('count').limit(1);
        if (error) {
            console.error('❌ Supabase connection failed:', error.message);
            return false;
        }
        console.log('✅ Supabase connected successfully');
        return true;
    } catch (error) {
        console.error('❌ Supabase connection error:', error);
        return false;
    }
}

// Export types
export type { PostgrestError } from '@supabase/supabase-js';
