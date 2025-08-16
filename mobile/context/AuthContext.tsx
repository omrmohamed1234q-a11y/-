import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  provider: 'supabase' | 'replit' | 'google' | 'facebook';
  isPremium?: boolean;
  points?: number;
  level?: number;
}

interface AuthSession {
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt?: number;
  rememberMe?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (user: User, token: string, rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SESSION: 'auth_session',
  REMEMBER_ME: 'remember_me',
  USER_PREFERENCES: 'user_preferences',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Check for existing session
      const sessionJson = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
      const rememberMe = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
      
      if (sessionJson) {
        const storedSession: AuthSession = JSON.parse(sessionJson);
        
        // Check if session is expired
        if (storedSession.expiresAt && Date.now() > storedSession.expiresAt) {
          if (storedSession.refreshToken) {
            await refreshTokens(storedSession);
          } else {
            await clearSession();
          }
        } else {
          // Only restore session if remember me was enabled or session is recent
          const shouldRestoreSession = rememberMe === 'true' || 
            !storedSession.expiresAt || 
            (Date.now() - (storedSession.expiresAt - 86400000)) < 3600000; // Within 1 hour of creation
          
          if (shouldRestoreSession) {
            setSession(storedSession);
            
            // Validate session with backend
            await validateSession(storedSession.token);
          } else {
            await clearSession();
          }
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      await clearSession();
    } finally {
      setLoading(false);
    }
  };

  const validateSession = async (token: string) => {
    try {
      // For Replit Auth, check the session endpoint
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Session validation failed');
      }

      const userData = await response.json();
      
      // Update user data if it changed
      if (session && userData) {
        const updatedSession = {
          ...session,
          user: { ...session.user, ...userData },
        };
        setSession(updatedSession);
        await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updatedSession));
      }
    } catch (error) {
      console.error('Session validation error:', error);
      // Don't clear session immediately, allow offline usage
      // but mark for re-validation when online
    }
  };

  const refreshTokens = async (currentSession: AuthSession) => {
    try {
      if (!currentSession.refreshToken) {
        throw new Error('No refresh token available');
      }

      // This would typically call a refresh token endpoint
      // For now, we'll extend the current session
      const newExpiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
      const refreshedSession = {
        ...currentSession,
        expiresAt: newExpiresAt,
      };

      setSession(refreshedSession);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(refreshedSession));
      
      return refreshedSession;
    } catch (error) {
      console.error('Token refresh error:', error);
      await clearSession();
      throw error;
    }
  };

  const signIn = async (user: User, token: string, rememberMe: boolean = false) => {
    try {
      setLoading(true);
      
      const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
      const newSession: AuthSession = {
        user: {
          ...user,
          points: user.points || 0,
          level: user.level || 1,
        },
        token,
        expiresAt,
        rememberMe,
      };

      // Store session
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(newSession));
      await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, rememberMe.toString());
      
      // Store user preferences
      const preferences = {
        provider: user.provider,
        language: 'ar',
        theme: 'light',
        notifications: true,
      };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));

      setSession(newSession);
      
      // Track sign-in event
      console.log('User signed in:', {
        provider: user.provider,
        userId: user.id,
        rememberMe,
      });
      
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // If using Replit Auth, redirect to logout endpoint
      if (session?.user.provider === 'replit') {
        // This would typically redirect to /api/auth/logout
        // For mobile, we'll just clear local session
      }
      
      await clearSession();
      
      console.log('User signed out');
      
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearSession = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.SESSION),
        AsyncStorage.removeItem(STORAGE_KEYS.REMEMBER_ME),
      ]);
      setSession(null);
    } catch (error) {
      console.error('Clear session error:', error);
    }
  };

  const refreshSession = async () => {
    if (!session) return;
    
    try {
      await refreshTokens(session);
    } catch (error) {
      console.error('Session refresh failed:', error);
      // Force sign out if refresh fails
      await signOut();
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!session) return;

    try {
      const updatedUser = { ...session.user, ...userData };
      const updatedSession = { ...session, user: updatedUser };
      
      setSession(updatedSession);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updatedSession));
      
      console.log('User data updated:', userData);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user: session?.user || null,
    session,
    loading,
    isAuthenticated: !!session?.user,
    signIn,
    signOut,
    refreshSession,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}