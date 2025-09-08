import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Package, 
  Phone, 
  MapPin, 
  Clock,
  CheckCircle2,
  XCircle,
  Timer,
  AlertCircle,
  TruckIcon,
  User
} from 'lucide-react';

export default function DriverOrders() {
  const { toast } = useToast();
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // جلب الطلبات الجديدة المرسلة للسائق
  const { data: notifications = [], isLoading: notificationsLoading, error: notificationsError } = useQuery({
    queryKey: ['/api/driver/notifications'],
    refetchInterval: 3000,
    retry: 2,
    staleTime: 1000,
    refetchOnWindowFocus: false
  });

  // جلب الطلبات المقبولة  
  const { data: assignedOrders = [], isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['/api/driver/orders'],
    refetchInterval: 5000,
    retry: 2,
    staleTime: 2000,
    refetchOnWindowFocus: false
  });

  // قبول الطلب
  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest('POST', `/api/driver/orders/${orderId}/accept`, {});
      return response;
    },
    onSuccess: (data, orderId) => {
      toast({
        title: '✅ تم قبول الطلب',
        description: 'تم تعيين الطلب إليك بنجاح'
      });
      setCurrentOrder(null);
      queryClient.invalidateQueries({ queryKey: ['/api/driver/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/driver/orders'] });
    },
    onError: (error: any) => {
      toast({
        title: '❌ فشل في قبول الطلب',
        description: error.message || 'حدث خطأ أثناء قبول الطلب',
        variant: 'destructive'
      });
    }
  });

  // رفض الطلب
  const rejectOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest('POST', `/api/driver/orders/${orderId}/reject`, {});
      return response;
    },
    onSuccess: (data, orderId) => {
      toast({
        title: '❌ تم رفض الطلب',
        description: 'تم تمرير الطلب للسائق التالي'
      });
      setCurrentOrder(null);
      queryClient.invalidateQueries({ queryKey: ['/api/driver/notifications'] });
    },
    onError: (error: any) => {
      toast({
        title: '❌ فشل في رفض الطلب',
        description: error.message || 'حدث خطأ أثناء رفض الطلب',
        variant: 'destructive'
      });
    }
  });

  // تحديث الطلب كمُسلم
  const markDeliveredMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest('PUT', `/api/driver/orders/${orderId}/delivered`, {});
      return response;
    },
    onSuccess: () => {
      toast({
        title: '✅ تم تسليم الطلب',
        description: 'تم تحديث حالة الطلب إلى مُسلم'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/driver/orders'] });
    }
  });

  // التحقق من وجود طلب جديد
  useEffect(() => {
    const orderNotifications = notifications.filter(
      (notif: any) => notif.type === 'order_assignment' && !notif.isRead
    );
    
    if (orderNotifications.length > 0 && !currentOrder) {
      const latestOrder = orderNotifications[0];
      setCurrentOrder(latestOrder);
      
      // حساب الوقت المتبقي
      if (latestOrder.expiresAt) {
        const expiryTime = new Date(latestOrder.expiresAt).getTime();
        const now = new Date().getTime();
        const remaining = Math.max(0, Math.floor((expiryTime - now) / 1000));
        setTimeRemaining(remaining);
      }
    }
  }, [notifications]);

  // عداد الوقت
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setCurrentOrder(null);
            toast({
              title: '⏰ انتهت المهلة',
              description: 'تم تمرير الطلب للسائق التالي',
              variant: 'destructive'
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [timeRemaining, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { label: 'في الانتظار', color: 'bg-yellow-500' },
      'assigned_to_driver': { label: 'معين لك', color: 'bg-blue-500' },
      'out_for_delivery': { label: 'في التوصيل', color: 'bg-purple-500' },
      'delivered': { label: 'تم التسليم', color: 'bg-green-500' },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, color: 'bg-gray-500' };
    
    return (
      <Badge className={`${statusInfo.color} text-white`}>
        {statusInfo.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50 dark:from-green-950 dark:to-red-950 p-6">
        <div className="text-center">
          <TruckIcon className="w-12 h-12 mx-auto animate-spin text-green-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-red-50 dark:from-green-950 dark:to-red-950 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* الترويسة */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <TruckIcon className="w-10 h-10 text-green-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-red-600 bg-clip-text text-transparent">
              طلبات التوصيل
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            إدارة طلبات التوصيل وتتبع الحالات
          </p>
        </div>

        {/* طلب جديد يحتاج موافقة */}
        {currentOrder && (
          <Card className="mb-8 border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/30 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-orange-700 dark:text-orange-300">
                <AlertCircle className="w-6 h-6" />
                طلب جديد يحتاج موافقة
              </CardTitle>
              <div className="flex items-center justify-center gap-2 text-2xl font-bold text-red-600">
                <Timer className="w-6 h-6" />
                {formatTime(timeRemaining)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <p><strong>رقم الطلب:</strong> {currentOrder.orderId}</p>
                  <p><strong>الوقت المتبقي:</strong> {formatTime(timeRemaining)} ثانية</p>
                </div>
                <div className="space-y-2">
                  <p><strong>نوع الطلب:</strong> طلب توصيل</p>
                  <p><strong>الأولوية:</strong> {currentOrder.priority}</p>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => acceptOrderMutation.mutate(currentOrder.orderId)}
                  disabled={acceptOrderMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                >
                  {acceptOrderMutation.isPending ? (
                    <Clock className="w-5 h-5 animate-spin ml-2" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 ml-2" />
                  )}
                  قبول الطلب
                </Button>
                
                <Button
                  onClick={() => rejectOrderMutation.mutate(currentOrder.orderId)}
                  disabled={rejectOrderMutation.isPending}
                  variant="destructive"
                  className="px-8 py-3 text-lg"
                >
                  {rejectOrderMutation.isPending ? (
                    <Clock className="w-5 h-5 animate-spin ml-2" />
                  ) : (
                    <XCircle className="w-5 h-5 ml-2" />
                  )}
                  رفض الطلب
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* الطلبات المعينة */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200">
            طلباتي المعينة
          </h2>

          {assignedOrders.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 text-lg">لا توجد طلبات معينة حالياً</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {assignedOrders.map((order: any) => (
                <Card key={order.id} className="shadow-lg border-r-4 border-r-green-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        طلب رقم {order.orderNumber}
                      </CardTitle>
                      {getStatusBadge(order.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span><strong>العميل:</strong> {order.customerName || 'غير محدد'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span><strong>الهاتف:</strong> {order.customerPhone || 'غير محدد'}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span><strong>العنوان:</strong> {order.deliveryAddress || 'غير محدد'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span><strong>وقت الطلب:</strong> {new Date(order.createdAt).toLocaleString('ar-EG')}</span>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex justify-between items-center">
                      <div className="text-lg font-bold text-green-600">
                        المبلغ: {order.subtotal} جنيه
                      </div>
                      
                      {order.status === 'assigned_to_driver' && (
                        <Button
                          onClick={() => markDeliveredMutation.mutate(order.id)}
                          disabled={markDeliveredMutation.isPending}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {markDeliveredMutation.isPending ? (
                            <Clock className="w-4 h-4 animate-spin ml-2" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 ml-2" />
                          )}
                          تم التسليم
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}