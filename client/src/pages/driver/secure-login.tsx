import { useState } from 'react';
import { useNavigate } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Truck, Lock, User, Eye, EyeOff, AlertTriangle } from 'lucide-react';

export default function DriverSecureLogin() {
  const [, navigate] = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast({
        variant: "destructive",
        title: "خطأ في البيانات",
        description: "يرجى إدخال اسم المستخدم وكلمة المرور"
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔐 Driver login attempt:', formData.username);
      
      const response = await fetch('/api/driver/secure-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Driver logged in successfully');
        
        // حفظ بيانات السائق في localStorage
        localStorage.setItem('driverAuth', JSON.stringify({
          user: result.user,
          token: result.token,
          loginTime: new Date().toISOString(),
          sessionToken: result.sessionToken
        }));

        toast({
          title: "✅ تم تسجيل الدخول بنجاح",
          description: `مرحباً ${result.user.fullName}`,
        });

        // توجيه إلى لوحة التحكم
        navigate('/driver/dashboard');
        
      } else {
        console.error('❌ Driver login failed:', result.error);
        toast({
          variant: "destructive",
          title: "❌ فشل تسجيل الدخول",
          description: result.error || "اسم المستخدم أو كلمة المرور غير صحيحة"
        });
      }
    } catch (error) {
      console.error('❌ Driver login error:', error);
      toast({
        variant: "destructive",
        title: "❌ خطأ في الاتصال",
        description: "تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-red-50 flex items-center justify-center p-6" dir="rtl">
      <div className="w-full max-w-md">
        {/* الترويسة */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-600 to-red-600 rounded-full flex items-center justify-center mb-4">
            <Truck className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-red-600 bg-clip-text text-transparent">
            اطبعلي
          </h1>
          <p className="text-gray-600 mt-2">تسجيل دخول السائقين</p>
        </div>

        {/* تحذير الأمان */}
        <Card className="border-orange-200 bg-orange-50 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <p className="font-semibold">منطقة آمنة</p>
                <p>هذه الصفحة محمية ومخصصة للسائقين المصرح لهم فقط</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* نموذج تسجيل الدخول */}
        <Card className="border-gray-200 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Lock className="h-5 w-5" />
              دخول آمن للسائقين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* اسم المستخدم */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  اسم المستخدم أو رقم السائق
                </Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="pl-4 pr-10"
                    placeholder="أدخل اسم المستخدم"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* كلمة المرور */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-10"
                    placeholder="أدخل كلمة المرور"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* زر تسجيل الدخول */}
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-red-600 hover:from-green-700 hover:to-red-700 text-white py-3 text-lg font-semibold"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري تسجيل الدخول...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    دخول آمن
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* معلومات إضافية */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>للحصول على حساب سائق، تواصل مع الإدارة</p>
          <p className="mt-1">جميع محاولات الدخول مسجلة ومراقبة</p>
        </div>
      </div>
    </div>
  );
}