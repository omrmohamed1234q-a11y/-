import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { useWebSocket, useWebSocketEvent } from '@/hooks/use-websocket';
import { useGPS } from '@/hooks/use-gps';
import {
  Truck,
  MapPin,
  Navigation,
  Phone,
  Clock,
  Package,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  FileText,
  Route,
  User,
  Star,
  LogOut,
  RefreshCw,
  Play,
  Pause,
  Timer,
  Calendar,
  Receipt,
  Map,
  Zap,
  Activity
} from 'lucide-react';

interface CaptainOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryCoordinates?: {
    lat: number;
    lng: number;
  };
  totalAmount: number;
  paymentMethod: string;
  items: OrderItem[];
  timeline: OrderTimelineEvent[];
  estimatedDelivery: string;
  specialInstructions?: string;
  priority: 'normal' | 'urgent' | 'express';
  invoice?: {
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    total: number;
  };
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface OrderTimelineEvent {
  timestamp: string;
  status: string;
  description: string;
  location?: string;
  notes?: string;
}

interface CaptainProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: 'motorcycle' | 'car' | 'bicycle';
  vehicleNumber: string;
  rating: number;
  totalDeliveries: number;
}

export default function CaptainDashboard() {
  const [captainData, setCaptainData] = useState<CaptainProfile | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<CaptainOrder | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [activeOrders, setActiveOrders] = useState<CaptainOrder[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // WebSocket للتحديثات المباشرة
  const { state: wsState, updateDriverLocation, subscribeToOrderUpdates } = useWebSocket();

  // GPS للموقع الجغرافي
  const {
    currentLocation,
    isTracking,
    accuracy,
    startTracking,
    stopTracking,
    getDistanceToDestination,
    openNavigation
  } = useGPS({
    trackingInterval: 15000, // كل 15 ثانية
    onLocationUpdate: (location) => {
      // إرسال الموقع عبر WebSocket إذا كان الكبتن متصل
      if (captainData?.id && wsState.isConnected && isOnline) {
        updateDriverLocation(location.lat, location.lng);
      }
    }
  });

  // تحقق من تسجيل الدخول
  useEffect(() => {
    const authData = localStorage.getItem('captainAuth');
    
    if (!authData) {
      setLocation('/captain/secure-login');
      return;
    }
    
    try {
      const parsed = JSON.parse(authData);
      setCaptainData({
        id: parsed.user.id,
        name: parsed.user.fullName,
        phone: parsed.user.phone,
        email: parsed.user.email,
        vehicleType: parsed.user.vehicleType || 'motorcycle',
        vehicleNumber: parsed.user.driverCode,
        rating: 4.8,
        totalDeliveries: 156
      });
    } catch (error) {
      console.error('خطأ في قراءة بيانات الكبتن:', error);
      setLocation('/captain/secure-login');
    }
  }, [setLocation]);

  // بدء/إيقاف تتبع الموقع حسب حالة الكبتن
  useEffect(() => {
    if (captainData?.id && isOnline && wsState.isConnected) {
      if (!isTracking) {
        startTracking();
      }
    } else {
      if (isTracking) {
        stopTracking();
      }
    }
  }, [captainData?.id, isOnline, wsState.isConnected, isTracking, startTracking, stopTracking]);

  // الاستماع للطلبات الجديدة عبر WebSocket
  useWebSocketEvent('new_order_available', (orderData: any) => {
    toast({
      title: '🚚 طلب جديد متاح!',
      description: `طلب رقم ${orderData.orderNumber} بقيمة ${orderData.totalAmount} جنيه`,
      duration: 0, // بدون انتهاء تلقائي
      action: (
        <Button 
          size="sm"
          onClick={() => {
            // فتح تفاصيل الطلب
            queryClient.invalidateQueries({ queryKey: ['/api/captain/available-orders'] });
          }}
        >
          عرض
        </Button>
      )
    });

    // تحديث قائمة الطلبات
    queryClient.invalidateQueries({ queryKey: ['/api/captain/available-orders'] });
  });

  // الاستماع لتحديثات حالة الطلبات
  useWebSocketEvent('order_status_update', (updateData: any) => {
    console.log('📱 تحديث حالة الطلب:', updateData);
    queryClient.invalidateQueries({ queryKey: ['/api/captain/available-orders'] });
  });

  // جلب الطلبات المتاحة
  const { data: availableOrders = [], isLoading: ordersLoading } = useQuery<CaptainOrder[]>({
    queryKey: ['/api/captain/available-orders', captainData?.id],
    queryFn: async () => {
      const captainSession = localStorage.getItem('captain_session');
      const headers: Record<string, string> = {};
      
      if (captainSession) {
        headers['X-Captain-Session'] = captainSession;
      }
      
      const response = await fetch(`/api/captain/${captainData?.id}/available-orders`, {
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // التأكد من إرجاع array
      if (data.success && data.orders) {
        return data.orders;
      }
      
      return [];
    },
    enabled: !!captainData?.id,
    refetchInterval: 10000 // تحديث كل 10 ثواني
  });

  // قبول طلب
  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return await apiRequest('POST', `/api/captain/${captainData?.id}/accept-order/${orderId}`, {});
    },
    onSuccess: () => {
      toast({
        title: '✅ تم قبول الطلب',
        description: 'تم قبول الطلب بنجاح، ابدأ رحلة التوصيل'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/captain/available-orders'] });
    },
    onError: (error: any) => {
      toast({
        title: '❌ خطأ في قبول الطلب',
        description: error.error || 'فشل في قبول الطلب',
        variant: 'destructive'
      });
    }
  });

  // تحديث حالة الطلب
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, notes, location }: { 
      orderId: string; 
      status: string; 
      notes?: string; 
      location?: string 
    }) => {
      return await apiRequest('POST', `/api/captain/${captainData?.id}/order/${orderId}/status`, {
        status,
        notes,
        location
      });
    },
    onSuccess: () => {
      toast({
        title: '✅ تم تحديث الحالة',
        description: 'تم تحديث حالة الطلب بنجاح'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/captain/available-orders'] });
    },
    onError: (error: any) => {
      toast({
        title: '❌ خطأ في التحديث',
        description: error.error || 'فشل في تحديث الحالة',
        variant: 'destructive'
      });
    }
  });

  // تسجيل الخروج
  const handleLogout = () => {
    localStorage.removeItem('captainAuth');
    toast({
      title: '👋 تم تسجيل الخروج',
      description: 'نراك قريباً'
    });
    setLocation('/captain/secure-login');
  };

  // تبديل حالة متصل/غير متصل
  const toggleOnlineStatus = () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    
    if (newStatus) {
      startTracking();
    } else {
      stopTracking();
    }

    toast({
      title: newStatus ? '▶️ أنت الآن متصل' : '⏸️ أنت الآن غير متصل',
      description: newStatus ? 'ستستقبل طلبات جديدة ويتم تتبع موقعك' : 'لن تستقبل طلبات جديدة'
    });
  };

  if (!captainData) {
    return <div className="flex items-center justify-center h-screen">جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* شريط علوي */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900">مرحباً {captainData.name}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Badge variant={isOnline ? "default" : "secondary"} className="text-xs">
                    {isOnline ? '🟢 متصل' : '🔴 غير متصل'}
                  </Badge>
                  <span>• {captainData.vehicleType === 'motorcycle' ? '🏍️ دراجة نارية' : '🚗 سيارة'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* حالة WebSocket */}
              <Badge 
                variant={wsState.isConnected ? "default" : "destructive"}
                className="text-xs"
              >
                {wsState.isConnected ? '🔗 متصل' : '❌ منقطع'}
              </Badge>
              
              <Button
                variant={isOnline ? "destructive" : "default"}
                size="sm"
                onClick={toggleOnlineStatus}
                className="text-xs"
                data-testid="button-toggle-status"
              >
                {isOnline ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isOnline ? 'إيقاف' : 'تشغيل'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mx-auto mb-2">
                <Star className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{captainData.rating}</div>
              <div className="text-xs text-gray-600">التقييم</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mx-auto mb-2">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{captainData.totalDeliveries}</div>
              <div className="text-xs text-gray-600">توصيلة</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full mx-auto mb-2">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{availableOrders.length}</div>
              <div className="text-xs text-gray-600">طلبات متاحة</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full mx-auto mb-2">
                <Navigation className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {currentLocation ? '✓' : '✗'}
              </div>
              <div className="text-xs text-gray-600">
                GPS {accuracy && `(${Math.round(accuracy)}م)`}
              </div>
              {isTracking && (
                <div className="text-xs text-green-600 mt-1">🟢 نشط</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* الطلبات المتاحة */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                الطلبات المتاحة ({availableOrders.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/captain/available-orders'] })}
                disabled={ordersLoading}
                data-testid="button-refresh"
              >
                <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">جاري تحميل الطلبات...</p>
              </div>
            ) : availableOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">لا توجد طلبات متاحة حالياً</p>
                <p className="text-sm text-gray-400 mt-2">ستظهر الطلبات هنا عند توفرها</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableOrders.map((order) => (
                  <div
                    key={order.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">طلب #{order.orderNumber}</h3>
                          <Badge 
                            variant={order.priority === 'urgent' ? 'destructive' : 
                                   order.priority === 'express' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {order.priority === 'urgent' ? '⚡ عاجل' : 
                             order.priority === 'express' ? '🚀 سريع' : '📦 عادي'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {order.customerName}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {order.customerPhone}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{order.deliveryAddress}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            {order.totalAmount} جنيه
                          </div>
                        </div>

                        {order.specialInstructions && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-yellow-800">تعليمات خاصة:</p>
                                <p className="text-sm text-yellow-700">{order.specialInstructions}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(order.estimatedDelivery).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(order.estimatedDelivery).toLocaleDateString('ar-EG')}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          data-testid={`button-view-details-${order.id}`}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          التفاصيل
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => acceptOrderMutation.mutate(order.id)}
                          disabled={acceptOrderMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                          data-testid={`button-accept-order-${order.id}`}
                        >
                          {acceptOrderMutation.isPending ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                          )}
                          قبول الطلب
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* تفاصيل الطلب (مودال) */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">تفاصيل الطلب #{selectedOrder.orderNumber}</h2>
              <Button
                variant="ghost"
                onClick={() => setSelectedOrder(null)}
                data-testid="button-close-details"
              >
                ✕
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* معلومات العميل */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  معلومات العميل
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">الاسم:</span>
                    <span>{selectedOrder.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">الهاتف:</span>
                    <span>{selectedOrder.customerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">العنوان:</span>
                    <span className="text-right">{selectedOrder.deliveryAddress}</span>
                  </div>
                </div>
              </div>

              {/* الفاتورة */}
              {selectedOrder.invoice && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    الفاتورة
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span>رقم الفاتورة:</span>
                        <span className="font-mono">{selectedOrder.invoice.invoiceNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>تاريخ الإصدار:</span>
                        <span>{new Date(selectedOrder.invoice.issueDate).toLocaleDateString('ar-EG')}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {selectedOrder.invoice.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.description} × {item.quantity}</span>
                          <span>{item.total} جنيه</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span>المجموع:</span>
                        <span>{selectedOrder.invoice.total} جنيه</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* أزرار العمل */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    acceptOrderMutation.mutate(selectedOrder.id);
                    setSelectedOrder(null);
                  }}
                  disabled={acceptOrderMutation.isPending}
                  data-testid="button-accept-order-modal"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  قبول الطلب
                </Button>
                
                {selectedOrder.deliveryCoordinates && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const { lat, lng } = selectedOrder.deliveryCoordinates!;
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
                    }}
                    data-testid="button-open-maps"
                  >
                    <Map className="w-4 h-4 mr-2" />
                    خرائط
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}