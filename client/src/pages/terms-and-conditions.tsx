import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText, Shield, CreditCard, Package, Clock, Loader2 } from 'lucide-react';
import { Link } from 'wouter';

export default function TermsAndConditions() {
  // Fetch current active terms from API
  const { data: termsData, isLoading, error } = useQuery({
    queryKey: ['/api/terms/current'],
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const terms = termsData?.data;

  useEffect(() => {
    document.title = `${terms?.title || 'الشروط والأحكام'} - منصة اطبعلي`;
  }, [terms?.title]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="mr-3 text-lg text-gray-600 dark:text-gray-300">
              جاري تحميل الشروط والأحكام...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="text-center py-12">
              <h2 className="text-xl font-semibold text-red-600 mb-4">
                خطأ في تحميل الشروط والأحكام
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                يرجى المحاولة مرة أخرى لاحقاً
              </p>
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="w-4 h-4 ml-2" />
                  العودة للصفحة الرئيسية
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-4">
            <ArrowLeft className="w-4 h-4" />
            العودة للصفحة الرئيسية
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            📋 {terms?.title || 'الشروط والأحكام'}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {terms?.summary || 'منصة اطبعلي - خدمات الطباعة والتعليم المتكاملة'}
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
            <span>آخر تحديث: {
              terms?.effectiveDate 
                ? new Date(terms.effectiveDate).toLocaleDateString('ar-EG', { 
                    year: 'numeric', 
                    month: 'long' 
                  })
                : 'سبتمبر 2025'
            }</span>
            <span>•</span>
            <span>الإصدار: {terms?.version || '2.0'}</span>
          </div>
        </div>

        {/* Quick Navigation */}
        <Card className="mb-8 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              فهرس المحتويات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <a href="#definitions" className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">1</span>
                التعريفات والبيانات
              </a>
              <a href="#acceptance" className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">2</span>
                قبول الشروط
              </a>
              <a href="#privacy" className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">3</span>
                حماية البيانات
              </a>
              <a href="#copyright" className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">4</span>
                حقوق الملكية الفكرية
              </a>
              <a href="#printing" className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">5</span>
                خدمات الطباعة
              </a>
              <a href="#refund" className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">7</span>
                سياسة الاسترداد
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Section 1: Definitions */}
        <Card id="definitions" className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              📌 1. التعريفات والبيانات الأساسية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">المنصة:</h4>
              <p className="text-gray-700 dark:text-gray-300">"اطبعلي" - منصة طباعة وخدمات تعليمية متكاملة</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">الجهة المشغلة:</h4>
              <p className="text-gray-700 dark:text-gray-300">[اسم الشركة]</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">البريد الإلكتروني:</h4>
              <p className="text-gray-700 dark:text-gray-300">support@etba3li.com</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🔤 تعريف المصطلحات:</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>المنصة:</strong> موقع وتطبيق "اطبعلي" الإلكتروني وجميع خدماته</li>
                <li><strong>المستخدم:</strong> أي شخص يستخدم المنصة (طالب، مدرس، ولي أمر)</li>
                <li><strong>خدمات الطباعة:</strong> جميع خدمات الطباعة والتغليف والتسليم المقدمة</li>
                <li><strong>المحتوى التعليمي:</strong> الكتب، المذكرات، الاختبارات، وجميع المواد التعليمية</li>
                <li><strong>الكبتن:</strong> سائق التوصيل المعتمد لدى المنصة</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Acceptance */}
        <Card id="acceptance" className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              ✅ 2. قبول الشروط والأهلية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">أ) الموافقة على الشروط</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>استخدام المنصة يعني موافقتك الكاملة على جميع الشروط والأحكام</li>
                <li>يحق للمنصة تعديل هذه الشروط مع إشعار مسبق 7 أيام عبر البريد الإلكتروني</li>
                <li><strong>يجب مراجعة الشروط دورياً</strong> حيث أن الاستمرار في الاستخدام يعني قبول التحديثات</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">ب) الأهلية القانونية</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>للطلاب أقل من 18 سنة:</strong> يجب الحصول على موافقة ولي الأمر</li>
                <li><strong>للمدرسين:</strong> يجب تقديم ما يثبت المؤهل التعليمي</li>
                <li><strong>لأولياء الأمور:</strong> المسؤولية الكاملة عن استخدام أطفالهم للمنصة</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Privacy */}
        <Card id="privacy" className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              3. حماية البيانات والخصوصية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">أ) البيانات المطلوبة</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>بيانات شخصية:</strong> الاسم، العمر، رقم الهاتف، البريد الإلكتروني</li>
                <li><strong>بيانات تعليمية:</strong> المرحلة الدراسية، المواد المفضلة (للطلاب)</li>
                <li><strong>بيانات التوصيل:</strong> العنوان الكامل، تفاصيل الوصول</li>
                <li><strong>بيانات الدفع:</strong> تُحفظ بشكل مشفر لدى مقدمي خدمات الدفع المعتمدين</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">ب) استخدام البيانات</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>الغرض الوحيد:</strong> تحسين خدمة الطباعة والتوصيل</li>
                <li><strong>لا نبيع بياناتك:</strong> تعهد بعدم بيع أو مشاركة البيانات مع أطراف خارجية</li>
                <li><strong>التسويق المباشر:</strong> فقط للعروض التعليمية والخصومات (يمكن إلغاء الاشتراك)</li>
                <li><strong>حماية أمنية:</strong> تشفير متقدم وأمان سيبراني على أعلى مستوى</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">ج) حقوق المستخدم</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>حق الوصول:</strong> يمكنك طلب نسخة من بياناتك المحفوظة</li>
                <li><strong>حق التصحيح:</strong> تعديل أي بيانات خاطئة فوراً</li>
                <li><strong>حق الحذف:</strong> حذف حسابك وجميع بياناتك نهائياً خلال 30 يوم</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Copyright */}
        <Card id="copyright" className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              📖 4. حقوق الملكية الفكرية والمحتوى التعليمي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-red-800 dark:text-red-300">⚠️ تحذير مهم</h4>
              <p className="text-red-700 dark:text-red-300">
                يمنع منعاً باتاً طباعة أي محتوى محمي بحقوق النشر دون إذن صريح من المالك
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">أ) المحتوى المحمي</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>مسؤولية المستخدم:</strong> التأكد من ملكية الحق في الطباعة قبل الرفع</li>
                <li><strong>استثناءات:</strong> المحتوى الشخصي، الملاحظات الذاتية، المواد المرخصة للطباعة</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">ب) محتوى المنصة</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>مواد اطبعلي:</strong> جميع النصوص، الصور، التصاميم ملك خاص للمنصة</li>
                <li><strong>استخدام المحتوى:</strong> للاستخدام الشخصي التعليمي فقط</li>
                <li><strong>منع النسخ:</strong> يمنع نسخ أو إعادة نشر محتوى المنصة</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Printing Services */}
        <Card id="printing" className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              5. خدمات الطباعة والجودة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">أ) مواصفات الطباعة</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <h5 className="font-medium mb-2">أحجام متاحة</h5>
                  <p className="text-sm">A4, A3, A0, A1, A2 حسب الطلب</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <h5 className="font-medium mb-2">جودة الطباعة</h5>
                  <p className="text-sm">300 DPI للمستندات، 600 DPI للصور</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <h5 className="font-medium mb-2">أنواع الورق</h5>
                  <p className="text-sm">ورق عادي، ورق فوتوغرافي، ورق مقوى</p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                  <h5 className="font-medium mb-2">خيارات اللون</h5>
                  <p className="text-sm">أبيض وأسود، ألوان كاملة</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">ب) ضمان الجودة</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>ضمان الجودة:</strong> إعادة طباعة مجانية في حالة عيوب الطباعة</li>
                <li><strong>فحص الجودة:</strong> مراجعة كل طلب قبل التسليم</li>
                <li><strong>شكاوى الجودة:</strong> استقبال الشكاوى خلال 24 ساعة من التسليم</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">ج) الملفات المرفوضة</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>ملفات تحتوي على محتوى مسيء أو غير أخلاقي</li>
                <li>ملفات محمية بحقوق النشر دون إذن</li>
                <li>ملفات تحتوي على معلومات شخصية حساسة لأطراف ثالثة</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Section 6: Delivery */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              🚚 6. التوصيل وسياسة الشحن
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h5 className="font-medium mb-1">الطلبات العادية</h5>
                <p className="text-sm">24-48 ساعة عمل</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg text-center">
                <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <h5 className="font-medium mb-1">الطلبات العاجلة</h5>
                <p className="text-sm">6-12 ساعة (رسوم إضافية)</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h5 className="font-medium mb-1">الطلبات الكبيرة</h5>
                <p className="text-sm">2-3 أيام عمل</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">مناطق التوصيل</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>التغطية الأساسية:</strong> محافظة السويس وضواحيها</li>
                <li><strong>مناطق إضافية:</strong> حسب التوفر مع رسوم شحن إضافية</li>
                <li><strong>أوقات التوصيل:</strong> من 8 صباحاً حتى 8 مساءً يومياً</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Section 7: Refund Policy - IMPORTANT */}
        <Card id="refund" className="mb-6 border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2 text-red-700 dark:text-red-300">
              <CreditCard className="w-5 h-5" />
              7. سياسة الاسترداد والإلغاء (مهم جداً)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg p-6">
              <h4 className="font-bold text-xl mb-4 text-red-800 dark:text-red-300 flex items-center gap-2">
                🚫 قواعد عدم الاسترداد (مهم جداً)
              </h4>
              <div className="bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700 rounded-lg p-4 mb-4">
                <p className="font-bold text-red-800 dark:text-red-300 text-lg mb-2">
                  ⚠️ تنبيه مهم: بمجرد إتمام عملية الدفع، لا يمكن:
                </p>
                <ul className="list-disc list-inside space-y-1 text-red-700 dark:text-red-300">
                  <li>إلغاء عملية الطباعة</li>
                  <li>إرجاع المواد المطبوعة</li>
                  <li>استرداد الأموال المدفوعة</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-green-700 dark:text-green-300">✅ الحالات الوحيدة لاسترداد الأموال:</h4>
              <div className="space-y-3">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h5 className="font-medium mb-2">1. عيوب الطباعة من المنصة فقط:</h5>
                  <ul className="list-disc list-inside space-y-1 text-sm text-green-700 dark:text-green-300">
                    <li>جودة طباعة ضعيفة (أقل من المعايير المحددة)</li>
                    <li>أخطاء في الألوان أو الوضوح</li>
                    <li>مشاكل في تقطيع الورق أو التجليد</li>
                    <li>تلف الطباعة بسبب أخطاء فنية في المطبعة</li>
                  </ul>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h5 className="font-medium mb-2">2. مشاكل فنية من المنصة:</h5>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-700 dark:text-blue-300">
                    <li>فشل في معالجة الملف بشكل صحيح</li>
                    <li>طباعة ملف خاطئ بسبب خطأ نظام</li>
                    <li>تلف الطلب أثناء النقل بمسؤولية المنصة</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2 text-red-700 dark:text-red-300">❌ لا يحق الاسترداد في الحالات التالية:</h4>
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li><strong>تغيير الرأي:</strong> "لم أعد أحتاج الطباعة"</li>
                <li><strong>أخطاء من العميل:</strong> ملف خاطئ، مواصفات خاطئة، عنوان خاطئ</li>
                <li><strong>جودة الملف الأصلي:</strong> إذا كان الملف المرفوع غير واضح أصلاً</li>
                <li><strong>عدم الاستلام:</strong> بسبب عدم تواجد العميل أو رقم هاتف خاطئ</li>
                <li><strong>استخدام الطباعة:</strong> بعد استلام واستخدام المواد المطبوعة</li>
              </ul>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                ⏱️ مهلة الشكوى
              </h4>
              <p className="text-orange-700 dark:text-orange-300">
                <strong>24 ساعة فقط</strong> من وقت الاستلام لأي شكاوى جودة
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                بعد 24 ساعة لا يحق المطالبة بأي استرداد
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 8: Contact */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              📞 8. التواصل والشكاوى
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold">خدمة العملاء:</h4>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li><strong>البريد الإلكتروني:</strong> support@etba3li.com</li>
                  <li><strong>الهاتف:</strong> [رقم الهاتف] (24/7)</li>
                  <li><strong>الدردشة المباشرة:</strong> متاحة على الموقع والتطبيق</li>
                  <li><strong>مدة الرد:</strong> خلال ساعتين في أوقات العمل</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold">الشكاوى والاقتراحات:</h4>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li><strong>نموذج الشكاوى:</strong> متاح على المنصة</li>
                  <li><strong>تصعيد الشكاوى:</strong> إدارة المنصة خلال 24 ساعة</li>
                  <li><strong>متابعة الشكوى:</strong> تحديثات دورية حتى الحل النهائي</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Final Notice */}
        <Card className="mb-8 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-lg font-medium text-blue-800 dark:text-blue-300 mb-2">
                ✅ بالضغط على "أوافق" أو استخدام المنصة، أنت تؤكد قراءتك وفهمك وموافقتك على جميع الشروط والأحكام المذكورة أعلاه.
              </p>
              <div className="flex items-center justify-center gap-4 mt-4 text-sm text-blue-600 dark:text-blue-400">
                <span>📧 للاستفسارات: support@etba3li.com</span>
                <span>•</span>
                <span>🌐 الموقع: www.etba3li.com</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Back to Home Button */}
        <div className="text-center">
          <Link href="/">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3">
              <ArrowLeft className="w-4 h-4 mr-2" />
              العودة للصفحة الرئيسية
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}