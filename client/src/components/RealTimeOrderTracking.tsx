import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useWebSocket, useWebSocketEvent } from '@/hooks/use-websocket';
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
  RotateCcw
} from 'lucide-react';

interface OrderStatus {
  id: string;
  status: string;
  statusText: string;
  driverName?: string;
  driverPhone?: string;
  estimatedDelivery?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: number;
  };
}

interface RealTimeOrderTrackingProps {
  orderId: string;
  initialOrderData?: OrderStatus;
}

export default function RealTimeOrderTracking({ 
  orderId, 
  initialOrderData 
}: RealTimeOrderTrackingProps) {
  const { state, subscribeToOrderUpdates, reconnect } = useWebSocket();
  const [orderData, setOrderData] = useState<OrderStatus>(
    initialOrderData || {
      id: orderId,
      status: 'pending',
      statusText: 'قيد المراجعة'
    }
  );
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
    timestamp: number;
    driverId?: string;
  } | null>(null);

  // الاشتراك في تحديثات الطلب عند الاتصال
  useEffect(() => {
    if (state.isConnected && orderId) {
      console.log(`📦 Subscribing to order updates: ${orderId}`);
      subscribeToOrderUpdates(orderId);
    }
  }, [state.isConnected, orderId, subscribeToOrderUpdates]);

  // الاستماع لتحديثات حالة الطلب
  useWebSocketEvent<OrderStatus>('orderStatusUpdate', (updatedOrder) => {
    if (updatedOrder.id === orderId) {
      console.log('📦 Order status updated:', updatedOrder);
      setOrderData(prev => ({ ...prev, ...updatedOrder }));
    }
  });

  // الاستماع لتحديثات موقع الكابتن
  useWebSocketEvent<any>('driverLocationUpdate', (locationUpdate) => {
    console.log('🚗 Driver location updated:', locationUpdate);
    setDriverLocation({
      latitude: locationUpdate.latitude,
      longitude: locationUpdate.longitude,
      timestamp: locationUpdate.timestamp,
      driverId: locationUpdate.driverId
    });
  });

  // حساب تقدم الطلب
  const getOrderProgress = (status: string): number => {
    const statusMap: { [key: string]: number } = {
      'pending': 0,
      'confirmed': 20,
      'processing': 40,
      'shipped': 60,
      'out_for_delivery': 80,
      'delivered': 100,
      'cancelled': 0
    };
    return statusMap[status] || 0;
  };

  // الحصول على لون حالة الطلب
  const getStatusColor = (status: string): string => {
    const colorMap: { [key: string]: string } = {
      'pending': 'bg-yellow-500',
      'confirmed': 'bg-blue-500',
      'processing': 'bg-orange-500',
      'shipped': 'bg-purple-500',
      'out_for_delivery': 'bg-green-500',
      'delivered': 'bg-emerald-500',
      'cancelled': 'bg-red-500'
    };
    return colorMap[status] || 'bg-gray-500';
  };

  // مراحل الطلب
  const orderSteps = [
    { id: 'pending', label: 'تم استلام الطلب', icon: Package },
    { id: 'processing', label: 'قيد التنفيذ', icon: Clock },
    { id: 'shipped', label: 'في الطريق', icon: Truck },
    { id: 'delivered', label: 'تم التسليم', icon: CheckCircle }
  ];

  const currentStepIndex = orderSteps.findIndex(step => step.id === orderData.status);
  const progress = getOrderProgress(orderData.status);

  return (
    <div className="space-y-6">
      {/* حالة الاتصال */}
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {state.isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">متصل - التتبع المباشر نشط</span>
                </>
              ) : state.isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-blue-600">جاري الاتصال...</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600">غير متصل</span>
                </>
              )}
            </div>
            
            {!state.isConnected && (
              <Button
                size="sm"
                variant="outline"
                onClick={reconnect}
                data-testid="reconnect-websocket"
              >
                <RotateCcw className="h-3 w-3 mr-2" />
                إعادة الاتصال
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* معلومات الطلب */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              طلب #{orderId.slice(-8)}
            </CardTitle>
            <Badge className={getStatusColor(orderData.status)}>
              {orderData.statusText}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* شريط التقدم */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>حالة الطلب</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* مراحل الطلب */}
          <div className="space-y-4">
            {orderSteps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    isActive ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
                  }`}>
                    <StepIcon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1">
                    <p className={`font-medium ${
                      isActive ? 'text-blue-900' : 'text-gray-600'
                    }`}>
                      {step.label}
                    </p>
                    {isCurrent && state.isConnected && (
                      <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        جاري التحديث المباشر
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* معلومات الكابتن */}
      {orderData.driverName && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              معلومات الكابتن
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{orderData.driverName}</p>
                <p className="text-sm text-gray-600">{orderData.driverPhone}</p>
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  اتصال
                </Button>
                <Button size="sm" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  دردشة
                </Button>
              </div>
            </div>

            {/* موقع الكابتن الحالي */}
            {driverLocation && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">الموقع الحالي</span>
                  {state.isConnected && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
                <p className="text-xs text-green-600">
                  تم التحديث: {new Date(driverLocation.timestamp).toLocaleString('ar-EG')}
                </p>
                
                {/* يمكن إضافة خريطة هنا */}
                <div className="mt-2 h-20 bg-green-100 rounded flex items-center justify-center">
                  <span className="text-xs text-green-600">
                    📍 {driverLocation.latitude.toFixed(4)}, {driverLocation.longitude.toFixed(4)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* وقت التسليم المتوقع */}
      {orderData.estimatedDelivery && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">وقت التسليم المتوقع</p>
                <p className="text-sm text-gray-600">{orderData.estimatedDelivery}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}