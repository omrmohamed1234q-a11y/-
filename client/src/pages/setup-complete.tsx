import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, ExternalLink, Copy, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SetupComplete() {
  const [tablesCreated, setTablesCreated] = useState(false);
  const [testAccountsCreated, setTestAccountsCreated] = useState(false);
  const { toast } = useToast();

  const sqlCode = `-- Supabase Security Tables Setup
CREATE TABLE IF NOT EXISTS secure_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  permissions TEXT[] DEFAULT ARRAY['read', 'write'],
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  must_change_password BOOLEAN DEFAULT false,
  created_by UUID,
  ip_whitelist TEXT[],
  session_timeout INTEGER DEFAULT 900,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS secure_drivers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  driver_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  license_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  vehicle_plate TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'offline',
  last_login TIMESTAMP WITH TIME ZONE,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  total_deliveries INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 5.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_type TEXT NOT NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_secure_admins_username ON secure_admins(username);
CREATE INDEX IF NOT EXISTS idx_secure_admins_email ON secure_admins(email);
CREATE INDEX IF NOT EXISTS idx_secure_drivers_username ON secure_drivers(username);
CREATE INDEX IF NOT EXISTS idx_secure_drivers_email ON secure_drivers(email);
CREATE INDEX IF NOT EXISTS idx_secure_drivers_code ON secure_drivers(driver_code);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_type ON security_logs(user_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_action ON security_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "تم النسخ",
        description: "تم نسخ الكود إلى الحافظة",
      });
    } catch (err) {
      toast({
        title: "خطأ في النسخ",
        description: "فشل في نسخ الكود",
        variant: "destructive",
      });
    }
  };

  const testConnection = async () => {
    try {
      const response = await fetch('/api/test-security-tables');
      const result = await response.json();
      
      if (result.success) {
        setTablesCreated(true);
        setTestAccountsCreated(result.hasTestAccounts);
        toast({
          title: "نجح الاختبار",
          description: "الجداول موجودة وتعمل بشكل صحيح",
        });
      } else {
        toast({
          title: "الجداول غير موجودة",
          description: "يرجى إنشاء الجداول أولاً في Supabase",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الاتصال",
        description: "تعذر الاتصال بقاعدة البيانات",
        variant: "destructive",
      });
    }
  };

  const createTestAccounts = async () => {
    try {
      const response = await fetch('/api/create-test-accounts', {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        setTestAccountsCreated(true);
        toast({
          title: "تم إنشاء الحسابات",
          description: "تم إنشاء الحسابات التجريبية بنجاح",
        });
      } else {
        toast({
          title: "فشل في إنشاء الحسابات",
          description: result.error || "حدث خطأ غير معروف",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الشبكة",
        description: "تعذر إنشاء الحسابات التجريبية",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            إعداد نظام الأمان - اطبعلي
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            أكمل إعداد قاعدة البيانات والنظام الأمني
          </p>
        </div>

        {/* خطوة 1: إنشاء الجداول */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {tablesCreated ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              الخطوة 1: إنشاء الجداول في Supabase
            </CardTitle>
            <CardDescription>
              انسخ والصق الكود التالي في Supabase Dashboard &gt; SQL Editor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto max-h-96">
                <code>{sqlCode}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 left-2"
                onClick={() => copyToClipboard(sqlCode)}
                data-testid="button-copy-sql"
              >
                <Copy className="h-4 w-4 ml-1" />
                نسخ
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                data-testid="button-open-supabase"
              >
                <ExternalLink className="h-4 w-4 ml-1" />
                فتح Supabase Dashboard
              </Button>
              
              <Button
                onClick={testConnection}
                data-testid="button-test-connection"
              >
                اختبار الاتصال
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* خطوة 2: إنشاء الحسابات التجريبية */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testAccountsCreated ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              الخطوة 2: إنشاء الحسابات التجريبية
            </CardTitle>
            <CardDescription>
              إنشاء حسابات تجريبية للمدراء والسائقين
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={createTestAccounts}
              disabled={!tablesCreated}
              data-testid="button-create-accounts"
            >
              إنشاء الحسابات التجريبية
            </Button>
            
            {testAccountsCreated && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                  الحسابات التجريبية:
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>مدير:</strong> testadmin / admin@test.com / testpass123
                  </div>
                  <div>
                    <strong>سائق:</strong> testdriver / driver@test.com / driverpass123
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* خطوة 3: اختبار النظام */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              الخطوة 3: اختبار النظام
            </CardTitle>
            <CardDescription>
              اختبر تسجيل الدخول والنظام الأمني
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                onClick={() => window.open('/secure-admin-login', '_blank')}
                disabled={!testAccountsCreated}
                data-testid="button-test-admin-login"
              >
                اختبار دخول المدير
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.open('/secure-driver-login', '_blank')}
                disabled={!testAccountsCreated}
                data-testid="button-test-driver-login"
              >
                اختبار دخول السائق
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.open('/security-test', '_blank')}
                disabled={!testAccountsCreated}
                data-testid="button-test-security"
              >
                اختبار الأمان
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* حالة الإكمال */}
        {tablesCreated && testAccountsCreated && (
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                  تم إكمال الإعداد بنجاح!
                </h3>
                <p className="text-green-600 dark:text-green-400">
                  النظام الأمني جاهز للاستخدام
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}