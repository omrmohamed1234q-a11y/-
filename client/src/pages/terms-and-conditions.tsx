import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Shield, Users, AlertTriangle, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TermsAndConditions() {
  const [, navigate] = useLocation();

  // Fetch current active terms from the admin management system
  const { data: termsResponse, isLoading, error } = useQuery({
    queryKey: ['/api/terms/current'],
    staleTime: 0, // Always fetch fresh data for immediate updates
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const currentTerms = termsResponse?.data;

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

        {/* Error State */}
        {error && !isLoading && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              فشل في تحميل الشروط والأحكام. يرجى المحاولة مرة أخرى.
            </AlertDescription>
          </Alert>
        )}

        {/* Terms Content - Dynamic from Admin System */}
        {currentTerms && !isLoading && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{currentTerms.title}</CardTitle>
              <p className="text-sm text-gray-600">
                الإصدار: {currentTerms.version} • 
                آخر تحديث: {(() => {
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
                })()}
              </p>
              {currentTerms.summary && (
                <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                  {currentTerms.summary}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-8">
              
              {/* Main Content */}
              <div className="prose prose-slate max-w-none text-gray-700">
                <div className="space-y-4 whitespace-pre-wrap">
                  {currentTerms.content || 'لا يوجد محتوى متاح.'}
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

        {/* No Terms Found */}
        {!currentTerms && !isLoading && !error && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                لا توجد شروط وأحكام متاحة حالياً
              </h3>
              <p className="text-gray-600 mb-4">
                لم يتم نشر أي إصدار من الشروط والأحكام بعد.
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