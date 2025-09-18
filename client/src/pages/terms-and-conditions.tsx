import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Shield, Users, AlertTriangle } from 'lucide-react';
import { useLocation } from 'wouter';

export default function TermsAndConditions() {
  const [, navigate] = useLocation();

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

        {/* Terms Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">شروط وأحكام استخدام منصة "اطبعلي"</CardTitle>
            <p className="text-sm text-gray-600">آخر تحديث: سبتمبر 2025</p>
          </CardHeader>
          <CardContent className="space-y-8">
            
            {/* Introduction */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                مرحباً بك في منصة "اطبعلي"
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  نرحب بك في منصة "اطبعلي" للخدمات الطباعية والتعليمية. باستخدامك لخدماتنا، 
                  فإنك توافق على الالتزام بهذه الشروط والأحكام.
                </p>
                <p>
                  تهدف منصتنا إلى توفير خدمات طباعة عالية الجودة ومواد تعليمية للطلاب والمعلمين 
                  في جميع أنحاء الوطن العربي.
                </p>
              </div>
            </section>

            {/* User Responsibilities */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">مسؤوليات المستخدم</h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc list-inside space-y-2">
                  <li>تقديم معلومات صحيحة ومحدثة عند التسجيل</li>
                  <li>الحفاظ على سرية بيانات الحساب وكلمة المرور</li>
                  <li>عدم استخدام المنصة لأي أغراض غير قانونية</li>
                  <li>احترام حقوق الملكية الفكرية للمحتوى المطبوع</li>
                  <li>عدم تحميل محتوى مسيء أو مخالف للآداب العامة</li>
                </ul>
              </div>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">وصف الخدمات</h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>خدمات الطباعة:</strong> نوفر خدمات طباعة للوثائق والمواد التعليمية بجودة عالية</p>
                <p><strong>المسح الضوئي الذكي:</strong> تقنية OCR لتحويل النصوص إلى ملفات قابلة للتحرير</p>
                <p><strong>متجر المواد التعليمية:</strong> منصة لبيع وشراء المواد التعليمية والكتب</p>
                <p><strong>نظام التوصيل:</strong> خدمة توصيل سريعة وموثوقة للمنتجات المطبوعة</p>
              </div>
            </section>

            {/* Payment Terms */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">شروط الدفع</h2>
              <div className="space-y-3 text-gray-700">
                <ul className="list-disc list-inside space-y-2">
                  <li>الأسعار مدرجة بالجنيه المصري وشاملة الضرائب</li>
                  <li>نقبل الدفع بالبطاقات الائتمانية والدفع عند التسليم</li>
                  <li>يتم خصم المبلغ عند تأكيد الطلب</li>
                  <li>في حالة الإلغاء، يتم رد المبلغ خلال 5-7 أيام عمل</li>
                </ul>
              </div>
            </section>

            {/* Privacy and Data */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                الخصوصية وحماية البيانات
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  نحن ملتزمون بحماية خصوصيتك وبياناتك الشخصية. نجمع ونستخدم المعلومات 
                  فقط لتقديم خدماتنا وتحسين تجربتك.
                </p>
                <p>
                  لا نشارك بياناتك مع أطراف ثالثة إلا للضرورة القصوى وبموافقتك المسبقة.
                  يمكنك الاطلاع على تفاصيل أكثر في سياسة الخصوصية.
                </p>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">الملكية الفكرية</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  جميع المحتويات الموجودة على المنصة محمية بحقوق الطبع والنشر. 
                  المستخدم مسؤول عن التأكد من حقوق الطباعة للمواد التي يرغب في طباعتها.
                </p>
                <p>
                  يُمنع نسخ أو إعادة توزيع أي محتوى من المنصة دون إذن كتابي مسبق.
                </p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                إخلاء المسؤولية
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  لا نتحمل مسؤولية أي أضرار مباشرة أو غير مباشرة قد تنتج عن استخدام المنصة، 
                  ونبذل قصارى جهدنا لضمان دقة المعلومات وجودة الخدمات.
                </p>
                <p>
                  المستخدم مسؤول عن التحقق من دقة ومشروعية المحتوى قبل الطباعة.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات الاتصال</h2>
              <div className="space-y-2 text-gray-700">
                <p><strong>البريد الإلكتروني:</strong> support@etba3li.com</p>
                <p><strong>الهاتف:</strong> +20 10 1234 5678</p>
                <p><strong>العنوان:</strong> القاهرة، مصر</p>
              </div>
            </section>

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
      </div>
    </div>
  );
}