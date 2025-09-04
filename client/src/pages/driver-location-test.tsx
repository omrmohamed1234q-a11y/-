import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import DriverLocationController from '@/components/DriverLocationController';
import GoogleMap from '@/components/GoogleMap';
import { useWebSocket } from '@/hooks/use-websocket';
import { Truck, Navigation, MapPin, Users } from 'lucide-react';

interface LocationData {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export default function DriverLocationTest() {
  const { state, broadcastOrderStatusUpdate } = useWebSocket();
  const [driverLocation, setDriverLocation] = useState<LocationData | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState('ORDER-12345');
  const [orderStatus, setOrderStatus] = useState('out_for_delivery');

  // طلبات تجريبية
  const testOrders = [
    { id: 'ORDER-12345', customer: 'أحمد محمد', address: 'التجمع الخامس، القاهرة الجديدة' },
    { id: 'ORDER-67890', customer: 'فاطمة أحمد', address: 'المعادي، القاهرة' },
    { id: 'ORDER-11111', customer: 'محمد عبدالله', address: 'مدينة نصر، القاهرة' }
  ];

  // حالات الطلبات
  const orderStatuses = [
    { value: 'confirmed', label: 'تم التأكيد', color: 'bg-blue-500' },
    { value: 'preparing', label: 'قيد التحضير', color: 'bg-orange-500' },
    { value: 'ready', label: 'جاهز للاستلام', color: 'bg-purple-500' },
    { value: 'out_for_delivery', label: 'في الطريق', color: 'bg-green-500' },
    { value: 'delivered', label: 'تم التسليم', color: 'bg-emerald-500' }
  ];

  // موقع العميل التجريبي (القاهرة الجديدة)
  const customerLocation = {
    lat: 30.0131,
    lng: 31.4969
  };

  // معالج تحديث موقع الكابتن
  const handleLocationUpdate = (location: LocationData) => {
    setDriverLocation(location);
    console.log('📍 Driver location received in test page:', location);
  };

  // تحديث حالة الطلب
  const updateOrderStatus = (status: string, statusText: string) => {
    setOrderStatus(status);
    if (state.isConnected) {
      broadcastOrderStatusUpdate(selectedOrderId, status, statusText, {
        driverName: 'أحمد الكابتن التجريبي',
        estimatedDelivery: '15-20 دقيقة',
        driverPhone: '+20123456789'
      });
      console.log(`📦 Order status updated: ${selectedOrderId} -> ${status}`);
    }
  };

  const currentStatus = orderStatuses.find(s => s.value === orderStatus);
  const selectedOrder = testOrders.find(o => o.id === selectedOrderId);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-blue-500" />
            اختبار نظام تتبع الكابتن
          </CardTitle>
          <p className="text-gray-600">
            هذه الصفحة للكباتن لاختبار إرسال مواقعهم وتحديث حالة الطلبات بالوقت الفعلي
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* معلومات الاتصال */}
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Navigation className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">حالة الاتصال المباشر</p>
                <p className="text-sm text-gray-600">
                  {state.isConnected 
                    ? 'متصل - ستصل مواقعك للعملاء فوراً'
                    : 'منقطع - لن يتلقى العملاء التحديثات'
                  }
                </p>
              </div>
            </div>
            <Badge variant={state.isConnected ? "default" : "destructive"}>
              {state.isConnected ? 'متصل' : 'منقطع'}
            </Badge>
          </div>

          <Separator />

          {/* اختيار الطلب */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="font-medium">الطلب المعين</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {testOrders.map((order) => (
                <Card
                  key={order.id}
                  className={`cursor-pointer border-2 transition-colors ${
                    selectedOrderId === order.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <CardContent className="p-3">
                    <div className="text-sm">
                      <p className="font-medium text-blue-800">{order.id}</p>
                      <p className="text-gray-600">{order.customer}</p>
                      <p className="text-xs text-gray-500 mt-1">{order.address}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {selectedOrder && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm">
                  <span className="font-medium">الطلب المختار:</span> {selectedOrder.id} - {selectedOrder.customer}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* تحديث حالة الطلب */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">حالة الطلب الحالية</span>
              {currentStatus && (
                <Badge className={`${currentStatus.color} text-white`}>
                  {currentStatus.label}
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {orderStatuses.map((status) => (
                <Button
                  key={status.value}
                  size="sm"
                  variant={orderStatus === status.value ? 'default' : 'outline'}
                  onClick={() => updateOrderStatus(status.value, status.label)}
                  disabled={!state.isConnected}
                  className="text-xs"
                >
                  {status.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* مكونات التحكم */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* لوحة تحكم الكابتن */}
        <DriverLocationController
          driverId="driver-test-001"
          orderId={selectedOrderId}
          driverName="أحمد الكابتن (تجريبي)"
          onLocationUpdate={handleLocationUpdate}
        />

        {/* الخريطة التفاعلية */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-green-500" />
                عرض الخريطة التفاعلية
              </CardTitle>
              <p className="text-sm text-gray-600">
                هكذا سيرى العميل موقعك على الخريطة
              </p>
            </CardHeader>
          </Card>
          
          <GoogleMap
            customerLocation={customerLocation}
            driverLocation={driverLocation ? {
              lat: driverLocation.lat,
              lng: driverLocation.lng,
              timestamp: driverLocation.timestamp,
              driverId: 'driver-test-001',
              driverName: 'أحمد الكابتن (تجريبي)',
              speed: driverLocation.speed,
              heading: driverLocation.heading
            } : undefined}
            orderDestination={customerLocation}
            height="400px"
            zoom={13}
          />
        </div>
      </div>

      {/* معلومات إضافية */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">كيفية الاستخدام</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 text-blue-800">📱 للكباتن:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  اختر الطلب المخصص لك من القائمة
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  فعّل مشاركة الموقع وابدأ التتبع المستمر
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  حدّث حالة الطلب كلما تغيرت (جاهز، في الطريق، تم التسليم)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  تابع الإحصائيات للتأكد من عمل GPS بشكل صحيح
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3 text-green-800">👁️ ما يراه العميل:</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  موقعك المباشر على الخريطة التفاعلية
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  المسار من موقعك الحالي إلى عنوان التسليم
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  تحديثات حالة الطلب فور إرسالك لها
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  وقت الوصول المتوقع حسب المسافة والمرور
                </li>
              </ul>
            </div>
          </div>

          <Separator />

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ ملاحظات مهمة:</h4>
            <div className="text-sm text-yellow-700 space-y-1">
              <p>• هذه بيئة اختبار - في التطبيق الفعلي ستحتاج مفتاح Google Maps API صالح</p>
              <p>• تأكد من أن متصفحك يدعم الـ Geolocation API ومفعل الإذن</p>
              <p>• في الهواتف الذكية، دقة GPS ستكون أفضل من أجهزة الكمبيوتر</p>
              <p>• العملاء سيحتاجون لفتح صفحة التتبع المباشر لرؤية موقعك</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}