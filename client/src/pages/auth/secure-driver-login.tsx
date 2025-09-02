import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Truck, Lock, Mail, User, AlertTriangle, Hash } from 'lucide-react';

export default function SecureDriverLogin() {
  const [credentials, setCredentials] = useState({
    username: 'testdriver',
    email: 'driver@test.com',
    password: '',
    driverCode: 'DR001'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isBlocked) {
      setError('تم حظر المحاولات لمدة 5 دقائق بسبب المحاولات الكثيرة');
      return;
    }

    if (!credentials.username || !credentials.email || !credentials.password || !credentials.driverCode) {
      setError('جميع الحقول مطلوبة بما في ذلك كود السائق');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/driver-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...credentials,
          clientInfo: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            attempts: attempts + 1
          }
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Reset attempts on success
        setAttempts(0);
        
        toast({
          title: "🚛 تم تسجيل الدخول بنجاح",
          description: `مرحباً بك ${result.user.fullName} - كود السائق: ${result.user.driverCode}`
        });
        
        // Store driver session with security info
        localStorage.setItem('driverAuth', JSON.stringify({
          user: result.user,
          loginTime: new Date().toISOString(),
          sessionToken: `driver_${Date.now()}`,
          securityLevel: 'high'
        }));
        
        // Also store in driverData for compatibility
        localStorage.setItem('driverData', JSON.stringify(result.user));
        
        // Clear credentials from memory
        setCredentials({ username: '', email: '', password: '', driverCode: '' });
        
        // Redirect to driver dashboard
        setTimeout(() => {
          window.location.href = '/driver/dashboard';
        }, 1000);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setIsBlocked(true);
          setError('🚫 تم حظر المحاولات لمدة 5 دقائق بسبب المحاولات الفاشلة المتكررة');
          setTimeout(() => {
            setIsBlocked(false);
            setAttempts(0);
          }, 300000); // 5 minutes
        } else {
          setError(`❌ ${result.message || 'بيانات الدخول غير صحيحة'} (المحاولة ${newAttempts}/3)`);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('🔴 خطأ في الاتصال بالخادم. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Security Warning */}
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            هذه منطقة آمنة للسائقين. يتم تسجيل جميع محاولات الدخول ومراقبتها.
          </AlertDescription>
        </Alert>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-4 bg-blue-600 text-white rounded-t-lg">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto">
              <Truck className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-bold">
              دخول السائقين المحمي
            </CardTitle>
            <p className="text-blue-100 text-sm">
              صفحة دخول آمنة للسائقين المعتمدين فقط
            </p>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2 text-gray-700">
                  <User className="w-4 h-4" />
                  اسم المستخدم
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="أدخل اسم المستخدم الخاص بك"
                  className="text-right"
                  required
                  data-testid="input-driver-username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4" />
                  البريد الإلكتروني
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="أدخل بريدك الإلكتروني"
                  className="text-right"
                  required
                  data-testid="input-driver-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverCode" className="flex items-center gap-2 text-gray-700">
                  <Hash className="w-4 h-4" />
                  كود السائق (اختياري)
                </Label>
                <Input
                  id="driverCode"
                  type="text"
                  value={credentials.driverCode}
                  onChange={(e) => setCredentials(prev => ({ ...prev, driverCode: e.target.value }))}
                  placeholder="أدخل كود السائق الخاص بك"
                  className="text-right"
                  data-testid="input-driver-code"
                />
                <p className="text-xs text-gray-500">
                  كود السائق يوفر طبقة حماية إضافية
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-gray-700">
                  <Lock className="w-4 h-4" />
                  كلمة المرور
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="أدخل كلمة المرور"
                  className="text-right"
                  required
                  data-testid="input-driver-password"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !credentials.username || !credentials.email || !credentials.password}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-semibold"
                data-testid="button-driver-login"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري التحقق...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    دخول آمن
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  🚚 منصة السائقين الآمنة
                </p>
                <p className="text-xs text-gray-500">
                  جميع الأنشطة مسجلة ومراقبة للأمان
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            في حالة واجهت مشاكل في الدخول، تواصل مع إدارة السائقين
          </p>
        </div>

        {/* Driver Features */}
        <Card className="mt-4 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-blue-800 mb-2">مميزات منصة السائقين:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• تتبع الطلبات في الوقت الفعلي</li>
              <li>• إدارة حالة التوفر (متصل/غير متصل/مشغول)</li>
              <li>• عرض إحصائيات الأداء والتقييمات</li>
              <li>• استقبال الطلبات الجديدة فورياً</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}