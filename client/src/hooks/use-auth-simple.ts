import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface SimpleUser {
  id: string;
  email: string;
  fullName: string;
  bountyPoints: number;
  level: number;
}

interface AuthState {
  user: SimpleUser | null;
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
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user) {
          // Create simple user profile from session data
          const simpleUser: SimpleUser = {
            id: session.user.id,
            email: session.user.email!,
            fullName: session.user.user_metadata?.full_name || 'مستخدم عزيز',
            bountyPoints: 0,
            level: 1,
          };

          setState({
            user: simpleUser,
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
        setState({
          user: null,
          supabaseUser: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Authentication error',
        });
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const simpleUser: SimpleUser = {
            id: session.user.id,
            email: session.user.email!,
            fullName: session.user.user_metadata?.full_name || 'مستخدم عزيز',
            bountyPoints: 0,
            level: 1,
          };

          setState({
            user: simpleUser,
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
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return {
    ...state,
    signOut,
  };
}