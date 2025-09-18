import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PrivacyPolicy() {
  const [, navigate] = useLocation();

  // استدعاء سياسة الخصوصية الحالية من نظام الإدارة
  const { data: response, isLoading, error } = useQuery({
    queryKey: ['/api/privacy-policy/current'],
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const policy = response?.data;
  const isSuccess = response?.success && policy;

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* الهيدر */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة للبروفايل
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            سياسة الخصوصية
          </h1>
        </div>

        {/* حالة التحميل */}
        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">جاري تحميل سياسة الخصوصية...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* حالة الخطأ */}
        {error && !isLoading && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              حدث خطأ في تحميل سياسة الخصوصية. يرجى إعادة تحديث الصفحة.
            </AlertDescription>
          </Alert>
        )}

        {/* المحتوى الرئيسي - من نظام الإدارة */}
        {isSuccess && !isLoading && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="text-sm text-green-700 font-medium">محدث من نظام الإدارة</span>
              </div>
              <CardTitle className="text-2xl text-gray-900">
                {policy.title || 'سياسة الخصوصية'}
              </CardTitle>
              <div className="text-sm text-gray-600 space-y-1">
                <p>الإصدار: {policy.version || '1.0'}</p>
                <p>
                  آخر تحديث: {policy.effectiveDate ? 
                    new Date(policy.effectiveDate).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long', 
                      day: 'numeric'
                    }) : 'غير محدد'
                  }
                </p>
              </div>
            </CardHeader>

            <CardContent className="p-8 space-y-8">
              {/* جمع البيانات */}
              {policy.dataCollection && (
                <section className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 border-b-2 border-blue-200 pb-2">
                    📊 جمع البيانات
                  </h2>
                  <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-400">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {policy.dataCollection}
                    </p>
                  </div>
                </section>
              )}

              {/* استخدام البيانات */}
              {policy.dataUsage && (
                <section className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 border-b-2 border-green-200 pb-2">
                    🎯 استخدام البيانات
                  </h2>
                  <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {policy.dataUsage}
                    </p>
                  </div>
                </section>
              )}

              {/* مشاركة البيانات */}
              {policy.dataSharing && (
                <section className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 border-b-2 border-orange-200 pb-2">
                    🤝 مشاركة البيانات
                  </h2>
                  <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-400">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {policy.dataSharing}
                    </p>
                  </div>
                </section>
              )}

              {/* حقوق المستخدم */}
              {policy.userRights && (
                <section className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 border-b-2 border-purple-200 pb-2">
                    ⚖️ حقوق المستخدم
                  </h2>
                  <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-purple-400">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {policy.userRights}
                    </p>
                  </div>
                </section>
              )}

              {/* أمان البيانات */}
              {policy.dataSecurity && (
                <section className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 border-b-2 border-red-200 pb-2">
                    🔒 أمان البيانات
                  </h2>
                  <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-400">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {policy.dataSecurity}
                    </p>
                  </div>
                </section>
              )}

              {/* معلومات التواصل */}
              {policy.contactInfo && (
                <section className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-200 pb-2">
                    📞 التواصل معنا
                  </h2>
                  <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-gray-400">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {policy.contactInfo}
                    </p>
                  </div>
                </section>
              )}

              {/* محتوى عام (fallback) */}
              {policy.content && !policy.dataCollection && (
                <section className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 border-b-2 border-blue-200 pb-2">
                    📄 محتوى السياسة
                  </h2>
                  <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-400">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {policy.content}
                    </p>
                  </div>
                </section>
              )}
            </CardContent>

            {/* الموافقة */}
            <div className="border-t bg-gradient-to-r from-green-50 to-emerald-50 p-6">
              <div className="text-center space-y-4">
                <p className="text-gray-700 font-medium">
                  باستخدامك لمنصة "اطبعلي"، فإنك توافق على سياسة الخصوصية المذكورة أعلاه
                </p>
                <Button 
                  onClick={() => navigate('/profile')}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                  data-testid="button-accept-privacy"
                >
                  ✅ فهمت وأوافق على سياسة الخصوصية
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* حالة عدم وجود بيانات */}
        {!isSuccess && !isLoading && !error && (
          <Card>
            <CardContent className="text-center py-16">
              <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                لا توجد سياسة خصوصية متاحة
              </h3>
              <p className="text-gray-600 mb-6">
                لم يتم نشر أي سياسة خصوصية من نظام الإدارة بعد
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