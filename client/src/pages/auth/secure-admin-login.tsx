import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Shield, Lock, Mail, User, AlertTriangle } from 'lucide-react';

export default function SecureAdminLogin() {
  const [credentials, setCredentials] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: `مرحباً بك ${result.user.fullName}`
        });
        
        // Store admin session
        localStorage.setItem('adminAuth', JSON.stringify({
          user: result.user,
          loginTime: new Date().toISOString()
        }));
        
        // Redirect to admin dashboard
        window.location.href = '/admin';
      } else {
        setError(result.message || 'بيانات الدخول غير صحيحة');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        {/* Security Warning */}
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            هذه منطقة آمنة. يتم تسجيل جميع محاولات الدخول ومراقبتها.
          </AlertDescription>
        </Alert>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-4 bg-red-600 text-white rounded-t-lg">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl font-bold">
              دخول الإدارة المحمي
            </CardTitle>
            <p className="text-red-100 text-sm">
              صفحة دخول آمنة للإدارة العليا فقط
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