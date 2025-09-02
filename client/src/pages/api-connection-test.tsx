import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, RefreshCw, Database, Key, Link } from 'lucide-react';

interface TestResult {
  success: boolean;
  data: any;
  status: number;
}

const ApiConnectionTest = () => {
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const testEndpoint = async (endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) => {
    setLoading(endpoint);
    try {
      const response = await fetch(`/api/${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      
      const data = await response.json();
      setResults((prev: Record<string, TestResult>) => ({
        ...prev,
        [endpoint]: {
          success: response.ok,
          data,
          status: response.status
        }
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResults((prev: Record<string, TestResult>) => ({
        ...prev,
        [endpoint]: {
          success: false,
          data: { error: errorMessage },
          status: 500
        }
      }));
    } finally {
      setLoading(null);
    }
  };

  const testAll = async () => {
    await testEndpoint('test-connection');
    await testEndpoint('test-setup');
    await testEndpoint('create-test-accounts', 'POST');
  };

  const createTestAccounts = async () => {
    await testEndpoint('create-test-accounts', 'POST');
  };

  const TestResult = ({ endpoint }: { endpoint: string }) => {
    const result = results[endpoint];
    if (!result) return null;

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              /api/{endpoint}
            </CardTitle>
            <Badge variant={result.success ? "default" : "destructive"}>
              {result.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm font-medium">
              {result.success ? 'نجح الاتصال' : 'فشل الاتصال'}
            </span>
          </div>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">اختبار اتصال API</h1>
        <p className="text-gray-600">
          اختبر جميع endpoints الخاصة بالنظام الأمني ونظام Supabase
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                اختبارات API
              </CardTitle>
              <CardDescription>
                اختبر جميع endpoints النظام
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testAll} 
                disabled={loading !== null}
                className="w-full"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Link className="h-4 w-4 mr-2" />
                )}
                اختبار جميع الاتصالات
              </Button>

              <div className="grid grid-cols-1 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => testEndpoint('test-connection')}
                  disabled={loading !== null}
                  size="sm"
                >
                  اختبار الاتصال العام
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => testEndpoint('supabase-info')}
                  disabled={loading !== null}
                  size="sm"
                >
                  فحص معلومات Supabase
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => testEndpoint('auto-create-tables-direct', 'POST')}
                  disabled={loading !== null}
                  size="sm"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  🚀 إنشاء الجداول مباشرة
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => testEndpoint('auto-create-tables', 'POST')}
                  disabled={loading !== null}
                  size="sm"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  إنشاء الجداول (بديل)
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={createTestAccounts}
                  disabled={loading !== null}
                  size="sm"
                >
                  إنشاء حسابات تجريبية
                </Button>
              </div>
            </CardContent>
          </Card>

          <Alert className="mt-4">
            <Key className="h-4 w-4" />
            <AlertDescription>
              <strong>ملاحظة مهمة:</strong> إذا ظهرت رسالة "Security tables do not exist"، 
              تحتاج لإنشاء الجداول في Supabase Dashboard أولاً باستخدام الملف 
              <code className="bg-gray-100 px-1 rounded">supabase-schema.sql</code>
            </AlertDescription>
          </Alert>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">نتائج الاختبارات</h3>
          <TestResult endpoint="test-connection" />
          <TestResult endpoint="supabase-info" />
          <TestResult endpoint="auto-create-tables-direct" />
          <TestResult endpoint="auto-create-tables" />
          <TestResult endpoint="create-test-accounts" />
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>خطوات إصلاح المشاكل</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. إنشاء جداول Supabase (طريقتان):</h4>
              <div className="bg-green-50 p-3 rounded mb-2 border border-green-200">
                <p className="font-medium text-green-800">🚀 الطريقة الأفضل (مولد SQL):</p>
                <p className="text-sm text-green-700 mb-2">استخدم مولد الكود الجاهز</p>
                <Button 
                  size="sm" 
                  onClick={() => window.open('/sql-generator', '_blank')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  فتح مولد SQL
                </Button>
              </div>
              <div className="bg-blue-50 p-3 rounded mb-2">
                <p className="font-medium text-blue-800">⚡ تجربة التنفيذ التلقائي:</p>
                <p className="text-sm text-blue-700">اضغط "إنشاء الجداول مباشرة" أعلاه (قد لا يعمل مع جميع إعدادات Supabase)</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium text-gray-800">📝 الطريقة اليدوية:</p>
                <ul className="list-disc list-inside text-sm space-y-1 mr-4 text-gray-700">
                  <li>اذهب إلى Supabase Dashboard</li>
                  <li>انتقل إلى SQL Editor</li>
                  <li>انسخ والصق محتوى ملف <code>supabase-schema.sql</code></li>
                  <li>اضغط "Run" لتنفيذ الكود</li>
                </ul>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">2. إنشاء الحسابات التجريبية:</h4>
              <ul className="list-disc list-inside text-sm space-y-1 mr-4">
                <li>بعد إنشاء الجداول، اضغط "إنشاء حسابات تجريبية"</li>
                <li>أو شغّل الأمر: <code>node setup-supabase.cjs</code></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">3. اختبار تسجيل الدخول:</h4>
              <ul className="list-disc list-inside text-sm space-y-1 mr-4">
                <li>مدير: <code>/secure-admin-login</code> (testadmin / testpass123)</li>
                <li>سائق: <code>/secure-driver-login</code> (testdriver / driverpass123 / DR001)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>أدوات مساعدة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline"
              onClick={() => window.open('/sql-generator', '_blank')}
              className="flex items-center gap-2 justify-start h-auto p-4"
            >
              <div className="text-left">
                <div className="font-medium">مولد SQL</div>
                <div className="text-sm text-gray-600">احصل على كود SQL جاهز</div>
              </div>
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.open('/connectivity', '_blank')}
              className="flex items-center gap-2 justify-start h-auto p-4"
            >
              <div className="text-left">
                <div className="font-medium">لوحة المراقبة</div>
                <div className="text-sm text-gray-600">راقب حالة الاتصالات</div>
              </div>
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              className="flex items-center gap-2 justify-start h-auto p-4"
            >
              <div className="text-left">
                <div className="font-medium">Supabase Dashboard</div>
                <div className="text-sm text-gray-600">إدارة قاعدة البيانات</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiConnectionTest;