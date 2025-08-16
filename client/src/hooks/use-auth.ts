import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { User } from '@shared/schema';

interface AuthState {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    supabaseUser: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getSession = async () => {
      try {
        // First check localStorage for stored user (for admin login)
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken && mounted) {
          const user = JSON.parse(storedUser);
          setState({
            user: user,
            supabaseUser: null,
            loading: false,
            error: null,
          });
          return;
        }

        // Fall back to Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session?.user) {
          // Create a basic user object from session data
          const basicUser: User = {
            id: session.user.id,
            username: session.user.email?.split('@')[0] || 'user',
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || 'مستخدم عزيز',
            phone: null,
            role: 'customer',
            bountyPoints: 0,
            level: 1,
            totalPrints: 0,
            totalPurchases: 0,
            totalReferrals: 0,
            isTeacher: false,
            teacherSubscription: false,
            createdAt: new Date()
          };

          setState({
            user: basicUser,
            supabaseUser: session.user,
            loading: false,
            error: null,
          });
        } else {
          setState({
            user: null,
            supabaseUser: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        if (mounted) {
          console.error('Auth error:', error);
          setState({
            user: null,
            supabaseUser: null,
            loading: false,
            error: null,
          });
        }
      }
    };

    // Set loading timeout as fallback
    const timeoutId = setTimeout(() => {
      if (mounted) {
        setState(prev => ({ ...prev, loading: false }));
      }
    }, 2000);

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          const basicUser: User = {
            id: session.user.id,
            username: session.user.email?.split('@')[0] || 'user',
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || 'مستخدم عزيز',
            phone: null,
            role: 'customer',
            bountyPoints: 0,
            level: 1,
            totalPrints: 0,
            totalPurchases: 0,
            totalReferrals: 0,
            isTeacher: false,
            teacherSubscription: false,
            createdAt: new Date()
          };

          setState({
            user: basicUser,
            supabaseUser: session.user,
            loading: false,
            error: null,
          });
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            supabaseUser: null,
            loading: false,
            error: null,
          });
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ في تسجيل الدخول';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { data: null, error: errorMessage };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
          }
        }
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ في إنشاء الحساب';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return { data: null, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Clear localStorage for admin users
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setState({
        user: null,
        supabaseUser: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Sign out error:', error);
      setState(prev => ({ ...prev, loading: false, error: 'خطأ في تسجيل الخروج' }));
    }
  };

  return {
    user: state.user,
    supabaseUser: state.supabaseUser,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    signIn,
    signUp,
    signOut,
  };
}