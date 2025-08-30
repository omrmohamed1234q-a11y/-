import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { apiRequest } from '@/lib/queryClient';

export default function AdminSignup() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState('admin');
  const [phone, setPhone] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [workingArea, setWorkingArea] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignup = async () => {
    if (!email || !password || !fullName) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    // Additional validation for driver fields
    if (userType === 'driver' && (!phone || !vehicleType || !workingArea)) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع بيانات الكابتن المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (userType === 'driver') {
        // Create driver account using public registration API
        const response = await apiRequest('POST', '/api/drivers/register', {
          name: fullName,
          email,
          password,
          phone,
          vehicleType,
          workingArea
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'فشل في إنشاء حساب الكابتن');
        }

        toast({
          title: "تم إنشاء حساب الكابتن بنجاح",
          description: "يمكنك الآن تسجيل الدخول ببريدك الإلكتروني وكلمة المرور",
        });

        setTimeout(() => {
          navigate('/driver/login');
        }, 1500);

      } else {
        // Create admin account using Supabase
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              user_type: 'admin'
            }
          }
        });

        if (error) {
          toast({
            title: "خطأ في إنشاء الحساب",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "تم إنشاء الحساب",
          description: "سيتم توجيهك للوحة الإدارة",
        });

        setTimeout(() => {
          navigate('/admin');
        }, 1000);
      }

    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        toast({
          title: "خطأ في تسجيل الدخول",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في تسجيل الدخول",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-xl mb-6 mx-auto w-fit">
            <div className="text-5xl mb-3">📄</div>
            <div className="text-3xl font-bold text-gray-800">اطبعلي</div>
          </div>
          <p className="text-gray-600 text-lg">منصة الطباعة الذكية - إنشاء حساب</p>
        </div>

        {/* Signup Card */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">إنشاء حساب جديد</CardTitle>
            <CardDescription>أنشئ حساب إداري أو كابتن توصيل</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نوع الحساب
                </label>
                <Select value={userType} onValueChange={setUserType}>
                  <SelectTrigger data-testid="select-user-type">
                    <SelectValue placeholder="اختر نوع الحساب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">مدير النظام</SelectItem>
                    <SelectItem value="driver">كابتن توصيل</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                  data-testid="input-fullname"
                />
              </div>
              
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

              {/* Driver-specific fields */}
              {userType === 'driver' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رقم الهاتف
                    </label>
                    <Input
                      type="tel"
                      placeholder="01012345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="text-right"
                      disabled={loading}
                      data-testid="input-phone"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نوع المركبة
                    </label>
                    <Select value={vehicleType} onValueChange={setVehicleType}>
                      <SelectTrigger data-testid="select-vehicle-type">
                        <SelectValue placeholder="اختر نوع المركبة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="motorcycle">دراجة نارية</SelectItem>
                        <SelectItem value="car">سيارة</SelectItem>
                        <SelectItem value="bicycle">دراجة</SelectItem>
                        <SelectItem value="walking">سير على الأقدام</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      منطقة العمل
                    </label>
                    <Input
                      type="text"
                      placeholder="مدينة نصر، القاهرة"
                      value={workingArea}
                      onChange={(e) => setWorkingArea(e.target.value)}
                      className="text-right"
                      disabled={loading}
                      data-testid="input-working-area"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Signup Button */}
            <Button 
              onClick={handleSignup}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={loading}
              data-testid="button-signup"
            >
              {loading 
                ? (userType === 'driver' ? 'جاري إنشاء حساب الكابتن...' : 'جاري إنشاء الحساب...') 
                : (userType === 'driver' ? 'إنشاء حساب كابتن' : 'إنشاء حساب إداري')
              }
            </Button>

            {/* Divider */}
            <div className="relative">
              <Separator />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-4 text-gray-500 text-sm">أو</span>
              </span>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => handleSocialLogin('google')}
                className="w-full h-12 text-right bg-gradient-to-r from-red-500 to-red-600 text-white border-none hover:from-red-600 hover:to-red-700 transition-all duration-200"
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
                🛡️ لوحة الإدارة - اطبعلي
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}