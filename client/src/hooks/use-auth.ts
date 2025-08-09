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
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user) {
          // Fetch user profile from our database
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
          }

          setState({
            user: profile as User,
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
          // Fetch user profile
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Profile fetch error:', profileError);
          }

          setState({
            user: profile as User,
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

  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      setState(prev => ({ ...prev, loading: false, error: message }));
      return { success: false, error: message };
    }
  };

  const signUp = async (email: string, password: string, userData: {
    username: string;
    fullName: string;
    phone?: string;
  }) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: userData.username,
            full_name: userData.fullName,
            phone: userData.phone,
          }
        }
      });

      if (error) throw error;

      // Insert user profile
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert([{
            id: data.user.id,
            email: data.user.email!,
            username: userData.username,
            full_name: userData.fullName,
            phone: userData.phone,
          }]);

        if (profileError) throw profileError;
      }

      return { success: true, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed';
      setState(prev => ({ ...prev, loading: false, error: message }));
      return { success: false, error: message };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    try {
      if (!state.user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', state.user.id)
        .select()
        .single();

      if (error) throw error;

      setState(prev => ({
        ...prev,
        user: data as User,
      }));

      return { success: true, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profile update failed';
      return { success: false, error: message };
    }
  };

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };
}
