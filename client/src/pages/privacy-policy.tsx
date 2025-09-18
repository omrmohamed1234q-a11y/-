import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Eye, Lock, Database, UserCheck, Loader2, AlertTriangle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function PrivacyPolicy() {
  const [, navigate] = useLocation();

  // Fetch current active privacy policy from the admin management system
  const { data: policyResponse, isLoading, error } = useQuery({
    queryKey: ['/api/privacy-policy/current'],
    staleTime: 0, // Always fetch fresh data for immediate updates
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const currentPolicy = policyResponse?.data;

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

        {/* Loading State */}
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

        {/* Error State */}
        {error && !isLoading && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              فشل في تحميل سياسة الخصوصية. يرجى المحاولة مرة أخرى.
            </AlertDescription>
          </Alert>
        )}

        {/* Privacy Policy Content - Dynamic from Admin System */}
        {currentPolicy && !isLoading && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{currentPolicy.title}</CardTitle>
              <p className="text-sm text-gray-600">
                الإصدار: {currentPolicy.version} • 
                آخر تحديث: {(() => {
                  if (!currentPolicy.effectiveDate) return 'غير محدد';
                  try {
                    const date = new Date(currentPolicy.effectiveDate);
                    if (!Number.isFinite(date.getTime())) return 'تاريخ غير صالح';
                    return date.toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });
                  } catch {
                    return 'تاريخ غير صالح';
                  }
                })()}
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              
              {/* Check if policy has segmented fields or single content */}
              {currentPolicy.dataCollection ? (
                <>
                  {/* Data Collection Section */}
                  <section>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      جمع البيانات
                    </h2>
                    <div className="text-gray-700 space-y-3 whitespace-pre-wrap">
                      {currentPolicy.dataCollection}
                    </div>
                  </section>

                  {/* Data Usage Section */}
                  {currentPolicy.dataUsage && (
                    <section>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        استخدام البيانات
                      </h2>
                      <div className="text-gray-700 space-y-3 whitespace-pre-wrap">
                        {currentPolicy.dataUsage}
                      </div>
                    </section>
                  )}

                  {/* Data Sharing Section */}
                  {currentPolicy.dataSharing && (
                    <section>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">مشاركة البيانات</h2>
                      <div className="text-gray-700 space-y-3 whitespace-pre-wrap">
                        {currentPolicy.dataSharing}
                      </div>
                    </section>
                  )}

                  {/* User Rights Section */}
                  {currentPolicy.userRights && (
                    <section>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <UserCheck className="w-5 h-5" />
                        حقوق المستخدم
                      </h2>
                      <div className="text-gray-700 space-y-3 whitespace-pre-wrap">
                        {currentPolicy.userRights}
                      </div>
                    </section>
                  )}

                  {/* Data Security Section */}
                  {currentPolicy.dataSecurity && (
                    <section>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        الأمان وحماية البيانات
                      </h2>
                      <div className="text-gray-700 space-y-3 whitespace-pre-wrap">
                        {currentPolicy.dataSecurity}
                      </div>
                    </section>
                  )}

                  {/* Contact Information Section */}
                  {currentPolicy.contactInfo && (
                    <section className="border-t pt-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">معلومات التواصل</h2>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-gray-700 space-y-2 whitespace-pre-wrap">
                          {currentPolicy.contactInfo}
                        </div>
                      </div>
                    </section>
                  )}
                </>
              ) : currentPolicy.content ? (
                // Fallback: single content field (like terms)
                <section>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    محتوى سياسة الخصوصية
                  </h2>
                  <div className="text-gray-700 space-y-3 whitespace-pre-wrap">
                    {currentPolicy.content}
                  </div>
                </section>
              ) : (
                // No content available
                <section>
                  <div className="text-center py-8 text-gray-500">
                    لا يوجد محتوى متاح في سياسة الخصوصية.
                  </div>
                </section>
              )}

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
        )}

        {/* No Policy Found */}
        {!currentPolicy && !isLoading && !error && (
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