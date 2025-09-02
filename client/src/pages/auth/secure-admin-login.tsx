import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Shield, Lock, Mail, User, AlertTriangle } from 'lucide-react';
import { LocationTracker } from '@/components/LocationTracker';

export default function SecureAdminLogin() {
  const [credentials, setCredentials] = useState({
    username: '',
    email: '',
    password: ''
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

    if (!credentials.username || !credentials.email || !credentials.password) {
      setError('جميع الحقول مطلوبة');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/admin/secure-login', {
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
      console.log('Admin login response:', result);

      if (result.success) {
        // Reset attempts on success
        setAttempts(0);
        
        toast({
          title: "✅ تم تسجيل الدخول بنجاح",
          description: `مرحباً بك ${result.admin.fullName} - الوصول الآمن مُفعَّل`
        });
        
        // Store admin session with security info
        localStorage.setItem('adminAuth', JSON.stringify({
          user: result.admin,
          token: result.token,
          loginTime: new Date().toISOString(),
          sessionToken: `admin_${Date.now()}`,
          securityLevel: 'high'
        }));
        
        // Also store in adminData for compatibility
        localStorage.setItem('adminData', JSON.stringify(result.admin));
        localStorage.setItem('adminToken', result.token);
        
        // Clear credentials from memory
        setCredentials({ username: '', email: '', password: '' });
        
        // Redirect to main admin dashboard
        setTimeout(() => {
          window.location.href = '/admin';
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
      console.error('Admin login error:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-black flex items-center justify-center p-4" dir="rtl">
      {/* Surveillance Pattern Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #ff6b6b 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* High Security Warning */}
        <Alert className="mb-6 border-red-500 bg-red-950 bg-opacity-90 backdrop-blur-sm">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <AlertDescription className="text-red-200 font-medium">
            🔒 منطقة حساسة - مراقبة مستمرة نشطة
            <br />
            <span className="text-red-300 text-xs">جميع الأنشطة مُسجلة ومُراقبة بواسطة الأمان الرقمي</span>
          </AlertDescription>
        </Alert>



        <Card className="shadow-2xl border-red-800 border-2 bg-slate-900 bg-opacity-95 backdrop-blur-lg">
          <CardHeader className="text-center space-y-4 bg-gradient-to-r from-red-900 to-red-800 text-white rounded-t-lg relative overflow-hidden">
            {/* Animated Security Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-full h-full animate-pulse" style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
              }}></div>
            </div>
            
            <div className="w-20 h-20 bg-red-700 bg-opacity-30 rounded-full flex items-center justify-center mx-auto border-2 border-red-400 relative z-10">
              <Shield className="w-10 h-10 text-red-200" />
              <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping"></div>
            </div>
            <CardTitle className="text-3xl font-bold relative z-10 text-shadow">
              🛡️ لوحة الأمان العليا
            </CardTitle>
            <p className="text-red-100 text-sm relative z-10 font-medium">
              مراكز القيادة والمراقبة الأمنية المتقدمة
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
                  data-testid="input-admin-username"
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
                  data-testid="input-admin-email"
                />
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
                  data-testid="input-admin-password"
                />
              </div>

              {/* Location Tracker */}
              <LocationTracker 
                userType="admin"
                onLocationUpdate={(location) => {
                  console.log('Admin location updated:', location);
                }}
                autoStart={false}
              />

              <Button
                type="submit"
                disabled={loading || !credentials.username || !credentials.email || !credentials.password}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-lg font-semibold"
                data-testid="button-admin-login"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري التحقق...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    دخول آمن
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  🔒 جلسة آمنة مع تشفير متقدم
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
            في حالة واجهت مشاكل في الدخول، تواصل مع الإدارة التقنية
          </p>
        </div>
      </div>
    </div>
  );
}