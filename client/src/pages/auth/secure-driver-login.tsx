import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Truck, Lock, Mail, User, AlertTriangle, Hash } from 'lucide-react';
import { LocationTracker } from '@/components/LocationTracker';

export default function SecureDriverLogin() {
  const [credentials, setCredentials] = useState({
    username: '',
    email: '',
    password: '',
    driverCode: ''
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
      const response = await fetch('/api/auth/driver/secure-login', {
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HTTP Error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Login response:', result);

      if (result.success) {
        // Reset attempts on success
        setAttempts(0);
        
        toast({
          title: "🚛 تم تسجيل الدخول بنجاح",
          description: `مرحباً بك ${result.driver.fullName} - كود السائق: ${result.driver.driverCode}`
        });
        
        // Store driver session with security info
        localStorage.setItem('driverAuth', JSON.stringify({
          user: result.driver,
          token: result.token,
          loginTime: new Date().toISOString(),
          sessionToken: `driver_${Date.now()}`,
          securityLevel: 'high'
        }));
        
        // Also store in driverData for compatibility
        localStorage.setItem('driverData', JSON.stringify(result.driver));
        localStorage.setItem('driverToken', result.token);
        
        // Clear credentials from memory
        setCredentials({ username: '', email: '', password: '', driverCode: '' });
        
        // Redirect to secure driver control dashboard
        setTimeout(() => {
          window.location.href = '/driver/secure-dashboard';
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
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      setError(`🔴 خطأ في الاتصال: ${errorMessage}`);
      
      // Count this as a failed attempt
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setIsBlocked(true);
        setError('🚫 تم حظر المحاولات لمدة 5 دقائق بسبب الأخطاء المتكررة');
        setTimeout(() => {
          setIsBlocked(false);
          setAttempts(0);
        }, 300000); // 5 minutes
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-black flex items-center justify-center p-4" dir="rtl">
      {/* Tracking Pattern Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Driver Security Warning */}
        <Alert className="mb-6 border-blue-500 bg-blue-950 bg-opacity-90 backdrop-blur-sm">
          <AlertTriangle className="h-5 w-5 text-blue-400" />
          <AlertDescription className="text-blue-200 font-medium">
            🚚 منطقة السائقين المؤمنة - تتبع نشط
            <br />
            <span className="text-blue-300 text-xs">نظام المراقبة الذكي يسجل جميع أنشطة السائقين</span>
          </AlertDescription>
        </Alert>

        {/* Example Credentials */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <AlertDescription className="text-blue-800 text-sm">
            <strong>مثال للاختبار:</strong><br/>
            المستخدم: ahmedd | الإيميل: omarr3loush@gmail.com<br/>
            كلمة المرور: 123456 | كود السائق: 123456
          </AlertDescription>
        </Alert>

        <Card className="shadow-2xl border-blue-800 border-2 bg-slate-900 bg-opacity-95 backdrop-blur-lg">
          <CardHeader className="text-center space-y-4 bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-t-lg relative overflow-hidden">
            {/* Animated Tracking Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-full h-full animate-pulse" style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255,255,255,0.1) 8px, rgba(255,255,255,0.1) 16px)'
              }}></div>
            </div>
            
            <div className="w-20 h-20 bg-blue-700 bg-opacity-30 rounded-full flex items-center justify-center mx-auto border-2 border-blue-400 relative z-10">
              <Truck className="w-10 h-10 text-blue-200" />
              <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping"></div>
            </div>
            <CardTitle className="text-3xl font-bold relative z-10 text-shadow">
              🚛 مركز التحكم اللوجستي
            </CardTitle>
            <p className="text-blue-100 text-sm relative z-10 font-medium">
              منصة إدارة السائقين والتتبع الذكي
            </p>
          </CardHeader>
          <CardContent className="p-8 bg-slate-800 bg-opacity-50">
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

              {/* Location Tracker for Driver */}
              <LocationTracker 
                userType="driver"
                onLocationUpdate={(location) => {
                  console.log('Driver location updated:', location);
                }}
                autoStart={false}
              />

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