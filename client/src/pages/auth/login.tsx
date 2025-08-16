import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('printformead1@gmail.com');
  const [password, setPassword] = useState('adminadminS582038s123');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      // Try backend authentication first (handles admin and regular users)
      const response = await fetch('/api/auth/supabase/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "فشل في تسجيل الدخول");
      }

      // Store user data in localStorage for the auth hook
      localStorage.setItem('user', JSON.stringify(result.user));
      localStorage.setItem('token', result.token);
      if (result.refresh_token) {
        localStorage.setItem('refresh_token', result.refresh_token);
      }

      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً بك في اطبعلي`,
      });

      // Force page reload to ensure auth state is updated
      setTimeout(() => {
        if (result.user.role === 'admin' || result.user.email === 'printformead1@gmail.com') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/';
        }
      }, 1000);
      
    } catch (error) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء تسجيل الدخول",
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

        {/* Login Card */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
            <CardDescription>أدخل بياناتك للدخول إلى حسابك</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Admin Credentials Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-blue-800 font-semibold mb-2">🔑 بيانات تسجيل الدخول الإداري</div>
              <div className="text-sm text-blue-600">
                البيانات التالية معبأة مسبقاً للوصول إلى لوحة الإدارة
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
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
                  data-testid="input-email"
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
                  data-testid="input-password"
                />
              </div>
            </div>

            {/* Login Button */}
            <Button 
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={loading}
              data-testid="button-login"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2 space-x-reverse">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>جاري تسجيل الدخول...</span>
                </div>
              ) : (
                '🔑 دخول لوحة الإدارة'
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
                تسجيل الدخول بـ Google
              </Button>

              <Button
                variant="outline"
                onClick={() => handleSocialLogin('facebook')}
                className="w-full h-12 text-right bg-gradient-to-r from-blue-600 to-blue-700 text-white border-none hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                disabled={loading}
                data-testid="button-facebook"
              >
                <span className="mr-3 text-xl">📘</span>
                تسجيل الدخول بـ Facebook
              </Button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <button 
                onClick={() => navigate('/auth/signup')}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
                data-testid="link-signup"
              >
                ليس لديك حساب؟ إنشاء حساب جديد
              </button>
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
  );
}