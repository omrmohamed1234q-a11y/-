import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, ExternalLink, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function PaymobSetupPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "تم النسخ",
      description: "تم نسخ النص للحافظة",
    });
  };

  const integrationSetup = [
    {
      id: 'valu',
      name: 'فاليو (valU)',
      description: 'دفع بالتقسيط حتى 60 شهر',
      envVar: 'PAYMOB_VALU_INTEGRATION_ID',
      status: 'active',
      featured: true
    },
    {
      id: 'card',
      name: 'البطاقات الائتمانية',
      description: 'فيزا وماستركارد',
      envVar: 'PAYMOB_CARD_INTEGRATION_ID',
      status: 'active'
    },
    {
      id: 'vodafone_cash',
      name: 'فودافون كاش',
      description: 'المحفظة الرقمية',
      envVar: 'PAYMOB_VODAFONE_INTEGRATION_ID',
      status: 'active'
    },
    {
      id: 'instapay',
      name: 'انستا باي',
      description: 'التحويل الفوري',
      envVar: 'PAYMOB_INSTAPAY_INTEGRATION_ID',
      status: 'active'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            إعداد Paymob Integration IDs
          </h1>
          <p className="text-gray-600">
            للحصول على أفضل تجربة دفع مع valU وطرق الدفع الأخرى
          </p>
        </div>

        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>مهم:</strong> النظام يستخدم حالياً Integration IDs تجريبية. لتفعيل valU وطرق الدفع الأخرى بشكل كامل، 
            يجب الحصول على Integration IDs الحقيقية من حساب Paymob الخاص بك.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                الحالة الحالية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-green-800">✅ التوثيق</span>
                  <Badge variant="default">يعمل</Badge>
                </div>
                <p className="text-sm text-green-700">
                  مفاتيح Paymob API صحيحة والتوثيق يعمل بنجاح
                </p>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-amber-800">⚠️ Integration IDs</span>
                  <Badge variant="secondary">تجريبية</Badge>
                </div>
                <p className="text-sm text-amber-700">
                  Integration IDs الحالية تجريبية - يجب استبدالها بالحقيقية
                </p>
              </div>

              <div className="space-y-2">
                {integrationSetup.map((method) => (
                  <div key={method.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{method.name}</span>
                      {method.featured && (
                        <Badge variant="default" className="text-xs bg-purple-600">مميز</Badge>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">متاح</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Setup Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-blue-600" />
                خطوات الإعداد
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">1. ادخل لوحة تحكم Paymob</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    سجل الدخول إلى حسابك في Paymob Dashboard
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-200"
                    onClick={() => window.open('https://portal.paymob.com', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 ml-2" />
                    فتح Paymob Portal
                  </Button>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">2. اذهب لقسم Integrations</h4>
                  <p className="text-sm text-blue-700">
                    ستجد قائمة بجميع طرق الدفع المفعلة وأرقام Integration IDs الخاصة بها
                  </p>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">3. انسخ Integration IDs</h4>
                  <p className="text-sm text-blue-700 mb-2">
                    لكل طريقة دفع، انسخ رقم Integration ID الخاص بها:
                  </p>
                  
                  <div className="space-y-2">
                    {integrationSetup.map((method) => (
                      <div key={method.id} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div>
                          <span className="text-xs font-medium">{method.name}</span>
                          {method.featured && <span className="text-purple-600 text-xs"> (مميز)</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {method.envVar}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => copyToClipboard(method.envVar, method.id)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">4. أضف المفاتيح للمشروع</h4>
                  <p className="text-sm text-green-700">
                    أضف Integration IDs كمتغيرات بيئة في مشروعك لتفعيل جميع طرق الدفع
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              ميزات valU المتقدمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-800 mb-2">دفع بالتقسيط</h4>
                <p className="text-sm text-purple-700">
                  إمكانية الدفع على أقساط تصل حتى 60 شهر
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-800 mb-2">موافقة فورية</h4>
                <p className="text-sm text-purple-700">
                  قبول أو رفض الطلب في ثوانٍ معدودة
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-medium text-purple-800 mb-2">بدون ضمانات</h4>
                <p className="text-sm text-purple-700">
                  لا يتطلب ضمانات أو كفيل للحصول على التمويل
                </p>
              </div>
            </div>
            
            <Alert className="mt-4 border-purple-200 bg-purple-50">
              <AlertCircle className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800">
                <strong>ملاحظة:</strong> valU متاح حالياً كخيار دفع في النظام. 
                بمجرد إضافة Integration ID الصحيح، ستعمل جميع ميزات valU بشكل كامل.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}