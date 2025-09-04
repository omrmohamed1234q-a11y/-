import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PaymobTestPage() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testPaymobConnection = async () => {
    setTesting(true);
    setResult(null);

    try {
      const response = await fetch('/api/payments/paymob/test');
      const data = await response.json();
      
      setResult({
        success: data.success,
        message: data.message,
        error: data.error,
        code: data.code,
        hasToken: data.hasToken,
        tokenLength: data.tokenLength
      });

      if (data.success) {
        toast({
          title: "✅ نجح الاختبار",
          description: "Paymob يعمل بشكل صحيح",
        });
      } else {
        toast({
          title: "❌ فشل الاختبار",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: 'خطأ في الشبكة أو الخادم',
        message: error.message
      });
      
      toast({
        title: "خطأ في الاتصال",
        description: "فشل في الاتصال بالخادم",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            اختبار اتصال Paymob
          </h1>
          <p className="text-gray-600">
            تحقق من حالة اتصال API Paymob ومفاتيح التشفير
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              اختبار الاتصال
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testPaymobConnection}
              disabled={testing}
              className="w-full"
              size="lg"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الاختبار...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 ml-2" />
                  اختبار Paymob الآن
                </>
              )}
            </Button>

            {result && (
              <div className="mt-6">
                <div className={`p-4 rounded-lg border ${
                  result.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <Badge 
                      variant={result.success ? "default" : "destructive"}
                      className="text-sm"
                    >
                      {result.success ? 'نجح' : 'فشل'}
                    </Badge>
                  </div>

                  {result.success ? (
                    <div className="space-y-2">
                      <p className="text-green-800 font-medium">
                        ✅ Paymob يعمل بشكل صحيح
                      </p>
                      <div className="text-sm text-green-700">
                        <p>• تم التحقق من صحة المفاتيح</p>
                        <p>• تم الحصول على token بنجاح</p>
                        {result.tokenLength && (
                          <p>• طول Token: {result.tokenLength} حرف</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-red-800 font-medium">
                        ❌ فشل في اتصال Paymob
                      </p>
                      <div className="text-sm text-red-700">
                        <p className="font-medium">الخطأ:</p>
                        <p className="bg-red-100 p-2 rounded text-xs font-mono">
                          {result.error}
                        </p>
                        {result.code === 'AUTH_FAILED' && (
                          <div className="mt-2 p-2 bg-yellow-100 rounded">
                            <p className="text-amber-800 font-medium">
                              💡 حل المشكلة:
                            </p>
                            <ul className="text-amber-700 text-xs mt-1 space-y-1">
                              <li>• تحقق من PAYMOB_API_KEY</li>
                              <li>• تأكد من صحة المفاتيح في لوحة Paymob</li>
                              <li>• تحقق من انتهاء صلاحية المفاتيح</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">
                معلومات المفاتيح المطلوبة:
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• PAYMOB_API_KEY - مفتاح API الرئيسي</li>
                <li>• PAYMOB_PUBLIC_KEY - المفتاح العام</li>
                <li>• PAYMOB_SECRET_KEY - المفتاح السري</li>
                <li>• PAYMOB_HMAC - مفتاح HMAC للتحقق</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}