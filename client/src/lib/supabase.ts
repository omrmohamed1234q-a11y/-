import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fvahcgubddynggktqklz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2YWhjZ3ViZGR5bmdna3Rxa2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NzI0MDcsImV4cCI6MjA3MDM0ODQwN30.M08VvM756YpAAUfpX0WLUK3FyQFLD5wgutkHQyWWbpY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string;
          full_name: string;
          phone: string | null;
          bounty_points: number;
          level: number;
          total_prints: number;
          total_purchases: number;
          total_referrals: number;
          is_teacher: boolean;
          teacher_subscription: boolean;
          created_at: string;
        };
        Insert: {
          username: string;
          email: string;
          full_name: string;
          phone?: string;
          bounty_points?: number;
          level?: number;
          total_prints?: number;
          total_purchases?: number;
          total_referrals?: number;
          is_teacher?: boolean;
          teacher_subscription?: boolean;
        };
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      products: {
        Row: {
          id: string;
          name: string;
          name_en: string | null;
          description: string;
          description_en: string | null;
          category: string;
          price: string;
          original_price: string | null;
          image_url: string | null;
          is_digital: boolean;
          download_url: string | null;
          grade: string | null;
          subject: string | null;
          publisher: string | null;
          curriculum: string | null;
          stock: number;
          rating: string;
          rating_count: number;
          tags: string[] | null;
          featured: boolean;
          created_at: string;
        };
        Insert: {
          name: string;
          name_en?: string;
          description: string;
          description_en?: string;
          category: string;
          price: string;
          original_price?: string;
          image_url?: string;
          is_digital?: boolean;
          download_url?: string;
          grade?: string;
          subject?: string;
          publisher?: string;
          curriculum?: string;
          stock?: number;
          rating?: string;
          rating_count?: number;
          tags?: string[];
          featured?: boolean;
        };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      print_jobs: {
        Row: {
          id: string;
          user_id: string;
          filename: string;
          file_url: string;
          pages: number;
          copies: number;
          color_mode: string;
          paper_size: string;
          double_sided: boolean;
          status: string;
          progress: number;
          queue_position: number | null;
          cost: string | null;
          points_earned: number;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          user_id: string;
          filename: string;
          file_url: string;
          pages: number;
          copies?: number;
          color_mode: string;
          paper_size?: string;
          double_sided?: boolean;
          status: string;
          progress?: number;
          queue_position?: number;
          cost?: string;
          points_earned?: number;
        };
        Update: Partial<Database['public']['Tables']['print_jobs']['Insert']>;
      };
    };
  };
};
