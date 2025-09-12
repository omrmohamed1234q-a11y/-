import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Eye, Lock, Database, Users, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'wouter';

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'سياسة الخصوصية - منصة اطبعلي';
  }, []);

  // Fetch current active privacy policy from admin management system
  const { 
    data: privacyResponse, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/privacy-policy/current'],
    retry: 3,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  }) as { data: any, isLoading: boolean, error: any };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">جارِ تحميل سياسة الخصوصية...</p>
        </div>
      </div>
    );
  }

  if (error || !privacyResponse?.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <CardContent className="flex items-center gap-4 py-8">
              <AlertCircle className="w-12 h-12 text-red-600" />
              <div>
                <h2 className="text-xl font-semibold text-red-800 dark:text-red-300 mb-2">
                  لم يتم العثور على سياسة خصوصية نشطة
                </h2>
                <p className="text-red-700 dark:text-red-400 mb-4">
                  عذراً، لا توجد سياسة خصوصية نشطة حالياً. يرجى المحاولة مرة أخرى لاحقاً.
                </p>
                <div className="flex gap-4">
                  <Link href="/">
                    <Button variant="outline">العودة للصفحة الرئيسية</Button>
                  </Link>
                  <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const policy = privacyResponse?.data;

  // Content sections configuration with icons
  const contentSections = [
    { 
      key: 'dataCollection', 
      title: 'جمع البيانات', 
      icon: Database,
      color: 'green'
    },
    { 
      key: 'dataUsage', 
      title: 'استخدام البيانات', 
      icon: Eye,
      color: 'purple'
    },
    { 
      key: 'dataSharing', 
      title: 'مشاركة البيانات', 
      icon: Users,
      color: 'orange'
    },
    { 
      key: 'userRights', 
      title: 'حقوق المستخدم', 
      icon: CheckCircle,
      color: 'indigo'
    },
    { 
      key: 'dataSecurity', 
      title: 'الأمان والحماية', 
      icon: Lock,
      color: 'red'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-full">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {policy.title}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
            <span>
              آخر تحديث: {policy.effectiveDate ? new Date(policy.effectiveDate).toLocaleDateString('ar-EG', { 
                year: 'numeric', 
                month: 'long',
                day: 'numeric'
              }) : 'غير محدد'}
            </span>
            <span>•</span>
            <span>النسخة {policy.version}</span>
            {policy.isActive && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  نشط
                </span>
              </>
            )}
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

        {/* Content Sections - Only from Admin Management */}
        <div className="space-y-8">
          {contentSections.map(({ key, title, icon: IconComponent, color }) => {
            const content = policy[key];
            
            if (!content) return null;
            
            const colorClasses = {
              green: 'text-green-600',
              purple: 'text-purple-600', 
              orange: 'text-orange-600',
              indigo: 'text-indigo-600',
              red: 'text-red-600'
            };

            return (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <IconComponent className={`w-6 h-6 ${colorClasses[color as keyof typeof colorClasses]}`} />
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {content}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Contact Information - Always show if exists */}
          {policy.contactInfo && (
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
              <CardHeader>
                <CardTitle className="text-blue-800 dark:text-blue-300 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  التواصل معنا
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-700 dark:text-blue-300 leading-relaxed mb-4">
                  إذا كان لديك أي أسئلة أو استفسارات حول سياسة الخصوصية هذه، يرجى التواصل معنا:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2 text-blue-700 dark:text-blue-300">
                    <h4 className="font-semibold">معلومات التواصل:</h4>
                    <div className="whitespace-pre-line">
                      {policy.contactInfo}
                    </div>
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
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
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