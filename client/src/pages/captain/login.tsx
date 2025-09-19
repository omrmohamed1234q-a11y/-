import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Truck, User, Lock, LogIn, Navigation } from 'lucide-react';
import { useLocation } from 'wouter';

export default function CaptainLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: '❌ خطأ في البيانات',
        description: 'يرجى إدخال اسم المستخدم وكلمة المرور',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await apiRequest('POST', '/api/captain/secure-login', {
        username,
        password
      });

      const data = await response.json();

      if (data.success) {
        // حفظ بيانات الكبتن
        localStorage.setItem('captain_session', data.sessionToken);
        localStorage.setItem('captain_data', JSON.stringify(data.captain));
        
        toast({
          title: '✅ تم تسجيل الدخول بنجاح',
          description: `مرحباً ${data.captain.name}`,
          duration: 3000
        });

        // الانتقال لصفحة الكبتن
        setLocation('/captain/dashboard');
      }
    } catch (error: any) {
      toast({
        title: '❌ خطأ في تسجيل الدخول',
        description: error.error || 'فشل في تسجيل الدخول',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* شعار الكبتن */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4">
            <Truck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">كابتن اطبعلي</h1>
          <p className="text-gray-600">نظام التوصيل المتقدم</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-gray-800">
              تسجيل دخول الكبتن
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* اسم المستخدم */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  اسم المستخدم أو البريد الإلكتروني
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-12 text-lg"
                    placeholder="أدخل اسم المستخدم"
                    disabled={isLoading}
                    data-testid="input-username"
                  />
                </div>
              </div>

              {/* كلمة المرور */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 text-lg"
                    placeholder="أدخل كلمة المرور"
                    disabled={isLoading}
                    data-testid="input-password"
                  />
                </div>
              </div>

              {/* زر تسجيل الدخول */}
              <Button
                type="submit"
                className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري تسجيل الدخول...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    تسجيل الدخول
                  </div>
                )}
              </Button>
            </form>

            {/* بيانات تجريبية */}
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <h3 className="text-sm font-semibold text-green-800 mb-2">🔑 بيانات التجربة:</h3>
              <div className="text-xs text-green-700 space-y-1">
                <p><strong>المستخدم:</strong> captain001</p>
                <p><strong>كلمة المرور:</strong> captain123</p>
              </div>
            </div>

            {/* معلومات إضافية */}
            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Navigation className="w-3 h-3" />
                تتبع GPS
              </div>
              <div className="flex items-center gap-1">
                <Truck className="w-3 h-3" />
                توصيل سريع
              </div>
            </div>
          </CardContent>
        </Card>

        {/* تذييل */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>جميع الحقوق محفوظة © اطبعلي {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}