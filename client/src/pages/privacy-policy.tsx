import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Eye, Lock, Database, UserCheck } from 'lucide-react';
import { useLocation } from 'wouter';

export default function PrivacyPolicy() {
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
              <Shield className="w-6 h-6" />
              سياسة الخصوصية
            </h1>
          </div>
        </div>

        {/* Privacy Policy Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">سياسة الخصوصية وحماية البيانات - منصة "اطبعلي"</CardTitle>
            <p className="text-sm text-gray-600">آخر تحديث: سبتمبر 2025</p>
          </CardHeader>
          <CardContent className="space-y-8">

            {/* Introduction */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                التزامنا بحماية خصوصيتك
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  في منصة "اطبعلي"، نؤمن بأن خصوصيتك حق أساسي. نلتزم بحماية معلوماتك الشخصية 
                  وضمان استخدامها بطريقة آمنة وشفافة.
                </p>
                <p>
                  هذه السياسة توضح كيف نجمع ونستخدم ونحمي بياناتك الشخصية عند استخدامك لخدماتنا.
                </p>
              </div>
            </section>

            {/* Data Collection */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5" />
                البيانات التي نجمعها
              </h2>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">البيانات الشخصية الأساسية</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>الاسم الكامل</li>
                    <li>عنوان البريد الإلكتروني</li>
                    <li>رقم الهاتف المحمول</li>
                    <li>العمر أو تاريخ الميلاد</li>
                    <li>المرحلة التعليمية (للطلاب)</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">بيانات التوصيل والعنوان</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>العنوان الكامل</li>
                    <li>تفاصيل الوصول والمعالم</li>
                    <li>الموقع الجغرافي (عند الطلب)</li>
                  </ul>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">بيانات الاستخدام والسلوك</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li>سجل الطلبات وتفضيلات الطباعة</li>
                    <li>نوع الجهاز ومعلومات المتصفح</li>
                    <li>إحصائيات الاستخدام (الصفحات المزارة)</li>
                    <li>تفاعلك مع الإشعارات والعروض</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Data Usage */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">كيف نستخدم بياناتك</h2>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p><strong>تقديم الخدمات:</strong> معالجة طلبات الطباعة والتوصيل</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <p><strong>التواصل:</strong> إرسال تحديثات الطلبات والإشعارات المهمة</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                  <div>
                    <p><strong>تحسين التجربة:</strong> تخصيص المحتوى وتطوير خدمات جديدة</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2"></div>
                  <div>
                    <p><strong>الأمان:</strong> منع الاحتيال وضمان أمان المنصة</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Protection */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                حماية البيانات والأمان
              </h2>
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">🔒 التشفير والحماية</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                    <li>تشفير جميع البيانات أثناء النقل والتخزين</li>
                    <li>خوادم آمنة محمية بأحدث تقنيات الأمان</li>
                    <li>مراقبة مستمرة لمنع التسريبات والاختراقات</li>
                    <li>نسخ احتياطية منتظمة ومشفرة</li>
                  </ul>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">⚠️ وصول البيانات</h3>
                  <p className="text-sm text-yellow-700">
                    فقط الموظفون المخولون يمكنهم الوصول لبياناتك، وذلك لضرورة العمل فقط.
                    جميع عمليات الوصول مُسجلة ومراقبة.
                  </p>
                </div>
              </div>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">مشاركة البيانات مع الأطراف الثالثة</h2>
              <div className="space-y-3 text-gray-700">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">✅ ما نفعله</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
                    <li>مشاركة معلومات التوصيل فقط مع السائقين المعتمدين</li>
                    <li>معالجة المدفوعات عبر شركاء الدفع الآمنين (مُشفرة)</li>
                    <li>استخدام خدمات التحليلات المجهولة لتحسين الأداء</li>
                  </ul>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">❌ ما لا نفعله أبداً</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                    <li>بيع أو تأجير بياناتك لأي جهة</li>
                    <li>مشاركة معلومات شخصية للتسويق الخارجي</li>
                    <li>الكشف عن هويتك دون موافقتك الصريحة</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* User Rights */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                حقوقك في التحكم بالبيانات
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">🔍 حق الوصول</h3>
                  <p className="text-sm text-gray-700">
                    يمكنك طلب نسخة من جميع بياناتك المحفوظة لدينا
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">✏️ حق التصحيح</h3>
                  <p className="text-sm text-gray-700">
                    تحديث أو تصحيح أي معلومات خاطئة في ملفك الشخصي
                  </p>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">🗑️ حق الحذف</h3>
                  <p className="text-sm text-gray-700">
                    حذف حسابك وجميع بياناتك نهائياً خلال 30 يوم
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">📥 حق النقل</h3>
                  <p className="text-sm text-gray-700">
                    تصدير بياناتك بصيغة قابلة للقراءة آلياً
                  </p>
                </div>
              </div>
            </section>

            {/* Cookies and Tracking */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">ملفات الارتباط والتتبع</h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  نستخدم ملفات الارتباط (cookies) لتحسين تجربتك وحفظ تفضيلاتك. 
                  يمكنك التحكم في هذه الإعدادات من متصفحك.
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">أنواع ملفات الارتباط المستخدمة:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li><strong>ضرورية:</strong> لعمل الموقع بشكل صحيح</li>
                    <li><strong>وظيفية:</strong> لحفظ تفضيلاتك وإعداداتك</li>
                    <li><strong>تحليلية:</strong> لفهم كيفية استخدامك للموقع (مجهولة)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">التواصل بخصوص الخصوصية</h2>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-3">
                  إذا كان لديك أي أسئلة حول سياسة الخصوصية أو ترغب في ممارسة أي من حقوقك:
                </p>
                <div className="space-y-2 text-sm text-gray-700">
                  <p><strong>البريد الإلكتروني:</strong> privacy@etba3li.com</p>
                  <p><strong>الهاتف:</strong> +20 10 1234 5678</p>
                  <p><strong>العنوان:</strong> قسم حماية البيانات، القاهرة، مصر</p>
                </div>
              </div>
            </section>

            {/* Acceptance Button */}
            <div className="border-t pt-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800 mb-4">
                  باستخدامك لمنصة "اطبعلي"، فإنك تؤكد قراءتك وفهمك وموافقتك على سياسة الخصوصية هذه.
                </p>
                <Button 
                  onClick={() => navigate('/profile')}
                  className="w-full sm:w-auto"
                  data-testid="button-accept-privacy"
                >
                  فهمت وأوافق على سياسة الخصوصية
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}