import { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('جاري تأكيد تسجيل الدخول...')
  const [location, navigate] = useLocation()
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus('جاري تأكيد تسجيل الدخول...')
        
        // Handle OAuth callback
        const { data, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (data.session) {
          setStatus('تم تسجيل الدخول بنجاح، جاري التحقق من الشروط والأحكام...')
          
          // Check if user has accepted current terms
          try {
            const termsResponse = await fetch('/api/terms/user-status', {
              headers: {
                'Authorization': `Bearer ${data.session.access_token}`
              }
            })
            
            if (termsResponse.ok) {
              const termsData = await termsResponse.json()
              
              if (termsData.success) {
                const hasValidConsent = termsData.data?.hasAcceptedLatestTerms && 
                                      termsData.data?.isActive
                
                if (!hasValidConsent) {
                  setStatus('مطلوب الموافقة على الشروط والأحكام...')
                  
                  // Get current terms version and auto-accept for OAuth users
                  const currentTermsResponse = await fetch('/api/terms/current')
                  
                  if (currentTermsResponse.ok) {
                    const currentTermsData = await currentTermsResponse.json()
                    
                    if (currentTermsData.success && currentTermsData.data?.version) {
                      // Auto-accept terms for OAuth users (they would have agreed during initial signup flow)
                      const acceptResponse = await fetch('/api/terms/accept', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${data.session.access_token}`
                        },
                        body: JSON.stringify({
                          termsVersion: currentTermsData.data.version,
                          consentMethod: "oauth_callback"
                        })
                      })
                      
                      if (acceptResponse.ok) {
                        console.log('✅ Auto-accepted terms for OAuth user')
                      } else {
                        console.warn('⚠️ Failed to auto-accept terms for OAuth user')
                      }
                    }
                  }
                }
              }
            } else if (termsResponse.status === 403) {
              // User needs to accept terms - redirect to terms acceptance page
              const responseData = await termsResponse.json()
              
              if (responseData.requiresConsent) {
                navigate(`/terms-and-conditions?required=true&version=${responseData.currentTermsVersion}&redirect=${encodeURIComponent('/')}`)
                return
              }
            }
          } catch (termsError) {
            console.warn('⚠️ Error checking terms status for OAuth user:', termsError)
            // Continue with login - don't block for terms check errors
          }
          
          // Successful authentication with valid consent, redirect to home
          setStatus('تم تسجيل الدخول بنجاح!')
          setTimeout(() => {
            navigate('/')
          }, 1000)
        } else {
          // No session found, redirect to login with error
          navigate('/auth/login?error=authentication_failed')
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Authentication failed')
        setTimeout(() => {
          navigate('/auth/login?error=authentication_failed')
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
          <p className="text-gray-600 text-lg">{status}</p>
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