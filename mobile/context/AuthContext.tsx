import React, { createContext, useContext, useEffect, useState } from 'react'
import { authService, User, AuthState } from '../services/auth'

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName?: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithFacebook: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    // Check for existing session
    const initializeAuth = async () => {
      try {
        const session = await authService.getSession()
        if (session?.user) {
          setState({
            user: {
              id: session.user.id,
              email: session.user.email!,
              full_name: session.user.user_metadata?.full_name,
              avatar_url: session.user.user_metadata?.avatar_url,
            },
            loading: false,
            error: null,
          })
        } else {
          setState(prev => ({ ...prev, loading: false }))
        }
      } catch (error) {
        setState({
          user: null,
          loading: false,
          error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        })
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setState({
            user: {
              id: session.user.id,
              email: session.user.email!,
              full_name: session.user.user_metadata?.full_name,
              avatar_url: session.user.user_metadata?.avatar_url,
            },
            loading: false,
            error: null,
          })
        } else {
          setState({
            user: null,
            loading: false,
            error: null,
          })
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      await authService.signIn(email, password)
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'فشل في تسجيل الدخول',
      }))
      throw error
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      await authService.signUp(email, password, fullName)
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'فشل في إنشاء الحساب',
      }))
      throw error
    }
  }

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      await authService.signOut()
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'فشل في تسجيل الخروج',
      }))
      throw error
    }
  }

  const signInWithGoogle = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      await authService.signInWithGoogle()
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'فشل في تسجيل الدخول بجوجل',
      }))
      throw error
    }
  }

  const signInWithFacebook = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      await authService.signInWithFacebook()
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'فشل في تسجيل الدخول بفيسبوك',
      }))
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      await authService.resetPassword(email)
      setState(prev => ({ ...prev, loading: false }))
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'فشل في إعادة تعيين كلمة المرور',
      }))
      throw error
    }
  }

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithFacebook,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}