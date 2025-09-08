import { useState, useEffect } from 'react';
import { useNavigate } from 'wouter';
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
  Package,
  DollarSign,
  Star,
  Navigation,
  AlertCircle,
  LogOut,
  Settings,
  BarChart3
} from 'lucide-react';

// فحص تسجيل الدخول
const useDriverAuth = () => {
  const [, navigate] = useNavigate();
  
  useEffect(() => {
    const authData = localStorage.getItem('driverAuth');
    if (!authData) {
      navigate('/driver/secure-login');
      return;
    }
    
    try {
      const parsed = JSON.parse(authData);
      if (!parsed.user || !parsed.token) {
        navigate('/driver/secure-login');
      }
    } catch {
      navigate('/driver/secure-login');
    }
  }, [navigate]);
  
  const authData = localStorage.getItem('driverAuth');
  return authData ? JSON.parse(authData) : null;
};

export default function DriverDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useNavigate();
  const driverAuth = useDriverAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // جلب الطلبات الجديدة
  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ['driver-notifications'],
    queryFn: async () => {
      const response = await fetch('/api/driver/live-notifications');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    refetchInterval: 3000,
    enabled: !!driverAuth && isOnline,
    staleTime: 0
  });

  // جلب الطلبات النشطة
  const { data: activeOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['driver-active-orders'],
    queryFn: async () => {
      const response = await fetch('/api/driver/active-orders');
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    refetchInterval: 5000,
    enabled: !!driverAuth,
    staleTime: 1000
  });

  // جلب إحصائيات اليوم
  const { data: todayStats = {} } = useQuery({
    queryKey: ['driver-today-stats'],
    queryFn: async () => {
      const response = await fetch('/api/driver/today-stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    refetchInterval: 30000,
    enabled: !!driverAuth
  });

  // قبول الطلب
  const acceptOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch('/api/driver/accept-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      if (!response.ok) throw new Error('Failed to accept order');
      return response.json();
    },
    onSuccess: (data, orderId) => {
      toast({
        title: "✅ تم قبول الطلب",
        description: "الطلب الآن في قائمة طلباتك النشطة",
      });
      setCurrentOrder(null);
      setTimeRemaining(0);
      queryClient.invalidateQueries({ queryKey: ['driver-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['driver-active-orders'] });
    },
    onError: (error: Error) => {
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
      const response = await fetch('/api/driver/reject-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      if (!response.ok) throw new Error('Failed to reject order');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "❌ تم رفض الطلب",
        description: "تم تمرير الطلب للسائق التالي",
      });
      setCurrentOrder(null);
      setTimeRemaining(0);
      queryClient.invalidateQueries({ queryKey: ['driver-notifications'] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "❌ فشل في رفض الطلب",
        description: error.message,
      });
    }
  });

  // تحديث حالة الطلب
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string, status: string }) => {
      const response = await fetch('/api/driver/update-order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status })
      });
      if (!response.ok) throw new Error('Failed to update order status');
      return response.json();
    },
    onSuccess: (data, variables) => {
      const statusMessages = {
        'picked_up': 'تم استلام الطلب',
        'in_transit': 'في الطريق للتسليم',
        'delivered': 'تم التسليم بنجاح'
      };
      
      toast({
        title: "✅ تم تحديث الحالة",
        description: statusMessages[variables.status as keyof typeof statusMessages],
      });
      
      queryClient.invalidateQueries({ queryKey: ['driver-active-orders'] });
      queryClient.invalidateQueries({ queryKey: ['driver-today-stats'] });
    }
  });

  // تسجيل الخروج
  const handleLogout = () => {
    localStorage.removeItem('driverAuth');
    toast({
      title: "تم تسجيل الخروج",
      description: "شكراً لك على عملك اليوم",
    });
    navigate('/driver/secure-login');
  };

  // إدارة الطلبات الجديدة والعداد التنازلي
  useEffect(() => {
    const orderNotifications = notifications.filter(
      (notif: any) => notif.type === 'new_order' && notif.orderId
    );
    
    if (orderNotifications.length > 0 && !currentOrder) {
      const latestOrder = orderNotifications[0];
      setCurrentOrder(latestOrder);
      setTimeRemaining(30); // 30 ثانية للموافقة
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
      setCurrentOrder(null);
    }
  }, [timeRemaining, currentOrder]);

  if (!driverAuth) {
    return null; // يتم التوجيه تلقائياً
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* الترويسة */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-red-600 rounded-full flex items-center justify-center">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  مرحباً، {driverAuth.user.fullName}
                </h1>
                <p className="text-gray-600">سائق رقم: {driverAuth.user.driverCode}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* حالة الاتصال */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">
                  {isOnline ? 'متاح للتوصيل' : 'غير متاح'}
                </span>
              </div>
              
              {/* أزرار التحكم */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOnline(!isOnline)}
                className={isOnline ? 'border-green-500 text-green-600' : 'border-red-500 text-red-600'}
              >
                {isOnline ? 'إيقاف' : 'تشغيل'}
              </Button>
              
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* الطلب الجديد (إن وجد) */}
        {currentOrder && (
          <Card className="border-orange-400 bg-orange-50 mb-6 shadow-lg">
            <CardHeader className="bg-orange-100">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                  طلب توصيل جديد
                </span>
                <Badge variant="destructive" className="bg-red-500 text-white text-lg px-3 py-1">
                  <Clock className="h-4 w-4 mr-1" />
                  {timeRemaining}s
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">{currentOrder.title}</h3>
                  <p className="text-gray-600 mb-2">{currentOrder.description}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span>رقم الطلب: {currentOrder.orderId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>المسافة: {currentOrder.distance || '2.5 كم'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span>العمولة: {currentOrder.commission || '15 جنيه'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={() => acceptOrder.mutate(currentOrder.orderId)}
                    disabled={acceptOrder.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white flex-1 py-3 text-lg"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    {acceptOrder.isPending ? 'جاري القبول...' : 'قبول الطلب'}
                  </Button>
                  <Button 
                    onClick={() => rejectOrder.mutate(currentOrder.orderId)}
                    disabled={rejectOrder.isPending}
                    variant="destructive"
                    className="flex-1 py-3 text-lg"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    {rejectOrder.isPending ? 'جاري الرفض...' : 'رفض الطلب'}
                  </Button>
                  
                  <Button variant="outline" className="flex-1">
                    <MapPin className="h-4 w-4 mr-2" />
                    عرض على الخريطة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* إحصائيات اليوم */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{todayStats.totalOrders || 0}</div>
              <div className="text-sm text-gray-600">طلبات اليوم</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{todayStats.totalEarnings || 0} جنيه</div>
              <div className="text-sm text-gray-600">أرباح اليوم</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Navigation className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{todayStats.totalDistance || 0} كم</div>
              <div className="text-sm text-gray-600">المسافة المقطوعة</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-600">{todayStats.averageRating || 5.0}</div>
              <div className="text-sm text-gray-600">التقييم</div>
            </CardContent>
          </Card>
        </div>

        {/* الطلبات النشطة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              طلباتي النشطة ({activeOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-500 mb-2">لا توجد طلبات نشطة</p>
                <p className="text-gray-400">
                  {isOnline ? 'ستصلك إشعارات عند وجود طلبات جديدة' : 'قم بتشغيل الحالة لاستقبال طلبات'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((order: any) => (
                  <Card key={order.id} className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="h-5 w-5 text-green-600" />
                            <span className="font-semibold">طلب رقم {order.orderNumber}</span>
                            <Badge className="bg-green-600">
                              {order.status === 'assigned' ? 'مُسند إليك' : 
                               order.status === 'picked_up' ? 'تم الاستلام' :
                               order.status === 'in_transit' ? 'في الطريق' : order.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span>{new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span>{order.deliveryAddress || 'عنوان التوصيل'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4 text-gray-500" />
                              <span>{order.customerPhone || 'رقم العميل'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-gray-500" />
                              <span>{order.commission || 15} جنيه</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {order.status === 'assigned' && (
                            <Button 
                              size="sm"
                              onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: 'picked_up' })}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              تم الاستلام
                            </Button>
                          )}
                          
                          {order.status === 'picked_up' && (
                            <Button 
                              size="sm"
                              onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: 'in_transit' })}
                              className="bg-orange-600 hover:bg-orange-700"
                            >
                              في الطريق
                            </Button>
                          )}
                          
                          {(order.status === 'in_transit' || order.status === 'picked_up') && (
                            <Button 
                              size="sm"
                              onClick={() => updateOrderStatus.mutate({ orderId: order.id, status: 'delivered' })}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              تم التسليم
                            </Button>
                          )}
                          
                          <Button variant="outline" size="sm">
                            <Navigation className="h-4 w-4" />
                          </Button>
                          
                          <Button variant="outline" size="sm">
                            <Phone className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}