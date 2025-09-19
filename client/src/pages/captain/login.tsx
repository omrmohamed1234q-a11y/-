import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Truck, LogIn } from 'lucide-react';
import { useLocation } from 'wouter';

export default function CaptainLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔐 Captain login attempt:', username);
    
    if (!username || !password) {
      toast({
        title: '❌ خطأ',
        description: 'يرجى إدخال اسم المستخدم وكلمة المرور',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/captain/secure-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      const data = await response.json();
      console.log('📊 Login response:', data);

      if (data.success && data.data) {
        // حفظ بيانات الكبتن
        localStorage.setItem('captain_token', data.data.token);
        localStorage.setItem('captain_data', JSON.stringify(data.data.captain));
        
        toast({
          title: '✅ تم تسجيل الدخول بنجاح',
          description: `مرحباً ${data.data.captain.name}`,
          duration: 3000
        });

        console.log('✅ Captain login successful, redirecting...');
        
        // الانتقال لصفحة الكبتن
        setLocation('/captain/dashboard');
      } else {
        console.error('❌ Captain login failed:', data.error || 'Unknown error');
        toast({
          title: '❌ فشل تسجيل الدخول',
          description: data.error || 'بيانات تسجيل الدخول غير صحيحة',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('❌ Captain login error:', error);
      toast({
        title: '❌ خطأ في الاتصال',
        description: 'تعذر الاتصال بالخادم',
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
            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center justify-center gap-2">
              <LogIn className="w-5 h-5" />
              دخول آمن للكباتن
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              {/* اسم المستخدم */}
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-700">
                  اسم المستخدم أو رقم الكبتن
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 text-lg"
                  placeholder="captain001"
                  disabled={isLoading}
                  data-testid="input-username"
                />
              </div>

              {/* كلمة المرور */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  كلمة المرور
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-lg"
                  placeholder="captain123"
                  disabled={isLoading}
                  data-testid="input-password"
                />
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
                    جاري الدخول...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    دخول آمن
                  </div>
                )}
              </Button>
            </form>

            {/* بيانات التجربة */}
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-sm font-semibold text-green-800 mb-2 text-center">
                🔑 بيانات التجربة
              </h3>
              <div className="text-xs text-green-700 space-y-1 text-center">
                <p><strong>اسم المستخدم:</strong> captain001</p>
                <p><strong>كلمة المرور:</strong> captain123</p>
              </div>
            </div>

            {/* معلومات إضافية */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                نظام آمن مع تشفير متقدم 🔒
              </p>
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