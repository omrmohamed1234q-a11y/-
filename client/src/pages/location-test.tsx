import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, AlertCircle, Check } from 'lucide-react';

const LocationTest = () => {
  const [location, setLocation] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const testLocation = () => {
    setLoading(true);
    setError('');
    setLocation(null);

    if (!navigator.geolocation) {
      setError('المتصفح لا يدعم تحديد المواقع');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toLocaleString('ar-EG')
        });
        setLoading(false);
      },
      (error) => {
        let errorMessage = '';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'تم رفض إذن الموقع من المستخدم';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'معلومات الموقع غير متاحة';
            break;
          case error.TIMEOUT:
            errorMessage = 'انتهت مهلة تحديد الموقع';
            break;
          default:
            errorMessage = 'خطأ غير معروف في تحديد الموقع';
            break;
        }
        setError(`${errorMessage} (كود: ${error.code})`);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-6" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">اختبار الموقع الجغرافي</h1>
          <p className="text-blue-700">تأكد من عمل نظام تحديد الموقع في التطبيق</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              اختبار الموقع الجغرافي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testLocation}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  جاري تحديد الموقع...
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  طلب إذن الموقع
                </>
              )}
            </Button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800">خطأ في تحديد الموقع</p>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                    <div className="mt-3 space-y-2 text-sm text-red-700">
                      <p className="font-medium">💡 حلول مقترحة:</p>
                      <ul className="list-disc list-inside space-y-1 mr-4">
                        <li>تأكد من السماح للموقع بالوصول للموقع الجغرافي</li>
                        <li>اضغط على أيقونة القفل في شريط العنوان</li>
                        <li>أعد تحميل الصفحة بعد تغيير الأذونات</li>
                        <li>تأكد من تفعيل GPS في جهازك</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {location && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-800">✅ تم تحديد الموقع بنجاح!</p>
                    <div className="mt-3 space-y-2 text-sm text-green-700">
                      <p><strong>خط العرض:</strong> {location.latitude.toFixed(6)}</p>
                      <p><strong>خط الطول:</strong> {location.longitude.toFixed(6)}</p>
                      <p><strong>دقة التحديد:</strong> ±{Math.round(location.accuracy)} متر</p>
                      <p><strong>وقت التحديد:</strong> {location.timestamp}</p>
                    </div>
                    <div className="mt-3">
                      <Button
                        onClick={() => {
                          const mapsUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
                          window.open(mapsUrl, '_blank');
                        }}
                        variant="outline"
                        className="border-green-300 text-green-700 hover:bg-green-50"
                      >
                        🗺️ عرض في الخرائط
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>معلومات تقنية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>حالة الأمان:</strong> {window.isSecureContext ? '🔒 آمن (HTTPS)' : '⚠️ غير آمن'}</p>
            <p><strong>البروتوكول:</strong> {window.location.protocol}</p>
            <p><strong>الخادم:</strong> {window.location.host}</p>
            <p><strong>دعم الموقع:</strong> {navigator.geolocation ? '✅ مدعوم' : '❌ غير مدعوم'}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LocationTest;