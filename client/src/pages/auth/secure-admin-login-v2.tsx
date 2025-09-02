import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Shield, Lock, Mail, User, AlertTriangle } from 'lucide-react';

export default function SecureAdminLoginV2() {
  console.log('SecureAdminLoginV2 component loaded - RENDERED SUCCESSFULLY');
  
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
            timestamp: new Date().toISOString()
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "✅ تم تسجيل الدخول بنجاح",
          description: `مرحباً بك ${result.admin.fullName}`
        });
        
        localStorage.setItem('adminAuth', JSON.stringify({
          user: result.admin,
          token: result.token,
          loginTime: new Date().toISOString()
        }));
        
        setTimeout(() => {
          window.location.href = '/admin';
        }, 1500);
      } else {
        setError(result.message || 'فشل في تسجيل الدخول');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('خطأ في الاتصال. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-2 border-red-200">
          <CardHeader className="text-center space-y-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
            <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold">
              دخول المدير الآمن
            </CardTitle>
            <p className="text-red-100 text-sm">
              🔒 وصول محدود للإداريين المصرح لهم فقط
            </p>
          </CardHeader>

          <CardContent className="p-8">
            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 text-right">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="username" className="text-right flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  اسم المستخدم
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="أدخل اسم المستخدم"
                  className="text-right"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-right flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4" />
                  البريد الإلكتروني
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="أدخل البريد الإلكتروني"
                  className="text-right"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-right flex items-center gap-2 mb-2">
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
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !credentials.username || !credentials.email || !credentials.password}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-lg font-semibold"
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
      </div>
    </div>
  );
}