import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Upload,
  Cloud,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Settings,
  HardDrive,
  Zap,
  AlertTriangle
} from 'lucide-react';

interface ServiceStatus {
  cloudinary: {
    configured: boolean;
    cloudName: string;
  };
  googleDrive: {
    configured: boolean;
    status: string;
  };
}

interface TestResults {
  cloudinary: {
    success: boolean;
    message?: string;
    error?: string;
  };
  googleDrive: {
    success: boolean;
    error?: string;
  };
}

export default function GoogleDriveTest() {
  const [testingInProgress, setTestingInProgress] = useState(false);
  const { toast } = useToast();

  const { data: serviceStatus, isLoading: statusLoading, refetch: refetchStatus } = useQuery<{
    success: boolean;
    services: ServiceStatus;
  }>({
    queryKey: ['/api/services/upload/status']
  });

  const { data: testResults, refetch: refetchTests } = useQuery<{
    success: boolean;
    tests: TestResults;
  }>({
    queryKey: ['/api/services/upload/test'],
    enabled: false // Only run when manually triggered
  });

  const testGoogleDriveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('GET', '/api/services/googledrive/test');
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? 'نجح الاتصال' : 'فشل الاتصال',
        description: data.success ? 'تم الاتصال بـ Google Drive بنجاح' : data.error,
        variant: data.success ? 'default' : 'destructive'
      });
    }
  });

  const runAllTests = async () => {
    setTestingInProgress(true);
    try {
      await refetchTests();
      toast({
        title: 'تم اختبار الخدمات',
        description: 'تم اختبار جميع خدمات التخزين'
      });
    } catch (error) {
      toast({
        title: 'خطأ في الاختبار',
        description: 'فشل في اختبار الخدمات',
        variant: 'destructive'
      });
    } finally {
      setTestingInProgress(false);
    }
  };

  if (statusLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const cloudinaryStatus = serviceStatus?.services?.cloudinary;
  const googleDriveStatus = serviceStatus?.services?.googleDrive;

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">اختبار Google Drive Integration</h1>
        <Button
          onClick={() => refetchStatus()}
          variant="outline"
          size="sm"
          disabled={statusLoading}
        >
          <RefreshCw className={`w-4 h-4 ml-2 ${statusLoading ? 'animate-spin' : ''}`} />
          تحديث الحالة
        </Button>
      </div>

      {/* Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cloudinary Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Cloud className="w-5 h-5 text-blue-500" />
              <span>حالة Cloudinary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>الحالة:</span>
              <Badge variant={cloudinaryStatus?.configured ? 'default' : 'secondary'}>
                {cloudinaryStatus?.configured ? (
                  <CheckCircle2 className="w-4 h-4 ml-1" />
                ) : (
                  <XCircle className="w-4 h-4 ml-1" />
                )}
                {cloudinaryStatus?.configured ? 'مكوّن' : 'غير مكوّن'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Cloud Name:</span>
              <span className="text-sm font-mono">
                {cloudinaryStatus?.cloudName || 'غير محدد'}
              </span>
            </div>
            {testResults?.tests?.cloudinary && (
              <Alert className={testResults.tests.cloudinary.success ? 'border-green-200' : 'border-red-200'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>نتيجة الاختبار:</strong> {testResults.tests.cloudinary.success ? '✅ نجح' : '❌ فشل'}
                  {testResults.tests.cloudinary.error && (
                    <div className="text-sm mt-1 text-red-600">
                      {testResults.tests.cloudinary.error}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Google Drive Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <HardDrive className="w-5 h-5 text-green-500" />
              <span>حالة Google Drive</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>الحالة:</span>
              <Badge variant={googleDriveStatus?.configured ? 'default' : 'secondary'}>
                {googleDriveStatus?.configured ? (
                  <CheckCircle2 className="w-4 h-4 ml-1" />
                ) : (
                  <XCircle className="w-4 h-4 ml-1" />
                )}
                {googleDriveStatus?.configured ? 'مكوّن' : 'غير مكوّن'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>الحالة التفصيلية:</span>
              <span className="text-sm">{googleDriveStatus?.status || 'غير معروف'}</span>
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <Button
                size="sm"
                variant="outline"
                onClick={() => testGoogleDriveMutation.mutate()}
                disabled={testGoogleDriveMutation.isPending}
              >
                {testGoogleDriveMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 ml-1 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 ml-1" />
                )}
                اختبار الاتصال
              </Button>
            </div>
            {testResults?.tests?.googleDrive && (
              <Alert className={testResults.tests.googleDrive.success ? 'border-green-200' : 'border-red-200'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>نتيجة الاختبار:</strong> {testResults.tests.googleDrive.success ? '✅ نجح' : '❌ فشل'}
                  {testResults.tests.googleDrive.error && (
                    <div className="text-sm mt-1 text-red-600">
                      {testResults.tests.googleDrive.error}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test All Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Settings className="w-5 h-5" />
            <span>اختبار جميع الخدمات</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              اختبر الاتصال بجميع خدمات التخزين (Cloudinary & Google Drive) للتأكد من عملها بشكل صحيح.
            </p>
            <Button
              onClick={runAllTests}
              disabled={testingInProgress}
              className="w-full"
            >
              {testingInProgress ? (
                <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 ml-2" />
              )}
              {testingInProgress ? 'جاري الاختبار...' : 'اختبار جميع الخدمات'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>تعليمات التكوين</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">متطلبات Google Drive:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 mr-4">
                <li>• GOOGLE_CLIENT_ID - معرف العميل من Google Console</li>
                <li>• GOOGLE_CLIENT_SECRET - سر العميل من Google Console</li>
                <li>• GOOGLE_REFRESH_TOKEN - رمز التحديث من OAuth</li>
                <li>• GOOGLE_REDIRECT_URI - رابط إعادة التوجيه (اختياري)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">متطلبات Cloudinary:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 mr-4">
                <li>• CLOUDINARY_CLOUD_NAME - اسم السحابة</li>
                <li>• CLOUDINARY_API_KEY - مفتاح API</li>
                <li>• CLOUDINARY_API_SECRET - سر API</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}