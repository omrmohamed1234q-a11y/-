import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useWebSocket } from '@/hooks/use-websocket';
import { 
  Navigation, 
  MapPin, 
  Truck, 
  Play, 
  Square, 
  Clock, 
  Signal,
  AlertCircle,
  CheckCircle,
  RefreshCcw
} from 'lucide-react';

interface LocationData {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

interface DriverLocationControllerProps {
  driverId?: string;
  orderId?: string;
  driverName?: string;
  onLocationUpdate?: (location: LocationData) => void;
}

export default function DriverLocationController({
  driverId = 'driver-001',
  orderId,
  driverName = 'الكابتن',
  onLocationUpdate
}: DriverLocationControllerProps) {
  const { state, updateDriverLocation } = useWebSocket();
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [shareLocation, setShareLocation] = useState(true);

  // إحصائيات GPS
  const [gpsStats, setGpsStats] = useState({
    totalUpdates: 0,
    lastUpdate: null as Date | null,
    averageAccuracy: 0,
    currentSpeed: 0
  });

  // بدء تتبع الموقع
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('خدمة تحديد الموقع غير مدعومة في هذا المتصفح');
      return;
    }

    setLocationError(null);
    
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000
    };

    const successCallback = (position: GeolocationPosition) => {
      const locationData: LocationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: Date.now(),
        accuracy: position.coords.accuracy,
        speed: position.coords.speed || 0,
        heading: position.coords.heading || 0
      };

      setCurrentLocation(locationData);
      
      // إضافة للتاريخ
      setLocationHistory(prev => {
        const newHistory = [...prev, locationData].slice(-10); // احتفظ بآخر 10 مواقع
        return newHistory;
      });

      // تحديث الإحصائيات
      setGpsStats(prev => ({
        totalUpdates: prev.totalUpdates + 1,
        lastUpdate: new Date(),
        averageAccuracy: (prev.averageAccuracy + (locationData.accuracy || 0)) / 2,
        currentSpeed: Math.round((locationData.speed || 0) * 3.6) // تحويل إلى كم/س
      }));

      // إرسال الموقع عبر WebSocket إذا كان مشاركة الموقع مفعلة
      if (shareLocation && state.isConnected) {
        updateDriverLocation(locationData.lat, locationData.lng, orderId);
      }

      // استدعاء callback إذا كان متاحاً
      if (onLocationUpdate) {
        onLocationUpdate(locationData);
      }

      console.log('📍 Driver location updated:', locationData);
    };

    const errorCallback = (error: GeolocationPositionError) => {
      let errorMessage = 'خطأ في تحديد الموقع';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'تم رفض الإذن للوصول إلى الموقع';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'معلومات الموقع غير متاحة';
          break;
        case error.TIMEOUT:
          errorMessage = 'انتهت مهلة طلب الموقع';
          break;
      }
      
      setLocationError(errorMessage);
      console.error('❌ Geolocation error:', error);
    };

    // بدء المراقبة المستمرة
    const id = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      options
    );

    setWatchId(id);
    setIsTracking(true);
  }, [shareLocation, state.isConnected, updateDriverLocation, orderId, onLocationUpdate]);

  // إيقاف تتبع الموقع
  const stopLocationTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    setLocationError(null);
  }, [watchId]);

  // الحصول على موقع واحد
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('خدمة تحديد الموقع غير مدعومة');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData: LocationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || 0,
          heading: position.coords.heading || 0
        };

        setCurrentLocation(locationData);
        
        if (shareLocation && state.isConnected) {
          updateDriverLocation(locationData.lat, locationData.lng, orderId);
        }

        console.log('📍 Current location fetched:', locationData);
      },
      (error) => {
        setLocationError(`خطأ في الحصول على الموقع: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, [shareLocation, state.isConnected, updateDriverLocation, orderId]);

  // تنظيف عند إلغاء التحميل
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, [stopLocationTracking]);

  // تنسيق الوقت
  const formatTime = (date: Date | null) => {
    if (!date) return 'غير محدد';
    return date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* معلومات الكابتن */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Truck className="h-5 w-5 text-blue-500" />
            {driverName} - لوحة التحكم في الموقع
          </CardTitle>
          {orderId && (
            <p className="text-sm text-gray-600">طلب رقم: {orderId}</p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* حالة الاتصال */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              {state.isConnected ? (
                <Signal className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <div>
                <p className={`font-medium ${state.isConnected ? 'text-green-800' : 'text-red-800'}`}>
                  {state.isConnected ? 'متصل بالنظام المباشر' : 'منقطع عن النظام'}
                </p>
                <p className="text-xs text-gray-600">
                  {state.isConnected 
                    ? 'سيتم إرسال مواقعك للعملاء فوراً' 
                    : 'لن يتلقى العملاء تحديثات المواقع'
                  }
                </p>
              </div>
            </div>
            
            <Badge variant={state.isConnected ? "default" : "destructive"}>
              {state.isConnected ? 'نشط' : 'منقطع'}
            </Badge>
          </div>

          {/* عناصر التحكم في التتبع */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                <span className="font-medium">مشاركة الموقع</span>
              </div>
              <Switch
                checked={shareLocation}
                onCheckedChange={setShareLocation}
                disabled={!state.isConnected}
              />
            </div>

            <div className="flex gap-2">
              {!isTracking ? (
                <>
                  <Button
                    onClick={startLocationTracking}
                    disabled={!shareLocation || !state.isConnected}
                    className="flex-1"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    بدء التتبع المستمر
                  </Button>
                  <Button
                    onClick={getCurrentLocation}
                    variant="outline"
                    disabled={!shareLocation || !state.isConnected}
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    موقع واحد
                  </Button>
                </>
              ) : (
                <Button
                  onClick={stopLocationTracking}
                  variant="destructive"
                  className="w-full"
                >
                  <Square className="h-4 w-4 mr-2" />
                  إيقاف التتبع
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* الموقع الحالي */}
          {currentLocation && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">الموقع الحالي</span>
                </div>
                {isTracking && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-green-600">مباشر</span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">خط العرض</p>
                  <p className="font-mono text-green-800">{currentLocation.lat.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-gray-600">خط الطول</p>
                  <p className="font-mono text-green-800">{currentLocation.lng.toFixed(6)}</p>
                </div>
                
                {currentLocation.accuracy && (
                  <div>
                    <p className="text-gray-600">دقة GPS</p>
                    <p className="text-green-800">{Math.round(currentLocation.accuracy)} متر</p>
                  </div>
                )}
                
                {gpsStats.currentSpeed > 0 && (
                  <div>
                    <p className="text-gray-600">السرعة</p>
                    <p className="text-green-800">{gpsStats.currentSpeed} كم/س</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* رسالة الخطأ */}
          {locationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-red-800 text-sm">{locationError}</span>
              </div>
            </div>
          )}

          {/* إحصائيات GPS */}
          {gpsStats.totalUpdates > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">إحصائيات التتبع</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-blue-600">عدد التحديثات</p>
                  <p className="font-medium text-blue-800">{gpsStats.totalUpdates}</p>
                </div>
                <div>
                  <p className="text-blue-600">آخر تحديث</p>
                  <p className="font-medium text-blue-800">{formatTime(gpsStats.lastUpdate)}</p>
                </div>
                <div>
                  <p className="text-blue-600">متوسط الدقة</p>
                  <p className="font-medium text-blue-800">{Math.round(gpsStats.averageAccuracy)} متر</p>
                </div>
                <div>
                  <p className="text-blue-600">المواقع المحفوظة</p>
                  <p className="font-medium text-blue-800">{locationHistory.length}/10</p>
                </div>
              </div>
            </div>
          )}

          {/* تعليمات */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-xs text-yellow-800">
                <p className="font-medium mb-1">نصائح مهمة:</p>
                <ul className="space-y-0.5">
                  <li>• تأكد من تفعيل GPS وإعطاء الإذن للموقع</li>
                  <li>• التتبع المستمر يستهلك البطارية أكثر</li>
                  <li>• في حالة انقطاع الإنترنت، سيتم إرسال المواقع عند عودة الاتصال</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}