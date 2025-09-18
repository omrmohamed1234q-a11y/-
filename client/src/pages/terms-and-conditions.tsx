import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Shield, Users, AlertTriangle, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TermsAndConditions() {
  const [, navigate] = useLocation();

  // Fetch current active terms from admin system with fallback to static content
  const { data: termsResponse, isLoading, error } = useQuery({
    queryKey: ['/api/terms/current'],
    staleTime: 0, // Always fetch fresh data for immediate updates
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const currentTerms = termsResponse?.data;
  const hasApiTerms = currentTerms && termsResponse?.success;

  // Static fallback content when no terms are published via admin
  const staticTermsContent = `شروط وأحكام استخدام منصة "اطبعلي"

مرحباً بك في منصة "اطبعلي"

نرحب بك في منصة "اطبعلي" للخدمات الطباعية والتعليمية. باستخدامك لخدماتنا، فإنك توافق على الالتزام بهذه الشروط والأحكام.

تهدف منصتنا إلى توفير خدمات طباعة عالية الجودة ومواد تعليمية للطلاب والمعلمين في جميع أنحاء الوطن العربي.

مسؤوليات المستخدم:
• تقديم معلومات صحيحة ومحدثة عند التسجيل
• الحفاظ على سرية بيانات الحساب وكلمة المرور
• عدم استخدام المنصة لأي أغراض غير قانونية
• احترام حقوق الملكية الفكرية للمحتوى المطبوع
• عدم تحميل محتوى مسيء أو مخالف للآداب العامة

وصف الخدمات:
• خدمات الطباعة: نوفر خدمات طباعة للوثائق والمواد التعليمية بجودة عالية
• المسح الضوئي الذكي: تقنية OCR لتحويل النصوص إلى ملفات قابلة للتحرير
• متجر المواد التعليمية: منصة لبيع وشراء المواد التعليمية والكتب
• نظام التوصيل: خدمة توصيل سريعة وموثوقة للمنتجات المطبوعة

شروط الدفع:
• الأسعار مدرجة بالجنيه المصري وشاملة الضرائب
• نقبل الدفع بالبطاقات الائتمانية والدفع عند التسليم
• يتم خصم المبلغ عند تأكيد الطلب
• في حالة الإلغاء، يتم رد المبلغ خلال 5-7 أيام عمل

الخصوصية وحماية البيانات:
نحن ملتزمون بحماية خصوصيتك وبياناتك الشخصية. نجمع ونستخدم المعلومات فقط لتقديم خدماتنا وتحسين تجربتك.

لا نشارك بياناتك مع أطراف ثالثة إلا للضرورة القصوى وبموافقتك المسبقة. يمكنك الاطلاع على تفاصيل أكثر في سياسة الخصوصية.

الملكية الفكرية:
جميع المحتويات الموجودة على المنصة محمية بحقوق الطبع والنشر. المستخدم مسؤول عن التأكد من حقوق الطباعة للمواد التي يرغب في طباعتها.

يُمنع نسخ أو إعادة توزيع أي محتوى من المنصة دون إذن كتابي مسبق.

إخلاء المسؤولية:
لا نتحمل مسؤولية أي أضرار مباشرة أو غير مباشرة قد تنتج عن استخدام المنصة، ونبذل قصارى جهدنا لضمان دقة المعلومات وجودة الخدمات.

المستخدم مسؤول عن التحقق من دقة ومشروعية المحتوى قبل الطباعة.

معلومات الاتصال:
البريد الإلكتروني: support@etba3li.com
الهاتف: +20 10 1234 5678
العنوان: القاهرة، مصر`;

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
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
              <FileText className="w-6 h-6" />
              الشروط والأحكام
            </h1>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">جاري تحميل الشروط والأحكام...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Terms Content - Dynamic from Admin or Static Fallback */}
        {!isLoading && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {hasApiTerms ? currentTerms.title : 'شروط وأحكام استخدام منصة "اطبعلي"'}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {hasApiTerms ? (
                  `الإصدار: ${currentTerms.version} • آخر تحديث: ${(() => {
                    if (!currentTerms.effectiveDate) return 'غير محدد';
                    try {
                      const date = new Date(currentTerms.effectiveDate);
                      if (!Number.isFinite(date.getTime())) return 'تاريخ غير صالح';
                      return date.toLocaleDateString('ar-EG', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });
                    } catch {
                      return 'تاريخ غير صالح';
                    }
                  })()}`
                ) : (
                  'آخر تحديث: سبتمبر 2025'
                )}
              </p>
              {!hasApiTerms && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">
                    عذراً، لم يتم نشر شروط وأحكام محدثة بعد. يتم عرض النسخة الافتراضية حالياً.
                  </AlertDescription>
                </Alert>
              )}
            </CardHeader>
            <CardContent className="space-y-8">
              
              {/* Main Content */}
              <div className="prose prose-slate max-w-none text-gray-700">
                <div className="space-y-4 whitespace-pre-wrap">
                  {hasApiTerms ? currentTerms.content : staticTermsContent}
                </div>
              </div>

              {/* Acceptance Button */}
              <div className="border-t pt-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 mb-4">
                    باستخدامك لمنصة "اطبعلي"، فإنك تؤكد قراءتك وفهمك وموافقتك على جميع الشروط والأحكام المذكورة أعلاه.
                  </p>
                  <Button 
                    onClick={() => navigate('/profile')}
                    className="w-full sm:w-auto"
                    data-testid="button-accept-terms"
                  >
                    فهمت وأوافق على الشروط والأحكام
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}