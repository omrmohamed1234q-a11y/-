import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export default function Signup() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+20'); // Default to Egypt
  const [age, setAge] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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

  const handleSignup = async () => {
    if (!email || !password || !fullName || !phone || !age || !gradeLevel) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (!validatePhone(phone, countryCode)) {
      toast({
        title: "خطأ في رقم الهاتف",
        description: `يرجى إدخال رقم هاتف صحيح للدولة المختارة (${countryCode})`,
        variant: "destructive",
      });
      return;
    }

    const ageNum = parseInt(age);
    if (ageNum < 5 || ageNum > 100) {
      toast({
        title: "خطأ في العمر",
        description: "يرجى إدخال عمر صحيح (من 5 إلى 100 سنة)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            country_code: countryCode,
            age: ageNum,
            grade_level: gradeLevel,
            is_teacher: gradeLevel === 'teacher',
            is_captain: gradeLevel === 'captain'
          }
        }
      });

      if (error) throw error;

      if (data.user && !data.session) {
        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: "تم إرسال رابط التأكيد إلى بريدك الإلكتروني",
        });
      } else {
        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: `مرحباً بك ${fullName}`,
        });
        navigate('/');
      }
      
    } catch (error) {
      toast({
        title: "خطأ في إنشاء الحساب",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء الحساب",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) throw error;
      
    } catch (error) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: "يتطلب إعداد موفر الهوية في Supabase أولاً",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-xl mb-6 mx-auto w-fit">
            <div className="text-5xl mb-3">📄</div>
            <div className="text-3xl font-bold text-gray-800">اطبعلي</div>
          </div>
          <p className="text-gray-600 text-lg">منصة الطباعة الذكية</p>
        </div>

        {/* Signup Card */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">إنشاء حساب جديد</CardTitle>
            <CardDescription>أنشئ حساباً جديداً للبدء</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Form Fields - Enhanced Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الاسم الكامل *
                </label>
                <Input
                  type="text"
                  placeholder="أدخل اسمك الكامل"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="text-right"
                  disabled={loading}
                  data-testid="input-fullname"
                />
              </div>
              
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني *
                </label>
                <Input
                  type="email"
                  placeholder="أدخل بريدك الإلكتروني"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-right"
                  disabled={loading}
                  data-testid="input-email"
                />
              </div>
              
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  كلمة المرور *
                </label>
                <Input
                  type="password"
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-right"
                  disabled={loading}
                  data-testid="input-password"
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العمر *
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
                  data-testid="input-age"
                />
              </div>

              {/* Phone Number with Country Code */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهاتف *
                </label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode} disabled={loading}>
                    <SelectTrigger className="w-32" data-testid="select-country-code">
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
                    data-testid="input-phone"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {countryCode === '+20' && 'مثال: 1012345678 (مصر)'}
                  {countryCode === '+966' && 'مثال: 512345678 (السعودية)'}
                  {countryCode === '+971' && 'مثال: 512345678 (الإمارات)'}
                </p>
              </div>

              {/* Grade Level */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المرحلة التعليمية / الصف الدراسي *
                </label>
                <Select value={gradeLevel} onValueChange={setGradeLevel} disabled={loading}>
                  <SelectTrigger data-testid="select-grade-level">
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
                    <SelectItem value="captain">كابتن توصيل</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Signup Button */}
            <Button 
              onClick={handleSignup}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={loading}
              data-testid="button-signup"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري إنشاء الحساب...</span>
                </div>
              ) : (
                'إنشاء الحساب'
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

            {/* Social Login Options */}
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('google')}
                className="w-full h-12 text-right bg-white border-2 border-gray-300 hover:bg-gray-50 transition-all duration-200 text-gray-700"
                disabled={loading}
                data-testid="button-google"
              >
                <span className="mr-3 text-xl font-bold text-blue-600">G</span>
                التسجيل بـ Google
              </Button>

              <Button
                variant="outline"
                onClick={() => handleSocialLogin('facebook')}
                className="w-full h-12 text-right bg-gradient-to-r from-blue-600 to-blue-700 text-white border-none hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                disabled={loading}
                data-testid="button-facebook"
              >
                <span className="mr-3 text-xl">📘</span>
                التسجيل بـ Facebook
              </Button>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <button 
                onClick={() => navigate('/auth/login')}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
                data-testid="link-login"
              >
                لديك حساب بالفعل؟ تسجيل الدخول
              </button>
            </div>

            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-xl text-center">
              <p className="font-semibold">
                📄 انضم إلى اطبعلي - منصة الطباعة الذكية
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}