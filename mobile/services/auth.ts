import { supabase } from '../lib/supabase'
import * as AuthSession from 'expo-auth-session'
import * as Crypto from 'expo-crypto'

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

class AuthService {
  async signUp(email: string, password: string, fullName?: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })

      if (error) throw error
      return { user: data.user, session: data.session }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'فشل في إنشاء الحساب')
    }
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return { user: data.user, session: data.session }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'فشل في تسجيل الدخول')
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'فشل في تسجيل الخروج')
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      return null
    }
  }

  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (error) {
      return null
    }
  }

  // Google OAuth
  async signInWithGoogle() {
    try {
      const redirectTo = AuthSession.makeRedirectUri({
        useProxy: true,
      })

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
        },
      })

      if (error) throw error
      return data
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'فشل في تسجيل الدخول بجوجل')
    }
  }

  // Facebook OAuth
  async signInWithFacebook() {
    try {
      const redirectTo = AuthSession.makeRedirectUri({
        useProxy: true,
      })

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo,
        },
      })

      if (error) throw error
      return data
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'فشل في تسجيل الدخول بفيسبوك')
    }
  }

  // Reset password
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) throw error
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'فشل في إعادة تعيين كلمة المرور')
    }
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

export const authService = new AuthService()