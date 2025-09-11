import React, { useState } from 'react'
import { Link } from 'wouter'
import { LogoPresets } from '@/components/AnimatedLogo'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { 
  EyeIcon,
  EyeOffIcon,
  MailIcon,
  LogInIcon
} from 'lucide-react'

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -100, 0],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-red-400/20 to-pink-400/20 rounded-full blur-xl"
      />
      <motion.div
        animate={{
          x: [0, -120, 0],
          y: [0, 80, 0],
          rotate: [360, 180, 0]
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-20 left-20 w-40 h-40 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-3xl blur-xl"
      />
    </div>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال البريد الإلكتروني وكلمة المرور",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    
    try {
      const { supabase } = await import('@/lib/supabase')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في اطبعلي",
      })
      
    } catch (error) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء تسجيل الدخول",
        variant: "destructive",
      })
    }
    
    setLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="cursor-pointer"
            >
              <LogoPresets preset="animated" size={50} />
            </motion.div>
          </Link>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link href="/register">
              <Button 
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                data-testid="button-register-header"
              >
                إنشاء حساب جديد
              </Button>
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md"
        >
          <Card className="border-2 border-gray-200 shadow-2xl backdrop-blur-sm bg-white/95">
            <CardHeader className="text-center space-y-2 pb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring" }}
                className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <LogInIcon className="w-10 h-10 text-white" />
              </motion.div>
              
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-600 bg-clip-text text-transparent">
                تسجيل الدخول
              </CardTitle>
              <CardDescription className="text-gray-600">
                مرحباً بعودتك إلى منصة اطبعلي
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <MailIcon className="w-4 h-4 text-red-500" />
                  البريد الإلكتروني
                </label>
                <Input
                  type="email"
                  placeholder="أدخل بريدك الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-right pr-4 h-12 border-2 border-gray-200 focus:border-red-400 rounded-xl transition-all duration-200"
                  disabled={loading}
                  data-testid="input-email"
                />
              </motion.div>
              
              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span>🔒</span>
                  كلمة المرور
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="أدخل كلمة المرور"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="text-right pr-4 pl-12 h-12 border-2 border-gray-200 focus:border-red-400 rounded-xl transition-all duration-200"
                    disabled={loading}
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>
              
              {/* Login Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="pt-4"
              >
                <Button 
                  onClick={handleLogin}
                  disabled={loading || !email || !password}
                  className="w-full h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  data-testid="button-login"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    <>
                      <LogInIcon className="w-4 h-4 ml-2" />
                      تسجيل الدخول
                    </>
                  )}
                </Button>
              </motion.div>
              
              {/* Register Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center pt-4 border-t border-gray-200"
              >
                <p className="text-gray-600">
                  ليس لديك حساب؟{' '}
                  <Link href="/register" className="text-red-600 hover:text-red-700 font-semibold underline">
                    إنشاء حساب جديد
                  </Link>
                </p>
              </motion.div>
              
              {/* Additional Links */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center space-y-2"
              >
                <div className="text-sm text-gray-500">
                  هل نسيت كلمة المرور؟{' '}
                  <button className="text-red-600 hover:text-red-700 underline">
                    إعادة تعيين كلمة المرور
                  </button>
                </div>
                
                <div className="flex justify-center gap-4 text-xs text-gray-400 pt-4">
                  <Link href="/terms-and-conditions" className="hover:text-red-600 transition-colors">
                    الشروط والأحكام
                  </Link>
                  <span>•</span>
                  <Link href="/privacy-policy" className="hover:text-red-600 transition-colors">
                    سياسة الخصوصية
                  </Link>
                </div>
              </motion.div>
            </CardContent>
          </Card>
          
          {/* Welcome Back Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="text-center mt-8"
          >
            <p className="text-gray-600 text-lg">
              مرحباً بعودتك إلى{' '}
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-600">
                اطبعلي
              </span>
            </p>
            <p className="text-gray-500 text-sm mt-2">
              منصتك الشاملة للطباعة والخدمات التعليمية
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}