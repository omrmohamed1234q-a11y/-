import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useWebSocket, useWebSocketEvent } from '@/hooks/use-websocket';
import GoogleMap from './GoogleMap';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone,
  MessageSquare,
  Wifi,
  WifiOff,
  RotateCcw,
  Navigation,
  Star
} from 'lucide-react';

interface OrderData {
  id: string;
  status: string;
  statusText: string;
  driverName?: string;
  driverPhone?: string;
  estimatedDelivery?: string;
  customerLocation?: {
    lat: number;
    lng: number;
  };
  deliveryAddress?: string;
}

interface DriverLocation {
  lat: number;
  lng: number;
  timestamp: number;
  driverId?: string;
  speed?: number;
  heading?: number;
}

interface LiveOrderTrackingProps {
  orderId: string;
  initialOrderData?: OrderData;
  customerLocation?: {
    lat: number;
    lng: number;
  };
  deliveryLocation?: {
    lat: number;
    lng: number;
  };
}

export default function LiveOrderTracking({ 
  orderId, 
  initialOrderData,
  customerLocation,
  deliveryLocation
}: LiveOrderTrackingProps) {
  const { state, subscribeToOrderUpdates, reconnect } = useWebSocket();
  const [orderData, setOrderData] = useState<OrderData>(
    initialOrderData || {
      id: orderId,
      status: 'pending',
      statusText: 'قيد المراجعة'
    }
  );
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [estimatedArrival, setEstimatedArrival] = useState<string | null>(null);

  // الاشتراك في تحديثات الطلب عند الاتصال
  useEffect(() => {
    if (state.isConnected && orderId) {
      console.log(`📦 Subscribing to live updates for order: ${orderId}`);
      subscribeToOrderUpdates(orderId);
    }
  }, [state.isConnected, orderId, subscribeToOrderUpdates]);

  // الاستماع لتحديثات حالة الطلب
  useWebSocketEvent<OrderData>('orderStatusUpdate', (updatedOrder) => {
    if (updatedOrder.id === orderId) {
      console.log('📦 Live order update received:', updatedOrder);
      setOrderData(prev => ({ ...prev, ...updatedOrder }));
      
      // حساب وقت الوصول المتوقع
      if (updatedOrder.status === 'out_for_delivery') {
        calculateEstimatedArrival();
      }
    }
  });

  // الاستماع لتحديثات موقع الكابتن
  useWebSocketEvent<DriverLocation>('driverLocationUpdate', (locationUpdate) => {
    console.log('🚗 Live driver location update:', locationUpdate);
    setDriverLocation({
      lat: locationUpdate.lat,
      lng: locationUpdate.lng,
      timestamp: locationUpdate.timestamp,
      driverId: locationUpdate.driverId,
      speed: locationUpdate.speed,
      heading: locationUpdate.heading
    });
    
    // إعادة حساب وقت الوصول بناءً على الموقع الجديد
    if (deliveryLocation) {
      calculateEstimatedArrival(locationUpdate);
    }
  });

  // حساب وقت الوصول المتوقع
  const calculateEstimatedArrival = (currentDriverLocation?: DriverLocation) => {
    if (!deliveryLocation) return;
    
    const driverPos = currentDriverLocation || driverLocation;
    if (!driverPos) return;

    // حساب المسافة (مبسط - في التطبيق الفعلي استخدم Google Distance Matrix API)
    const distance = calculateDistance(
      driverPos.lat,
      driverPos.lng,
      deliveryLocation.lat,
      deliveryLocation.lng
    );
    
    // سرعة متوسطة 30 كم/س في المدينة
    const averageSpeed = 30;
    const estimatedMinutes = Math.ceil((distance * 60) / averageSpeed);
    
    const arrivalTime = new Date();
    arrivalTime.setMinutes(arrivalTime.getMinutes() + estimatedMinutes);
    
    setEstimatedArrival(
      `${estimatedMinutes} دقيقة (${arrivalTime.toLocaleTimeString('ar-EG', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })})`
    );
  };

  // حساب المسافة بين نقطتين (بالكيلومتر)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // حساب تقدم الطلب
  const getOrderProgress = (status: string): number => {
    const statusMap: { [key: string]: number } = {
      'pending': 10,
      'confirmed': 25,
      'processing': 50,
      'ready': 65,
      'out_for_delivery': 85,
      'delivered': 100,
      'cancelled': 0
    };
    return statusMap[status] || 0;
  };

  // مراحل الطلب مع الأيقونات
  const orderSteps = [
    { id: 'confirmed', label: 'تأكيد الطلب', icon: CheckCircle, color: 'text-blue-500' },
    { id: 'processing', label: 'قيد التنفيذ', icon: Package, color: 'text-orange-500' },
    { id: 'ready', label: 'جاهز للتوصيل', icon: Clock, color: 'text-purple-500' },
    { id: 'out_for_delivery', label: 'في الطريق إليك', icon: Truck, color: 'text-green-500' },
    { id: 'delivered', label: 'تم التسليم', icon: Star, color: 'text-emerald-500' }
  ];

  const currentStepIndex = orderSteps.findIndex(step => step.id === orderData.status);
  const progress = getOrderProgress(orderData.status);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* حالة الاتصال المباشر */}
      <Card className={`border-2 ${state.isConnected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {state.isConnected ? (
                <>
                  <div className="relative">
                    <Wifi className="h-5 w-5 text-green-600" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800">التتبع المباشر نشط</p>
                    <p className="text-xs text-green-600">
                      ستصلك التحديثات فور حدوثها
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">انقطع الاتصال المباشر</p>
                    <p className="text-xs text-red-600">
                      {state.isConnecting ? 'جاري إعادة الاتصال...' : 'لا تصلك التحديثات المباشرة'}
                    </p>
                  </div>
                </>
              )}
            </div>
            
            {!state.isConnected && !state.isConnecting && (
              <Button
                size="sm"
                variant="outline"
                onClick={reconnect}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RotateCcw className="h-3 w-3 mr-2" />
                إعادة الاتصال
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* معلومات الطلب والتتبع */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* تفاصيل الطلب */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                طلب #{orderId.slice(-8)}
              </CardTitle>
              <Badge 
                variant={orderData.status === 'delivered' ? 'default' : 'secondary'}
                className={`px-3 py-1 ${
                  orderData.status === 'delivered' ? 'bg-green-500' :
                  orderData.status === 'out_for_delivery' ? 'bg-blue-500' :
                  orderData.status === 'processing' ? 'bg-orange-500' :
                  'bg-gray-500'
                }`}
              >
                {orderData.statusText}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* شريط التقدم */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>مراحل التنفيذ</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* مراحل الطلب */}
            <div className="space-y-3">
              {orderSteps.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      isCompleted 
                        ? 'bg-blue-50 border border-blue-200' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      isCompleted ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
                    }`}>
                      <StepIcon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1">
                      <p className={`font-medium ${
                        isCompleted ? 'text-blue-900' : 'text-gray-600'
                      }`}>
                        {step.label}
                      </p>
                      {isCurrent && state.isConnected && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          <p className="text-xs text-blue-600">جاري التحديث المباشر</p>
                        </div>
                      )}
                    </div>

                    {isCompleted && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* معلومات الكابتن */}
            {orderData.driverName && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">معلومات الكابتن</span>
                  </div>
                  {driverLocation && (
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      <Navigation className="h-3 w-3 mr-1" />
                      متتبع مباشرة
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  <p className="font-medium text-green-900">{orderData.driverName}</p>
                  <p className="text-sm text-green-700">{orderData.driverPhone}</p>
                  
                  {estimatedArrival && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Clock className="h-4 w-4" />
                      <span>وقت الوصول المتوقع: {estimatedArrival}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Phone className="h-4 w-4 mr-2" />
                    اتصال
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    دردشة
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* الخريطة التفاعلية */}
        <GoogleMap
          customerLocation={customerLocation}
          driverLocation={driverLocation ? {
            lat: driverLocation.lat,
            lng: driverLocation.lng,
            timestamp: driverLocation.timestamp,
            driverId: driverLocation.driverId,
            driverName: orderData.driverName,
            speed: driverLocation.speed,
            heading: driverLocation.heading
          } : undefined}
          orderDestination={deliveryLocation}
          height="500px"
          zoom={14}
        />
      </div>

      {/* عنوان التوصيل */}
      {orderData.deliveryAddress && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-blue-500 mt-1" />
              <div>
                <p className="font-medium mb-1">عنوان التوصيل</p>
                <p className="text-gray-600 text-sm">{orderData.deliveryAddress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}