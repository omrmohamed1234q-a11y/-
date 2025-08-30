import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { 
  PrinterIcon, 
  FileTextIcon, 
  RocketIcon, 
  SparklesIcon,
  EyeIcon,
  EyeOffIcon,
  MailIcon,
  PhoneIcon,
  UserIcon,
  CalendarIcon,
  GraduationCapIcon,
  CheckIcon,
  ArrowRightIcon
} from 'lucide-react'

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Floating geometric shapes */}
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
      <motion.div
        animate={{
          x: [0, 60, 0],
          y: [0, -60, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-1/3 right-1/4 w-24 h-24 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-2xl blur-lg"
      />
    </div>
  )
}

const FloatingPrintIcons = () => {
  const icons = [
    { Icon: PrinterIcon, delay: 0, x: 50, y: -50 },
    { Icon: FileTextIcon, delay: 0.5, x: -30, y: 40 },
    { Icon: SparklesIcon, delay: 1, x: 80, y: 20 },
  ]

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {icons.map(({ Icon, delay, x, y }, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
            x: [0, x],
            y: [0, y]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: delay,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        >
          <Icon className="w-8 h-8 text-red-400/40" />
        </motion.div>
      ))}
    </div>
  )
}

export default function EnhancedLanding() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+20')
  const [age, setAge] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
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

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && !fullName)) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      })
      return
    }

    if (!isLogin) {
      if (!phone || !age || !gradeLevel) {
        toast({
          title: "خطأ",
          description: "يرجى ملء جميع الحقول المطلوبة",
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
    }

    setLoading(true)
    
    try {
      const { supabase } = await import('@/lib/supabase')
      
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً بك في اطبعلي`,
        })
        
      } else {
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

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const renderStepContent = () => {
    if (isLogin) {
      return (
        <motion.div 
          key="login"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <MailIcon className="w-4 h-4 text-red-500" />
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Input
                type="email"
                placeholder="أدخل بريدك الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-right pr-4 h-12 border-2 border-gray-200 focus:border-red-400 rounded-xl transition-all duration-200"
                disabled={loading}
              />
            </div>
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
    }

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
                  <SelectTrigger className="w-32 h-12 border-2 border-gray-200 focus:border-blue-400 rounded-xl">
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
                <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-green-400 rounded-xl">
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
    <div className="min-h-screen relative">
      {/* Enhanced Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-red-50 via-white to-blue-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.1),transparent_50%)]" />
      </div>
      
      <AnimatedBackground />
      <FloatingPrintIcons />
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          {/* Enhanced Logo Section */}
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-8"
          >
            <motion.div 
              className="relative mx-auto w-fit mb-6"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              {/* Glowing background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-pink-400 rounded-3xl blur-xl opacity-30 scale-110"></div>
              
              {/* Main logo container */}
              <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }}
                >
                  <PrinterIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                </motion.div>
                <motion.h1 
                  className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  اطبعلي
                </motion.h1>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="space-y-2"
            >
              <p className="text-gray-600 text-lg font-medium">منصة الطباعة الذكية</p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <SparklesIcon className="w-4 h-4" />
                <span>طباعة سريعة • جودة عالية • خدمة ممتازة</span>
                <SparklesIcon className="w-4 h-4" />
              </div>
            </motion.div>
          </motion.div>

          {/* Enhanced Auth Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          >
            <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <RocketIcon className="w-6 h-6 text-red-500" />
                  </motion.div>
                  <CardTitle className="text-3xl bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-600">
                  {isLogin ? 'أدخل بياناتك للدخول إلى حسابك' : 'انضم إلينا واستمتع بخدمات الطباعة الذكية'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {/* Progress Indicator for Signup */}
                {!isLogin && (
                  <div className="flex justify-center items-center gap-2 mb-6">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center">
                        <motion.div
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                            step <= currentStep
                              ? 'bg-red-500 border-red-500 text-white'
                              : 'bg-gray-100 border-gray-300 text-gray-400'
                          }`}
                          initial={false}
                          animate={{ scale: step === currentStep ? 1.1 : 1 }}
                        >
                          {step < currentStep ? <CheckIcon className="w-4 h-4" /> : step}
                        </motion.div>
                        {step < 3 && (
                          <div 
                            className={`w-8 h-0.5 mx-2 transition-all duration-300 ${
                              step < currentStep ? 'bg-red-500' : 'bg-gray-200'
                            }`} 
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Form Content */}
                <AnimatePresence mode="wait">
                  {renderStepContent()}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex gap-3 pt-6">
                  {!isLogin && currentStep > 1 && (
                    <Button 
                      variant="outline"
                      onClick={prevStep}
                      className="flex-1 h-12 border-2 border-gray-200 hover:border-gray-300 rounded-xl font-semibold transition-all duration-200"
                      disabled={loading}
                    >
                      السابق
                    </Button>
                  )}
                  
                  {!isLogin && currentStep < 3 ? (
                    <Button 
                      onClick={nextStep}
                      disabled={
                        loading ||
                        (currentStep === 1 && (!fullName || !email || !password)) ||
                        (currentStep === 2 && (!age || !phone))
                      }
                      className="flex-1 h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <span>التالي</span>
                      <ArrowRightIcon className="w-4 h-4 mr-2" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleAuth}
                      disabled={loading}
                      className="flex-1 h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                          <span>جاري المعالجة...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {isLogin ? 'تسجيل الدخول' : 'إنشاء الحساب'}
                          <RocketIcon className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                  )}
                </div>



                {/* Toggle Auth Mode */}
                <div className="text-center pt-4">
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin)
                      setCurrentStep(1)
                    }}
                    className="text-red-600 hover:text-red-700 font-semibold transition-colors duration-200 hover:underline"
                    disabled={loading}
                  >
                    {isLogin ? 'ليس لديك حساب؟ إنشاء حساب جديد' : 'لديك حساب بالفعل؟ تسجيل الدخول'}
                  </button>
                </div>

                {/* Admin Access */}
                <motion.div 
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-2xl text-center"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <motion.span 
                      className="text-2xl"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      🔑
                    </motion.span>
                    <span className="font-bold text-lg">دخول لوحة الإدارة</span>
                  </div>
                  <Button 
                    onClick={() => window.location.href = '/admin'}
                    className="bg-white text-green-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    دخول لوحة الإدارة
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}