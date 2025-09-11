import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Shield, Eye, Lock, Database, Mail, CreditCard, UserCheck } from 'lucide-react';
import { Link } from 'wouter';

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'سياسة الخصوصية - منصة اطبعلي';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-full">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            سياسة الخصوصية
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
            <span>آخر تحديث: سبتمبر 2025</span>
            <span>•</span>
            <span>النسخة 1.0</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              العودة للصفحة الرئيسية
            </Button>
          </Link>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* مقدمة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <UserCheck className="w-6 h-6 text-blue-600" />
                مقدمة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <p className="leading-relaxed">
                في منصة "اطبعلي"، نحن ملتزمون بحماية خصوصية مستخدمينا. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية المعلومات الشخصية التي تقدمها لنا عند استخدام خدماتنا.
              </p>
              <p className="leading-relaxed">
                باستخدامك لمنصة "اطبعلي"، فإنك توافق على الممارسات الموضحة في هذه السياسة.
              </p>
            </CardContent>
          </Card>

          {/* البيانات التي نجمعها */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Database className="w-6 h-6 text-green-600" />
                البيانات التي نجمعها
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">المعلومات الشخصية</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• الاسم الكامل</li>
                  <li>• عنوان البريد الإلكتروني</li>
                  <li>• رقم الهاتف</li>
                  <li>• العنوان (للتوصيل)</li>
                  <li>• المرحلة التعليمية أو الصف الدراسي</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">معلومات الاستخدام</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• سجلات الطلبات والمعاملات</li>
                  <li>• الملفات المرفوعة للطباعة</li>
                  <li>• تفضيلات الطباعة</li>
                  <li>• نشاط التصفح على المنصة</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">المعلومات التقنية</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>• عنوان IP</li>
                  <li>• نوع المتصفح والجهاز</li>
                  <li>• موقعك الجغرافي التقريبي</li>
                  <li>• ملفات تعريف الارتباط (Cookies)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* كيف نستخدم بياناتك */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Eye className="w-6 h-6 text-purple-600" />
                كيف نستخدم بياناتك
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>تقديم خدمات الطباعة والتوصيل</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>معالجة الطلبات والمدفوعات</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>التواصل معك بخصوص طلباتك</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>تحسين خدماتنا وتطوير ميزات جديدة</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>إرسال إشعارات مهمة وتحديثات الخدمة</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>ضمان الأمان ومنع الاحتيال</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* حماية البيانات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-red-600" />
                حماية البيانات والأمان
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <p className="leading-relaxed">
                نتخذ إجراءات أمنية صارمة لحماية معلوماتك الشخصية من الوصول غير المصرح به أو الكشف أو التعديل أو التدمير.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <h4 className="font-semibold text-red-800 dark:text-red-300 mb-2">التشفير</h4>
                  <p className="text-sm">جميع البيانات محمية بتشفير SSL/TLS</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">التخزين الآمن</h4>
                  <p className="text-sm">بيانات مشفرة في خوادم آمنة</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">الوصول المحدود</h4>
                  <p className="text-sm">وصول مقيد للموظفين المصرح لهم فقط</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">المراقبة المستمرة</h4>
                  <p className="text-sm">مراقبة 24/7 للنشاطات المشبوهة</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* مشاركة البيانات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-orange-600" />
                مشاركة البيانات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <p className="leading-relaxed font-semibold text-orange-700 dark:text-orange-300">
                نحن لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة.
              </p>
              <p className="leading-relaxed">
                قد نشارك معلوماتك في الحالات التالية فقط:
              </p>
              <ul className="space-y-2">
                <li>• مع شركاء التوصيل لتنفيذ طلباتك</li>
                <li>• مع معالجات الدفع للمعاملات المالية</li>
                <li>• عند طلب السلطات القانونية المختصة</li>
                <li>• لحماية حقوقنا وسلامة المستخدمين</li>
              </ul>
            </CardContent>
          </Card>

          {/* حقوقك */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <UserCheck className="w-6 h-6 text-indigo-600" />
                حقوقك
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-3">يحق لك:</h4>
                  <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                    <li>• الوصول لبياناتك الشخصية</li>
                    <li>• تصحيح البيانات غير الدقيقة</li>
                    <li>• طلب حذف بياناتك</li>
                    <li>• نقل بياناتك لمنصة أخرى</li>
                    <li>• الاعتراض على معالجة بياناتك</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-indigo-800 dark:text-indigo-300 mb-3">كيفية ممارسة حقوقك:</h4>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    للحصول على أي من هذه الحقوق، يرجى التواصل معنا:
                  </p>
                  <div className="text-sm space-y-1">
                    <p>📧 البريد الإلكتروني: privacy@atbaali.com</p>
                    <p>📱 الهاتف: +20 123 456 789</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ملفات تعريف الارتباط */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-amber-600" />
                ملفات تعريف الارتباط (Cookies)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <p className="leading-relaxed">
                نستخدم ملفات تعريف الارتباط لتحسين تجربتك على منصتنا:
              </p>
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <h4 className="font-semibold text-amber-800 dark:text-amber-300">ملفات الجلسة</h4>
                  <p className="text-sm">للحفاظ على تسجيل دخولك أثناء التصفح</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300">ملفات التفضيلات</h4>
                  <p className="text-sm">لحفظ إعداداتك وتفضيلاتك</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-300">ملفات التحليل</h4>
                  <p className="text-sm">لفهم كيفية استخدام المنصة وتحسينها</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* تحديثات السياسة */}
          <Card>
            <CardHeader>
              <CardTitle>تحديثات هذه السياسة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
              <p className="leading-relaxed">
                قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنقوم بإشعارك بأي تغييرات جوهرية عبر:
              </p>
              <ul className="space-y-2">
                <li>• إشعار عبر البريد الإلكتروني</li>
                <li>• إشعار على المنصة</li>
                <li>• تحديث تاريخ "آخر تحديث" أعلى هذه الصفحة</li>
              </ul>
              <p className="leading-relaxed font-medium">
                استمرار استخدامك للمنصة بعد التحديثات يعني موافقتك على السياسة المحدثة.
              </p>
            </CardContent>
          </Card>

          {/* التواصل معنا */}
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <CardHeader>
              <CardTitle className="text-blue-800 dark:text-blue-300">
                التواصل معنا
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
                إذا كان لديك أي أسئلة أو استفسارات حول سياسة الخصوصية هذه، يرجى التواصل معنا:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2 text-blue-700 dark:text-blue-300">
                  <h4 className="font-semibold">معلومات التواصل:</h4>
                  <p>📧 privacy@atbaali.com</p>
                  <p>📱 +20 123 456 789</p>
                  <p>📍 القاهرة، مصر</p>
                </div>
                <div className="space-y-2 text-blue-700 dark:text-blue-300">
                  <h4 className="font-semibold">أوقات الرد:</h4>
                  <p>• الأيام العادية: خلال 24 ساعة</p>
                  <p>• الاستفسارات العاجلة: خلال 4 ساعات</p>
                  <p>• أيام العمل: السبت - الخميس</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* أزرار التنقل */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/terms-and-conditions">
              <Button variant="outline" className="w-full sm:w-auto">
                عرض الشروط والأحكام
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                إنشاء حساب جديد
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}