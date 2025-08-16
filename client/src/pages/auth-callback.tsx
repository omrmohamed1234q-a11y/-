import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [location, navigate] = useLocation()
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle OAuth callback
        const { data, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (data.session) {
          // Successful authentication, redirect to home
          navigate('/')
        } else {
          // No session found, redirect to login with error
          navigate('/?error=authentication_failed')
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Authentication failed')
        setTimeout(() => {
          navigate('/?error=authentication_failed')
        }, 3000)
      } finally {
        setLoading(false)
      }
    }
    
    handleAuthCallback()
  }, [navigate])
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">جاري تأكيد تسجيل الدخول...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">خطأ في تسجيل الدخول</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
          >
            المحاولة مرة أخرى
          </button>
        </div>
      </div>
    )
  }
  
  // This shouldn't render as useEffect should redirect
  return null
}