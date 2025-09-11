import React, { useState } from 'react'
import { Link } from 'wouter'
import { LogoPresets } from '@/components/AnimatedLogo'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { 
  EyeIcon,
  EyeOffIcon,
  MailIcon,
  PhoneIcon,
  UserIcon,
  CalendarIcon,
  GraduationCapIcon,
  CheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon
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

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+20')
  const [age, setAge] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const { toast } = useToast()

  const validatePhone = (phone: string, countryCode: string) => {
    const digits = phone.replace(/\D/g, '');
    
    if (countryCode === '+20') {
      return digits.length === 10 && digits.startsWith('1');
    }
    
    if (countryCode === '+966') {
      return digits.length === 9 && digits.startsWith('5');
    }
    
    if (countryCode === '+971') {
      return digits.length === 9 && digits.startsWith('5');
    }
    
    return digits.length >= 8;
  };

  const handleRegister = async () => {
    if (!email || !password || !fullName) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      })
      return
    }

    if (!phone || !age || !gradeLevel) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      })
      return
    }

    if (!agreedToTerms) {
      toast({
        title: "الموافقة مطلوبة",
        description: "يجب الموافقة على الشروط والأحكام وسياسة الخصوصية لإنشاء الحساب",
        variant: "destructive",
      })
      return
    }

    if (!validatePhone(phone, countryCode)) {
      toast({
        title: "خطأ في رقم الهاتف",
        description: `يرجى إدخال رقم هاتف صحيح للدولة المختارة`,
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

    setLoading(true)
    
    try {
      const { supabase } = await import('@/lib/supabase')
      
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
            agreed_to_terms: true,
            terms_version: "1.0",
            agreed_at: new Date().toISOString(),
          }
        }
      })
      
      if (error) throw error

      // Save terms acceptance record if user is created and session exists
      if (data.user && data.session) {
        try {
          const response = await fetch('/api/terms/accept', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.session.access_token}`
            },
            body: JSON.stringify({
              userId: data.user.id,
              termsVersion: "1.0",
              consentMethod: "signup",
              userAgent: navigator.userAgent
            })
          });

          if (!response.ok) {
            console.warn('Failed to save terms acceptance:', await response.text());
          }
        } catch (termsError) {
          console.warn('Error saving terms acceptance:', termsError);
          // Don't block signup for terms recording failure
        }
      }
      
      if (data.user && !data.session) {
        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: "يمكنك تسجيل الدخول مباشرة",
        })
      } else {
        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: `مرحباً بك ${fullName}`,
        })
      }
      
    } catch (error) {
      toast({
        title: "خطأ في التسجيل",
        description: error instanceof Error ? error.message : "حدث خطأ غير متوقع",
        variant: "destructive",
      })
    }
    
    setLoading(false)
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-red-50 px-4 py-2 rounded-full">
                <UserIcon className="w-5 h-5 text-red-500" />
                <span className="text-red-600 font-semibold">المعلومات الأساسية</span>
              </div>
            </div>

            {/* Name Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-red-500" />
                الاسم الكامل
              </label>
              <Input
                type="text"
                placeholder="أدخل اسمك الكامل"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="text-right pr-4 h-12 border-2 border-gray-200 focus:border-red-400 rounded-xl transition-all duration-200"
                disabled={loading}
                data-testid="input-fullname"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MailIcon className="w-4 h-4 text-red-500" />
                البريد الإلكتروني
              </label>
              <Input
                type="email"
                placeholder="أدخل بريدك الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-right pr-4 h-12 border-2 border-gray-200 focus:border-red-400 rounded-xl transition-all duration-200"
                disabled={loading}
                data-testid="input-email"
              />
            </div>
            
            {/* Password Field */}
            <div className="space-y-2">
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
                  className="text-right pr-4 pl-12 h-12 border-2 border-gray-200 focus:border-red-400 rounded-xl transition-all duration-200"
                  disabled={loading}
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )
      
      case 2:
        return (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                <PhoneIcon className="w-5 h-5 text-blue-500" />
                <span className="text-blue-600 font-semibold">معلومات التواصل</span>
              </div>
            </div>

            {/* Age Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-blue-500" />
                العمر
              </label>
              <Input
                type="number"
                placeholder="أدخل عمرك"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="text-right pr-4 h-12 border-2 border-gray-200 focus:border-blue-400 rounded-xl transition-all duration-200"
                min="5"
                max="100"
                disabled={loading}
                data-testid="input-age"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <PhoneIcon className="w-4 h-4 text-blue-500" />
                رقم الهاتف
              </label>
              <div className="flex gap-3">
                <Select value={countryCode} onValueChange={setCountryCode} disabled={loading}>
                  <SelectTrigger className="w-32 h-12 border-2 border-gray-200 focus:border-blue-400 rounded-xl" data-testid="select-country">
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
                  className="flex-1 text-right pr-4 h-12 border-2 border-gray-200 focus:border-blue-400 rounded-xl transition-all duration-200"
                  disabled={loading}
                  data-testid="input-phone"
                />
              </div>
              <p className="text-xs text-gray-500">
                {countryCode === '+20' && 'مثال: 1012345678 (مصر)'}
                {countryCode === '+966' && 'مثال: 512345678 (السعودية)'}
                {countryCode === '+971' && 'مثال: 512345678 (الإمارات)'}
              </p>
            </div>
          </motion.div>
        )
      
      case 3:
        return (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full">
                <GraduationCapIcon className="w-5 h-5 text-green-500" />
                <span className="text-green-600 font-semibold">المعلومات التعليمية</span>
              </div>
            </div>

            {/* Grade Level */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <GraduationCapIcon className="w-4 h-4 text-green-500" />
                المرحلة التعليمية / الصف الدراسي
              </label>
              <Select value={gradeLevel} onValueChange={setGradeLevel} disabled={loading}>
                <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-green-400 rounded-xl" data-testid="select-grade">
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

            {/* Terms and Conditions Agreement */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="terms-agreement"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                  data-testid="checkbox-terms"
                />
                <label htmlFor="terms-agreement" className="text-sm text-blue-800 cursor-pointer">
                  أوافق على{' '}
                  <a 
                    href="/terms-and-conditions" 
                    target="_blank"
                    className="text-red-600 hover:text-red-700 underline font-semibold"
                    data-testid="link-terms-conditions"
                  >
                    الشروط والأحكام
                  </a>
                  {' '}و{' '}
                  <a 
                    href="/privacy-policy" 
                    target="_blank"
                    className="text-red-600 hover:text-red-700 underline font-semibold"
                    data-testid="link-privacy-policy"
                  >
                    سياسة الخصوصية
                  </a>
                  {' '}الخاصة بمنصة اطبعلي
                </label>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckIcon className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">مراجعة البيانات</span>
              </div>
              <div className="space-y-2 text-sm text-green-700">
                <div>الاسم: {fullName || '—'}</div>
                <div>البريد: {email || '—'}</div>
                <div>العمر: {age || '—'}</div>
                <div>الهاتف: {phone ? `${countryCode}${phone}` : '—'}</div>
              </div>
            </div>
          </motion.div>
        )
      
      default:
        return null
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
              <LogoPresets.Navigation />
            </motion.div>
          </Link>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link href="/login">
              <Button 
                variant="outline" 
                className="border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold"
                data-testid="button-login-header"
              >
                تسجيل الدخول
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
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-600 bg-clip-text text-transparent">
                إنشاء حساب جديد
              </CardTitle>
              <CardDescription className="text-gray-600">
                انضم إلى منصة اطبعلي واستمتع بخدماتنا المتميزة
              </CardDescription>
              
              {/* Progress Steps */}
              <div className="flex justify-center items-center gap-4 mt-6">
                {[1, 2, 3].map((step) => (
                  <motion.div
                    key={step}
                    className="flex items-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: step * 0.1 }}
                  >
                    <motion.div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                        step <= currentStep
                          ? 'bg-gradient-to-r from-red-500 to-red-600'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                      animate={{ scale: step === currentStep ? 1.1 : 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {step < currentStep ? <CheckIcon className="w-4 h-4" /> : step}
                    </motion.div>
                    {step < 3 && (
                      <div className={`w-8 h-1 mx-2 rounded-full transition-colors duration-300 ${
                        step < currentStep ? 'bg-red-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </motion.div>
                ))}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>
              
              {/* Navigation Buttons */}
              <div className="flex gap-4 pt-6">
                {currentStep > 1 && (
                  <Button 
                    onClick={prevStep}
                    variant="outline"
                    className="flex-1 h-12 border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 rounded-xl font-semibold"
                    disabled={loading}
                    data-testid="button-previous"
                  >
                    <ArrowLeftIcon className="w-4 h-4 ml-2" />
                    السابق
                  </Button>
                )}
                
                {currentStep < 3 ? (
                  <Button 
                    onClick={nextStep}
                    disabled={
                      loading ||
                      (currentStep === 1 && (!fullName || !email || !password)) ||
                      (currentStep === 2 && (!age || !phone))
                    }
                    className="flex-1 h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    data-testid="button-next"
                  >
                    <span>التالي</span>
                    <ArrowRightIcon className="w-4 h-4 mr-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleRegister}
                    disabled={loading || !gradeLevel || !agreedToTerms}
                    className="flex-1 h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    data-testid="button-register"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                        جاري إنشاء الحساب...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4 ml-2" />
                        إنشاء الحساب
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {/* Login Link */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-gray-600">
                  لديك حساب بالفعل؟{' '}
                  <Link href="/login" className="text-red-600 hover:text-red-700 font-semibold underline">
                    تسجيل الدخول
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}