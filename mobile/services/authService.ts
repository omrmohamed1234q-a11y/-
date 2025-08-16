import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../context/AuthContext';

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName: string;
  agreeToTerms: boolean;
}

export interface OAuthTokens {
  idToken?: string;
  accessToken: string;
}

class AuthService {
  private readonly API_BASE = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5000/api/auth' 
    : '/api/auth';

  // Supabase Authentication
  async signInWithSupabase(credentials: SignInCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/supabase/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          rememberMe: credentials.rememberMe,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'فشل في تسجيل الدخول');
      }

      return {
        success: true,
        message: data.message,
        user: {
          ...data.user,
          provider: 'supabase',
        },
        token: data.token,
      };
    } catch (error) {
      console.error('Supabase sign in error:', error);
      throw new Error(error instanceof Error ? error.message : 'فشل في تسجيل الدخول');
    }
  }

  async signUpWithSupabase(credentials: SignUpCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/supabase/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          fullName: credentials.fullName,
          agreeToTerms: credentials.agreeToTerms,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'فشل في إنشاء الحساب');
      }

      return {
        success: true,
        message: data.message,
        user: {
          ...data.user,
          provider: 'supabase',
        },
        token: data.token,
      };
    } catch (error) {
      console.error('Supabase sign up error:', error);
      throw new Error(error instanceof Error ? error.message : 'فشل في إنشاء الحساب');
    }
  }

  async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/supabase/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'فشل في إرسال رابط إعادة التعيين');
      }

      return {
        success: data.success,
        message: data.message,
      };
    } catch (error) {
      console.error('Password reset error:', error);
      throw new Error(error instanceof Error ? error.message : 'فشل في إرسال رابط إعادة التعيين');
    }
  }

  // Google Authentication
  async signInWithGoogle(tokens?: OAuthTokens): Promise<AuthResponse> {
    try {
      // For mobile, we would typically use Expo AuthSession or react-native-google-signin
      // Here we'll simulate the OAuth flow
      
      let googleTokens = tokens;
      if (!googleTokens) {
        // Simulate Google OAuth flow
        // In real implementation, this would open Google OAuth screen
        googleTokens = {
          accessToken: 'mock_google_access_token',
          idToken: 'mock_google_id_token',
        };
      }

      const response = await fetch(`${this.API_BASE}/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleTokens),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'فشل في تسجيل الدخول بجوجل');
      }

      return {
        success: true,
        message: data.message,
        user: {
          ...data.user,
          provider: 'google',
        },
        token: data.token,
      };
    } catch (error) {
      console.error('Google sign in error:', error);
      throw new Error(error instanceof Error ? error.message : 'فشل في تسجيل الدخول بجوجل');
    }
  }

  // Facebook Authentication
  async signInWithFacebook(accessToken?: string): Promise<AuthResponse> {
    try {
      // For mobile, we would typically use react-native-fbsdk-next
      // Here we'll simulate the OAuth flow
      
      let fbToken = accessToken;
      if (!fbToken) {
        // Simulate Facebook OAuth flow
        // In real implementation, this would open Facebook OAuth screen
        fbToken = 'mock_facebook_access_token';
      }

      const response = await fetch(`${this.API_BASE}/facebook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken: fbToken }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'فشل في تسجيل الدخول بفيسبوك');
      }

      return {
        success: true,
        message: data.message,
        user: {
          ...data.user,
          provider: 'facebook',
        },
        token: data.token,
      };
    } catch (error) {
      console.error('Facebook sign in error:', error);
      throw new Error(error instanceof Error ? error.message : 'فشل في تسجيل الدخول بفيسبوك');
    }
  }

  // Replit Authentication
  async signInWithReplit(): Promise<AuthResponse> {
    try {
      // For mobile, Replit Auth would typically redirect to a web view
      // Then capture the callback with the authorization code
      
      // Simulate the OAuth flow
      const response = await fetch(`${this.API_BASE}/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // In real implementation, this would be the session cookie or bearer token
          'Authorization': 'Bearer mock_replit_token',
        },
      });

      if (!response.ok) {
        throw new Error('فشل في تسجيل الدخول بـ Replit');
      }

      const userData = await response.json();

      return {
        success: true,
        message: 'تم تسجيل الدخول بـ Replit بنجاح',
        user: {
          ...userData,
          provider: 'replit',
        },
        token: 'mock_replit_token',
      };
    } catch (error) {
      console.error('Replit sign in error:', error);
      throw new Error(error instanceof Error ? error.message : 'فشل في تسجيل الدخول بـ Replit');
    }
  }

  // Token validation and refresh
  async validateToken(token: string, provider: string): Promise<boolean> {
    try {
      const endpoint = provider === 'replit' ? '/user' : `/${provider}/validate`;
      
      const response = await fetch(`${this.API_BASE}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  async refreshToken(refreshToken: string, provider: string): Promise<{ token: string; expiresAt: number } | null> {
    try {
      const response = await fetch(`${this.API_BASE}/${provider}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        token: data.accessToken,
        expiresAt: Date.now() + (data.expiresIn * 1000),
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  // Session management
  async clearStoredSession(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem('auth_session'),
        AsyncStorage.removeItem('remember_me'),
        AsyncStorage.removeItem('user_preferences'),
      ]);
    } catch (error) {
      console.error('Clear session error:', error);
    }
  }

  // Utility methods
  async isNetworkAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/health`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  getProviderDisplayName(provider: string): string {
    const providers = {
      supabase: 'اطبعلي',
      replit: 'Replit',
      google: 'جوجل',
      facebook: 'فيسبوك',
    };
    return providers[provider as keyof typeof providers] || provider;
  }

  getProviderIcon(provider: string): string {
    const icons = {
      supabase: '📱',
      replit: '🔧',
      google: '🔍',
      facebook: '👥',
    };
    return icons[provider as keyof typeof icons] || '🔑';
  }
}

export const authService = new AuthService();
export default authService;