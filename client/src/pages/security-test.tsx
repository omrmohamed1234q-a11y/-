import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, User, Truck, Activity, Lock } from 'lucide-react';

export default function SecurityTest() {
  const [adminLogin, setAdminLogin] = useState({
    username: 'testadmin',
    email: 'admin@test.com',
    password: 'testpass123'
  });
  
  const [driverLogin, setDriverLogin] = useState({
    username: 'testdriver', 
    email: 'driver@test.com',
    password: 'driverpass123',
    driverCode: 'DR001'
  });

  const [loginResult, setLoginResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAdminLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminLogin)
      });
      const result = await response.json();
      setLoginResult({ type: 'admin', result, status: response.status });
    } catch (error) {
      setLoginResult({ type: 'admin', error: 'Network error', status: 500 });
    }
    setLoading(false);
  };

  const testDriverLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/driver-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(driverLogin)
      });
      const result = await response.json();
      setLoginResult({ type: 'driver', result, status: response.status });
    } catch (error) {
      setLoginResult({ type: 'driver', error: 'Network error', status: 500 });
    }
    setLoading(false);
  };

  const testSecureApis = async () => {
    setLoading(true);
    try {
      const [adminsResponse, driversResponse] = await Promise.all([
        fetch('/api/admin/secure-admins'),
        fetch('/api/admin/secure-drivers')
      ]);
      
      const admins = await adminsResponse.json();
      const drivers = await driversResponse.json();
      
      setLoginResult({ 
        type: 'apis', 
        result: { admins, drivers }, 
        status: adminsResponse.status 
      });
    } catch (error) {
      setLoginResult({ type: 'apis', error: 'Network error', status: 500 });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Shield className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">نظام الأمان المتقدم</h1>
          </div>
          <p className="text-lg text-gray-600">
            اختبار كامل لنظام الأمان الجديد مع مصادقة منفصلة للمدراء والسائقين
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            <Badge variant="secondary" className="gap-1">
              <Lock className="h-3 w-3" />
              مسارات مخفية
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <User className="h-3 w-3" />
              مصادقة متقدمة
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Activity className="h-3 w-3" />
              تتبع أمني
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Admin Login Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                اختبار تسجيل دخول المدير
              </CardTitle>
              <CardDescription>
                اختبار المصادقة للحسابات الإدارية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>اسم المستخدم</Label>
                <Input 
                  value={adminLogin.username}
                  onChange={(e) => setAdminLogin(prev => ({ ...prev, username: e.target.value }))}
                  data-testid="input-admin-username"
                />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input 
                  value={adminLogin.email}
                  onChange={(e) => setAdminLogin(prev => ({ ...prev, email: e.target.value }))}
                  data-testid="input-admin-email"
                />
              </div>
              <div className="space-y-2">
                <Label>كلمة المرور</Label>
                <Input 
                  type="password"
                  value={adminLogin.password}
                  onChange={(e) => setAdminLogin(prev => ({ ...prev, password: e.target.value }))}
                  data-testid="input-admin-password"
                />
              </div>
              <Button 
                onClick={testAdminLogin} 
                disabled={loading}
                className="w-full"
                data-testid="button-test-admin-login"
              >
                اختبار تسجيل دخول المدير
              </Button>
            </CardContent>
          </Card>

          {/* Driver Login Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-green-600" />
                اختبار تسجيل دخول السائق
              </CardTitle>
              <CardDescription>
                اختبار المصادقة للسائقين
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>اسم المستخدم</Label>
                <Input 
                  value={driverLogin.username}
                  onChange={(e) => setDriverLogin(prev => ({ ...prev, username: e.target.value }))}
                  data-testid="input-driver-username"
                />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input 
                  value={driverLogin.email}
                  onChange={(e) => setDriverLogin(prev => ({ ...prev, email: e.target.value }))}
                  data-testid="input-driver-email"
                />
              </div>
              <div className="space-y-2">
                <Label>كود السائق</Label>
                <Input 
                  value={driverLogin.driverCode}
                  onChange={(e) => setDriverLogin(prev => ({ ...prev, driverCode: e.target.value }))}
                  data-testid="input-driver-code"
                />
              </div>
              <div className="space-y-2">
                <Label>كلمة المرور</Label>
                <Input 
                  type="password"
                  value={driverLogin.password}
                  onChange={(e) => setDriverLogin(prev => ({ ...prev, password: e.target.value }))}
                  data-testid="input-driver-password"
                />
              </div>
              <Button 
                onClick={testDriverLogin} 
                disabled={loading}
                className="w-full"
                data-testid="button-test-driver-login"
              >
                اختبار تسجيل دخول السائق
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* API Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              اختبار APIs الآمنة
            </CardTitle>
            <CardDescription>
              اختبار الوصول إلى البيانات الآمنة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={testSecureApis} 
              disabled={loading}
              variant="outline"
              className="w-full"
              data-testid="button-test-secure-apis"
            >
              اختبار الوصول للبيانات الآمنة
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {loginResult && (
          <Card>
            <CardHeader>
              <CardTitle>نتائج الاختبار</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={loginResult.status === 200 ? "default" : "destructive"}>
                    {loginResult.status}
                  </Badge>
                  <span className="font-medium">
                    {loginResult.type === 'admin' ? 'مدير' : 
                     loginResult.type === 'driver' ? 'سائق' : 'APIs'}
                  </span>
                </div>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap" dir="ltr">
                  {JSON.stringify(loginResult.result || loginResult.error, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">معلومات النظام الأمني</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700 space-y-2">
            <p>🔐 <strong>مسارات الدخول الآمنة:</strong></p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li><code>/secure-admin-login</code> أو <code>/admin/secure-login</code> - للمدراء فقط</li>
              <li><code>/secure-driver-login</code> أو <code>/driver/secure-login</code> - للسائقين فقط</li>
            </ul>
            <p>👥 <strong>حسابات التجريب:</strong></p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>مدير: testadmin / admin@test.com / testpass123</li>
              <li>سائق: testdriver / driver@test.com / driverpass123 / DR001</li>
            </ul>
            <p>🔒 <strong>الميزات الأمنية:</strong></p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>تشفير كلمات المرور</li>
              <li>تتبع محاولات تسجيل الدخول</li>
              <li>سجل أمني شامل</li>
              <li>إدارة الحسابات المتقدمة</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}