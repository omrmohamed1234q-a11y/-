import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useWebSocket } from '@/hooks/use-websocket';
import GoogleMap from '@/components/GoogleMap';
import LiveOrderTracking from '@/components/LiveOrderTracking';
import { MapPin, Navigation, Truck, Play, Square, RotateCcw } from 'lucide-react';

export default function MapsTest() {
  const { state, updateDriverLocation } = useWebSocket();
  const [testMode, setTestMode] = useState<'map' | 'tracking'>('map');
  const [customerLocation] = useState({
    lat: 30.0444, // القاهرة
    lng: 31.2357
  });
  const [driverLocation, setDriverLocation] = useState({
    lat: 30.0644,  // موقع قريب من العميل
    lng: 31.2457,
    timestamp: Date.now()
  });
  const [deliveryLocation] = useState({
    lat: 30.0344,  // وجهة التوصيل
    lng: 31.2257
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationInterval, setSimulationInterval] = useState<NodeJS.Timeout | null>(null);

  // محاكاة حركة الكابتن
  const startDriverSimulation = () => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
    }

    setIsSimulating(true);
    
    const interval = setInterval(() => {
      setDriverLocation(prev => {
        // حركة عشوائية نحو وجهة التوصيل
        const newLat = prev.lat + (Math.random() - 0.5) * 0.002;
        const newLng = prev.lng + (Math.random() - 0.5) * 0.002;
        
        const newLocation = {
          lat: newLat,
          lng: newLng,
          timestamp: Date.now(),
          speed: Math.random() * 50 + 20, // سرعة عشوائية بين 20-70 كم/س
          heading: Math.random() * 360    // اتجاه عشوائي
        };

        // إرسال الموقع عبر WebSocket
        updateDriverLocation(newLocation.lat, newLocation.lng, 'ORDER-123456');
        
        return newLocation;
      });
    }, 3000); // كل 3 ثوان

    setSimulationInterval(interval);
  };

  const stopDriverSimulation = () => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      setSimulationInterval(null);
    }
    setIsSimulating(false);
  };

  const resetDriverLocation = () => {
    stopDriverSimulation();
    setDriverLocation({
      lat: 30.0644,
      lng: 31.2457,
      timestamp: Date.now()
    });
  };

  // مواقع اختبار مختلفة
  const testLocations = [
    {
      name: 'القاهرة - وسط البلد',
      customer: { lat: 30.0444, lng: 31.2357 },
      driver: { lat: 30.0544, lng: 31.2457 },
      delivery: { lat: 30.0344, lng: 31.2257 }
    },
    {
      name: 'الجيزة - المهندسين',
      customer: { lat: 30.0626, lng: 31.2097 },
      driver: { lat: 30.0726, lng: 31.2197 },
      delivery: { lat: 30.0526, lng: 31.1997 }
    },
    {
      name: 'الإسكندرية - المنتزه',
      customer: { lat: 31.2001, lng: 29.9187 },
      driver: { lat: 31.2101, lng: 29.9287 },
      delivery: { lat: 31.1901, lng: 29.9087 }
    }
  ];

  const handleDriverLocationUpdate = (newLocation: any) => {
    console.log('📍 Manual driver location update:', newLocation);
    setDriverLocation({
      ...newLocation,
      timestamp: Date.now()
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-blue-500" />
              اختبار Google Maps والتتبع المباشر
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Badge variant={state.isConnected ? "default" : "destructive"}>
                {state.isConnected ? 'WebSocket متصل' : 'WebSocket منقطع'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* أوضاع الاختبار */}
          <div className="flex gap-2">
            <Button
              variant={testMode === 'map' ? 'default' : 'outline'}
              onClick={() => setTestMode('map')}
              size="sm"
            >
              <MapPin className="h-4 w-4 mr-2" />
              خريطة بسيطة
            </Button>
            <Button
              variant={testMode === 'tracking' ? 'default' : 'outline'}
              onClick={() => setTestMode('tracking')}
              size="sm"
            >
              <Navigation className="h-4 w-4 mr-2" />
              تتبع مباشر
            </Button>
          </div>

          {/* عناصر التحكم في المحاكاة */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Truck className="h-5 w-5 text-blue-500" />
            <span className="font-medium">محاكاة حركة الكابتن:</span>
            
            <div className="flex gap-2">
              {!isSimulating ? (
                <Button
                  size="sm"
                  onClick={startDriverSimulation}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-3 w-3 mr-2" />
                  بدء المحاكاة
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={stopDriverSimulation}
                >
                  <Square className="h-3 w-3 mr-2" />
                  إيقاف المحاكاة
                </Button>
              )}
              
              <Button
                size="sm"
                variant="outline"
                onClick={resetDriverLocation}
              >
                <RotateCcw className="h-3 w-3 mr-2" />
                إعادة تعيين
              </Button>
            </div>

            {isSimulating && (
              <Badge className="bg-green-100 text-green-800">
                المحاكاة نشطة
              </Badge>
            )}
          </div>

          <Separator />

          {/* معلومات المواقع الحالية */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <p className="font-medium text-blue-800 mb-1">موقع العميل</p>
              <p className="text-blue-600">{customerLocation.lat.toFixed(4)}, {customerLocation.lng.toFixed(4)}</p>
            </div>
            
            <div className="bg-red-50 p-3 rounded border border-red-200">
              <p className="font-medium text-red-800 mb-1">موقع الكابتن</p>
              <p className="text-red-600">{driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}</p>
              {driverLocation.speed && (
                <p className="text-xs text-red-500 mt-1">
                  السرعة: {Math.round(driverLocation.speed)} كم/س
                </p>
              )}
            </div>
            
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <p className="font-medium text-green-800 mb-1">وجهة التوصيل</p>
              <p className="text-green-600">{deliveryLocation.lat.toFixed(4)}, {deliveryLocation.lng.toFixed(4)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* المحتوى حسب الوضع المختار */}
      {testMode === 'map' ? (
        <GoogleMap
          customerLocation={customerLocation}
          driverLocation={{
            ...driverLocation,
            driverName: 'أحمد محمد (كابتن تجريبي)',
            driverId: 'driver-test-123'
          }}
          orderDestination={deliveryLocation}
          onDriverLocationUpdate={handleDriverLocationUpdate}
          isDriverMode={false}
          height="500px"
          zoom={13}
        />
      ) : (
        <LiveOrderTracking
          orderId="ORDER-123456"
          initialOrderData={{
            id: 'ORDER-123456',
            status: 'out_for_delivery',
            statusText: 'في الطريق إليك',
            driverName: 'أحمد محمد',
            driverPhone: '+20123456789',
            deliveryAddress: 'شارع التحرير، وسط البلد، القاهرة'
          }}
          customerLocation={customerLocation}
          deliveryLocation={deliveryLocation}
        />
      )}

      {/* إرشادات الاستخدام */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">إرشادات الاختبار</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2 text-blue-800">🗺️ الخريطة البسيطة:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• عرض المواقع الثابتة للعميل والكابتن والوجهة</li>
                <li>• رسم المسار بين الكابتن والوجهة</li>
                <li>• إمكانية بدء تتبع GPS للكباتن</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 text-green-800">📍 التتبع المباشر:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• واجهة كاملة لتتبع الطلب</li>
                <li>• تحديثات مباشرة عبر WebSocket</li>
                <li>• حساب وقت الوصول المتوقع</li>
                <li>• عرض مراحل الطلب مع التقدم</li>
              </ul>
            </div>
          </div>

          <Separator />

          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
            <p className="text-yellow-800 font-medium mb-1">💡 نصائح:</p>
            <ul className="text-yellow-700 text-xs space-y-1">
              <li>• اضغط "بدء المحاكاة" لرؤية حركة الكابتن المباشرة</li>
              <li>• في الوضع التجريبي، الخريطة تستخدم مفتاح عام محدود</li>
              <li>• للإنتاج، احتاج مفتاح Google Maps API صالح</li>
              <li>• WebSocket يجب أن يكون متصل لتلقي التحديثات المباشرة</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}