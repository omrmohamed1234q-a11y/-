import { createClient } from '@supabase/supabase-js';

// Environment variables - add defaults for development
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fvahcgubddynggktqklz.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2YWhjZ3ViZGR5bmdna3Rxa2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NzI0MDcsImV4cCI6MjA3MDM0ODQwN30.M08VvM756YpAAUfpX0WLUK3FyQFLD5wgutkHQyWWbpY';

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
    },
});

console.log('✅ Supabase client initialized');
console.log(`📍 Using: ${supabaseUrl}`);
