import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Truck, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MapPin, 
  Phone,
  Calendar,
  Package
} from 'lucide-react';

export default function DriverOrdersSimple() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // جلب الإشعارات (الطلبات الجديدة)
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ['driver-notifications'],
    queryFn: async () => {
      const response = await fetch('/api/driver/notifications');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    refetchInterval: 3000,
    retry: 1,
    staleTime: 0
  });

  // جلب الطلبات المقبولة
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['driver-orders'],
    queryFn: async () => {
      const response = await fetch('/api/driver/orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    refetchInterval: 5000,
    retry: 1,
    staleTime: 0
  });

  // قبول الطلب
  const acceptOrder = useMutation({
    mutationFn: async (orderId: string) => {
      console.log('✅ Accepting order:', orderId);
      const response = await fetch(`/api/driver/orders/${orderId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`فشل قبول الطلب: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: (data, orderId) => {
      console.log('✅ Order accepted:', data);
      toast({
        title: "✅ تم قبول الطلب بنجاح",
        description: "الطلب الآن مسند إليك",
      });
      setCurrentOrder(null);
      setTimeRemaining(0);
      queryClient.invalidateQueries({ queryKey: ['driver-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['driver-orders'] });
    },
    onError: (error: Error) => {
      console.error('❌ Error accepting order:', error);
      toast({
        variant: "destructive",
        title: "❌ فشل في قبول الطلب",
        description: error.message,
      });
    }
  });

  // رفض الطلب
  const rejectOrder = useMutation({
    mutationFn: async (orderId: string) => {
      console.log('❌ Rejecting order:', orderId);
      const response = await fetch(`/api/driver/orders/${orderId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`فشل رفض الطلب: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: (data, orderId) => {
      console.log('❌ Order rejected:', data);
      toast({
        title: "❌ تم رفض الطلب",
        description: "تم تمرير الطلب للسائق التالي",
      });
      setCurrentOrder(null);
      setTimeRemaining(0);
      queryClient.invalidateQueries({ queryKey: ['driver-notifications'] });
    },
    onError: (error: Error) => {
      console.error('❌ Error rejecting order:', error);
      toast({
        variant: "destructive",
        title: "❌ فشل في رفض الطلب",
        description: error.message,
      });
    }
  });

  // التحقق من الطلبات الجديدة وإعداد العداد التنازلي
  useEffect(() => {
    const orderNotifications = notifications.filter(
      (notif: any) => notif.type === 'order_assignment' && notif.orderId
    );
    
    if (orderNotifications.length > 0 && !currentOrder) {
      const latestOrder = orderNotifications[0];
      console.log('📋 New order found:', latestOrder);
      setCurrentOrder(latestOrder);
      
      // حساب الوقت المتبقي
      if (latestOrder.expiresAt) {
        const expiryTime = new Date(latestOrder.expiresAt).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
        setTimeRemaining(remaining);
      } else {
        setTimeRemaining(60); // افتراضي 60 ثانية
      }
    }
  }, [notifications, currentOrder]);

  // العداد التنازلي
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0 && currentOrder) {
      console.log('⏰ Timer expired for order:', currentOrder.orderId);
      setCurrentOrder(null);
    }
  }, [timeRemaining, currentOrder]);

  const isLoading = notificationsLoading || ordersLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50 p-6 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* الترويسة */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-red-600 bg-clip-text text-transparent mb-2">
            🚚 لوحة السائق
          </h1>
          <p className="text-gray-600">إدارة الطلبات والتوصيلات</p>
        </div>

        {/* الطلب الجديد المطلوب قبوله */}
        {currentOrder && (
          <Card className="border-orange-400 bg-orange-50 mb-8 shadow-lg">
            <CardHeader className="bg-orange-100">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-6 w-6" />
                  طلب توصيل جديد
                </span>
                <Badge variant="destructive" className="bg-red-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {timeRemaining}s
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">{currentOrder.title}</h3>
                <p className="text-gray-600 mb-4">{currentOrder.message}</p>
                <p className="text-sm text-gray-500">
                  رقم الطلب: {currentOrder.orderId}
                </p>
              </div>
              
              <div className="flex gap-4">
                <Button 
                  onClick={() => acceptOrder.mutate(currentOrder.orderId)}
                  disabled={acceptOrder.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                  size="lg"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {acceptOrder.isPending ? 'جاري القبول...' : 'قبول الطلب'}
                </Button>
                <Button 
                  onClick={() => rejectOrder.mutate(currentOrder.orderId)}
                  disabled={rejectOrder.isPending}
                  variant="destructive"
                  className="flex-1"
                  size="lg"
                >
                  <XCircle className="h-5 w-5 mr-2" />
                  {rejectOrder.isPending ? 'جاري الرفض...' : 'رفض الطلب'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* الإشعارات الأخرى */}
        {notifications.length > 0 && !currentOrder && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">📱 الإشعارات ({notifications.length})</h2>
            <div className="space-y-4">
              {notifications.map((notification: any) => (
                <Card key={notification.id} className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{notification.title}</h3>
                    <p className="text-gray-600">{notification.message}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(notification.createdAt).toLocaleString('ar-EG')}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* الطلبات المقبولة */}
        <div>
          <h2 className="text-2xl font-bold mb-4">📦 طلباتي ({orders.length})</h2>
          {orders.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-500 mb-2">لا توجد طلبات حالياً</p>
                <p className="text-gray-400">سيتم إشعارك عند وصول طلبات جديدة</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <Card key={order.id} className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        طلب رقم {order.orderNumber || order.id}
                      </span>
                      <Badge className="bg-green-600">
                        {order.status || 'مقبول'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          {order.deliveryAddress || 'عنوان التوصيل غير محدد'}
                        </span>
                      </div>
                    </div>
                    
                    {order.status === 'assigned_to_driver' && (
                      <div className="mt-4">
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          بدء التوصيل
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* إحصائيات سريعة */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{notifications.length}</div>
              <div className="text-sm text-gray-600">إشعارات جديدة</div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
              <div className="text-sm text-gray-600">طلبات نشطة</div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {currentOrder ? 1 : 0}
              </div>
              <div className="text-sm text-gray-600">طلبات منتظرة</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}