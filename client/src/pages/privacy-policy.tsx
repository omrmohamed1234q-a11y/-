import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Loader2, AlertTriangle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PrivacyPolicy() {
  const [, navigate] = useLocation();

  // جلب سياسة الخصوصية الحالية من نظام الإدارة
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['/api/privacy-policy/current'],
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const policy = response?.data;

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* الهيدر */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة للبروفايل
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            سياسة الخصوصية
          </h1>
        </div>

        {/* حالة التحميل */}
        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">جاري تحميل سياسة الخصوصية...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* حالة الخطأ */}
        {error && !isLoading && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              فشل في تحميل سياسة الخصوصية. يرجى المحاولة مرة أخرى.
            </AlertDescription>
          </Alert>
        )}

        {/* المحتوى من نظام الإدارة */}
        {policy && !isLoading && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{policy.title}</CardTitle>
              <p className="text-sm text-gray-600">
                الإصدار: {policy.version} • 
                آخر تحديث: {new Date(policy.effectiveDate).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              
              {/* جمع البيانات */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  جمع البيانات
                </h2>
                <div className="text-gray-700 space-y-3 whitespace-pre-wrap">
                  {policy.dataCollection}
                </div>
              </section>

              {/* استخدام البيانات */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  استخدام البيانات
                </h2>
                <div className="text-gray-700 space-y-3 whitespace-pre-wrap">
                  {policy.dataUsage}
                </div>
              </section>

              {/* مشاركة البيانات */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  مشاركة البيانات
                </h2>
                <div className="text-gray-700 space-y-3 whitespace-pre-wrap">
                  {policy.dataSharing}
                </div>
              </section>

              {/* حقوق المستخدم */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  حقوق المستخدم
                </h2>
                <div className="text-gray-700 space-y-3 whitespace-pre-wrap">
                  {policy.userRights}
                </div>
              </section>

              {/* أمان البيانات */}
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  الأمان والحماية
                </h2>
                <div className="text-gray-700 space-y-3 whitespace-pre-wrap">
                  {policy.dataSecurity}
                </div>
              </section>

              {/* معلومات التواصل */}
              <section className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  معلومات التواصل
                </h2>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-gray-700 space-y-2 whitespace-pre-wrap">
                    {policy.contactInfo}
                  </div>
                </div>
              </section>

              {/* الموافقة */}
              <div className="border-t pt-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-800 mb-4">
                    باستخدامك لمنصة "اطبعلي"، فإنك تؤكد قراءتك وفهمك وموافقتك على سياسة الخصوصية هذه.
                  </p>
                  <Button 
                    onClick={() => navigate('/profile')}
                    className="w-full sm:w-auto"
                  >
                    فهمت وأوافق على سياسة الخصوصية
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* حالة عدم وجود بيانات */}
        {!policy && !isLoading && !error && (
          <Card>
            <CardContent className="text-center py-12">
              <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                لا توجد سياسة خصوصية متاحة حالياً
              </h3>
              <p className="text-gray-600 mb-4">
                لم يتم نشر أي إصدار من سياسة الخصوصية بعد.
              </p>
              <Button 
                onClick={() => navigate('/profile')}
                variant="outline"
              >
                العودة للبروفايل
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}