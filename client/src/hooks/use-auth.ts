import { useQuery } from "@tanstack/react-query";
import { User } from '@shared/schema';

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const signIn = async (email: string, password: string) => {
    // Redirect to login for now
    window.location.href = '/api/login';
    return { success: true, data: null };
  };

  const signUp = async (email: string, password: string, userData: any) => {
    // Redirect to login for now
    window.location.href = '/api/login';
    return { success: true, data: null };
  };

  const signOut = async () => {
    window.location.href = '/api/logout';
  };

  const updateProfile = async (updates: Partial<User>) => {
    return { success: false, error: 'Not implemented' };
  };

  return {
    user,
    loading: isLoading,
    error: error?.message || null,
    isAuthenticated: !!user,
    supabaseUser: null,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };
}