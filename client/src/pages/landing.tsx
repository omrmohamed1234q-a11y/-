import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from "@/hooks/use-toast"
import { LogoPresets } from "@/components/AnimatedLogo"

export default function Landing() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+20') // Default to Egypt
  const [age, setAge] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const validatePhone = (phone: string, countryCode: string) => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Egypt phone validation
    if (countryCode === '+20') {
      return digits.length === 10 && digits.startsWith('1');
    }
    
    // Saudi Arabia phone validation
    if (countryCode === '+966') {
      return digits.length === 9 && digits.startsWith('5');
    }
    
    // UAE phone validation
    if (countryCode === '+971') {
      return digits.length === 9 && digits.startsWith('5');
    }
    
    // Default validation (at least 8 digits)
    return digits.length >= 8;
  };

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !fullName)) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      })
      return
    }

    // Additional validation for signup
    if (!isLogin) {
      if (!phone || !age || !gradeLevel) {
        toast({
          title: "خطأ",
          description: "يرجى ملء جميع الحقول المطلوبة (العمر، الهاتف، الصف الدراسي)",
          variant: "destructive",
        })
        return
      }

      if (!validatePhone(phone, countryCode)) {
        toast({
          title: "خطأ في رقم الهاتف",
          description: `يرجى إدخال رقم هاتف صحيح للدولة المختارة (${countryCode})`,
          variant: "destructive",
        })
        return
      }

      const ageNum = parseInt(age)
      if (ageNum < 5 || ageNum > 100) {
        toast({
          title: "خطأ في العمر",
          description: "يرجى إدخال عمر صحيح (من 5 إلى 100 سنة)",
          variant: "destructive",
        })
        return
      }
    }

    setLoading(true)
    
    try {
      const { supabase } = await import('@/lib/supabase')
      
      if (isLogin) {
        // Sign in existing user
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً بك في اطبعلي`,
        })
        
        // Redirect will happen automatically via auth state change
        
      } else {
        // Sign up new user
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: `${countryCode}${phone}`,
              age: parseInt(age),
              grade_level: gradeLevel,
              country_code: countryCode,
            }
          }
        })
        
        if (error) throw error
        
        if (data.user && !data.session) {
          // Email confirmation required
          toast({
            title: "تم إنشاء الحساب بنجاح",
            description: "ملاحظة: إرسال البريد الإلكتروني غير مُفعل حالياً. يمكنك تسجيل الدخول مباشرة.",
          })
        } else {
          // Immediate login (if email confirmation is disabled)
          toast({
            title: "تم إنشاء الحساب بنجاح",
            description: `مرحباً بك ${fullName}`,
          })
        }
      }
      
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء المعالجة",
        variant: "destructive",
      })
    }
    
    setLoading(false)
  }

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      setLoading(true)
      
      // Show temporary message since OAuth providers need to be configured
      toast({
        title: `تسجيل الدخول بـ ${provider === 'google' ? 'Google' : 'Facebook'}`,
        description: "يتطلب هذا إعداد موفر الهوية في Supabase أولاً",
        variant: "destructive",
      })
      
      setLoading(false)
      
    } catch (error) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error instanceof Error ? error.message : "فشل في تسجيل الدخول",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="mb-6 mx-auto w-fit">
            <LogoPresets.Login />
          </div>
          <p className="text-gray-600 text-lg">منصة الطباعة الذكية</p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </CardTitle>
            <CardDescription>
              {isLogin ? 'أدخل بياناتك للدخول إلى حسابك' : 'أنشئ حساباً جديداً للبدء'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Form Fields */}
            <div className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الاسم الكامل
                  </label>
                  <Input
                    type="text"
                    placeholder="أدخل اسمك الكامل"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="text-right"
                    disabled={loading}
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني
                </label>
                <Input
                  type="email"
                  placeholder="أدخل بريدك الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-right"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  كلمة المرور
                </label>
                <Input
                  type="password"
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-right"
                  disabled={loading}
                />
              </div>

              {/* Additional fields for signup */}
              {!isLogin && (
                <>
                  {/* Age Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      العمر
                    </label>
                    <Input
                      type="number"
                      placeholder="أدخل عمرك"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="text-right"
                      min="5"
                      max="100"
                      disabled={loading}
                    />
                  </div>

                  {/* Phone Number with Country Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رقم الهاتف
                    </label>
                    <div className="flex gap-2">
                      <Select value={countryCode} onValueChange={setCountryCode} disabled={loading}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+20">🇪🇬 مصر +20</SelectItem>
                          <SelectItem value="+966">🇸🇦 السعودية +966</SelectItem>
                          <SelectItem value="+971">🇦🇪 الإمارات +971</SelectItem>
                          <SelectItem value="+965">🇰🇼 الكويت +965</SelectItem>
                          <SelectItem value="+973">🇧🇭 البحرين +973</SelectItem>
                          <SelectItem value="+974">🇶🇦 قطر +974</SelectItem>
                          <SelectItem value="+968">🇴🇲 عمان +968</SelectItem>
                          <SelectItem value="+961">🇱🇧 لبنان +961</SelectItem>
                          <SelectItem value="+962">🇯🇴 الأردن +962</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="tel"
                        placeholder="رقم الهاتف"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="flex-1 text-right"
                        disabled={loading}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {countryCode === '+20' && 'مثال: 1012345678 (مصر)'}
                      {countryCode === '+966' && 'مثال: 512345678 (السعودية)'}
                      {countryCode === '+971' && 'مثال: 512345678 (الإمارات)'}
                    </p>
                  </div>

                  {/* Grade Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المرحلة التعليمية / الصف الدراسي
                    </label>
                    <Select value={gradeLevel} onValueChange={setGradeLevel} disabled={loading}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المرحلة التعليمية أو الصف الدراسي" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg_1">روضة أولى (KG1)</SelectItem>
                        <SelectItem value="kg_2">روضة ثانية (KG2)</SelectItem>
                        <SelectItem value="primary_1">الصف الأول الابتدائي</SelectItem>
                        <SelectItem value="primary_2">الصف الثاني الابتدائي</SelectItem>
                        <SelectItem value="primary_3">الصف الثالث الابتدائي</SelectItem>
                        <SelectItem value="primary_4">الصف الرابع الابتدائي</SelectItem>
                        <SelectItem value="primary_5">الصف الخامس الابتدائي</SelectItem>
                        <SelectItem value="primary_6">الصف السادس الابتدائي</SelectItem>
                        <SelectItem value="preparatory_1">الصف الأول الإعدادي</SelectItem>
                        <SelectItem value="preparatory_2">الصف الثاني الإعدادي</SelectItem>
                        <SelectItem value="preparatory_3">الصف الثالث الإعدادي</SelectItem>
                        <SelectItem value="secondary_1">الصف الأول الثانوي</SelectItem>
                        <SelectItem value="secondary_2">الصف الثاني الثانوي</SelectItem>
                        <SelectItem value="secondary_3">الصف الثالث الثانوي</SelectItem>
                        <SelectItem value="university">طالب جامعي</SelectItem>
                        <SelectItem value="teacher">معلم/مدرس</SelectItem>
                        <SelectItem value="parent">ولي أمر</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            {/* Login Button */}
            <Button 
              onClick={handleAuth}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري المعالجة...</span>
                </div>
              ) : (
                isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب'
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">أو</span>
              </div>
            </div>

            {/* Social Login Options - Temporarily Disabled */}
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('google')}
                className="w-full h-12 text-right bg-gray-100 border-2 border-gray-300 text-gray-500 cursor-not-allowed"
                disabled={true}
              >
                <span className="mr-3 text-xl font-bold text-blue-600">G</span>
                تسجيل الدخول بـ Google (قيد الإعداد)
              </Button>

              <Button
                variant="outline"
                onClick={() => handleSocialLogin('facebook')}
                className="w-full h-12 text-right bg-gray-100 border-2 border-gray-300 text-gray-500 cursor-not-allowed"
                disabled={true}
              >
                <span className="mr-3 text-xl">📘</span>
                تسجيل الدخول بـ Facebook (قيد الإعداد)
              </Button>
            </div>

            {/* Toggle Auth Mode */}
            <div className="text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-red-600 hover:text-red-700 font-medium"
                disabled={loading}
              >
                {isLogin ? 'ليس لديك حساب؟ إنشاء حساب جديد' : 'لديك حساب بالفعل؟ تسجيل الدخول'}
              </button>
            </div>

            {/* Admin Access */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl text-center">
              <p className="font-semibold mb-3">
                🔑 دخول لوحة الإدارة
              </p>
              <Button 
                onClick={() => window.location.href = '/admin'}
                className="bg-white text-green-600 hover:bg-gray-100 font-semibold py-2 px-6 rounded-lg"
              >
                دخول لوحة الإدارة
              </Button>
            </div>

            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-xl text-center">
              <p className="font-semibold">
                📄 مرحباً بك في اطبعلي - منصة الطباعة الذكية
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}