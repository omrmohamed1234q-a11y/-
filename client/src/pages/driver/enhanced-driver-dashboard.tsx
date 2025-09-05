import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  getOrderStatusText, 
  getOrderStatusColor, 
  getOrderStatusIcon 
} from '@/lib/order-utils';
import { 
  Package, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2,
  Navigation,
  Truck,
  AlertCircle,
  RefreshCw,
  User
} from 'lucide-react';

interface DriverStats {
  totalOrders: number;
  completedToday: number;
  ongoingOrders: number;
  todayEarnings: number;
}

export default function EnhancedDriverDashboard() {
  const [driverStatus, setDriverStatus] = useState<'online' | 'offline' | 'busy'>('offline');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get driver stats (simulated data)
  const { data: stats } = useQuery<DriverStats>({
    queryKey: ['/api/driver/stats'],
    queryFn: async () => {
      // Simulated stats - replace with real API
      return {
        totalOrders: 127,
        completedToday: 8,
        ongoingOrders: 2,
        todayEarnings: 45
      };
    }
  });

  // Get available orders for driver (simulated)
  const { data: availableOrders = [], refetch: refetchOrders } = useQuery({
    queryKey: ['/api/driver/available-orders'],
    queryFn: async () => {
      if (driverStatus !== 'online') return [];
      
      // Simulated available orders
      return [
        {
          id: 'order-available-1',
          orderNumber: 'ORD-2024-001',
          customerName: 'أحمد محمد',
          customerPhone: '01234567890',
          deliveryAddress: '123 شارع النيل، المعادي، القاهرة',
          totalAmount: 15,
          createdAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          status: 'ready_delivery'
        },
        {
          id: 'order-available-2',
          orderNumber: 'ORD-2024-003',
          customerName: 'مريم علي',
          customerPhone: '01987654321',
          deliveryAddress: '456 شارع التحرير، وسط البلد، القاهرة',
          totalAmount: 25,
          createdAt: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
          status: 'ready_delivery'
        }
      ];
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    enabled: driverStatus === 'online'
  });

  // Get assigned orders (simulated)
  const { data: assignedOrders = [] } = useQuery({
    queryKey: ['/api/driver/assigned-orders'],
    queryFn: async () => {
      if (driverStatus === 'offline') return [];
      
      // Simulated assigned orders
      return driverStatus === 'busy' ? [
        {
          id: 'order-assigned-1',
          orderNumber: 'ORD-2024-002',
          customerName: 'فاطمة أحمد',
          customerPhone: '01555666777',
          deliveryAddress: '789 شارع الهرم، الجيزة',
          totalAmount: 30,
          createdAt: new Date(Date.now() - 1200000).toISOString(), // 20 minutes ago
          status: 'driver_assigned'
        }
      ] : [];
    },
    refetchInterval: 15000, // Refresh every 15 seconds
    enabled: driverStatus !== 'offline'
  });

  // Accept order mutation
  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const order = availableOrders.find((o: any) => o.id === orderId);
      if (!order) throw new Error('Order not found');
      
      return {
        ...order,
        status: 'driver_assigned',
        driverId: 'driver-001',
        driverName: 'أحمد السائق'
      };
    },
    onSuccess: (data) => {
      toast({
        title: "تم استلام الطلب",
        description: `تم استلام الطلب #${data.orderNumber} بنجاح`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/driver/available-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/driver/assigned-orders'] });
      setDriverStatus('busy');
    },
    onError: (error: any) => {
      toast({
        title: "فشل في استلام الطلب",
        description: error.message || "حدث خطأ أثناء استلام الطلب",
        variant: "destructive",
      });
    }
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string, status: string }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const order = assignedOrders.find((o: any) => o.id === orderId);
      if (!order) throw new Error('Order not found');
      
      return {
        ...order,
        status: status,
        statusText: getOrderStatusText(status as any)
      };
    },
    onSuccess: (data) => {
      toast({
        title: "تم تحديث حالة الطلب",
        description: `تم تحديث الطلب إلى: ${getOrderStatusText(data.status as any)}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/driver/assigned-orders'] });
      
      // Update driver status based on remaining orders
      if (data.status === 'delivered' || data.status === 'cancelled') {
        // Check if there are more assigned orders
        if (assignedOrders.length <= 1) {
          setDriverStatus('online');
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "فشل في تحديث الطلب",
        description: error.message || "حدث خطأ أثناء تحديث الطلب",
        variant: "destructive",
      });
    }
  });

  // Get current location
  useEffect(() => {
    if (navigator.geolocation && driverStatus === 'online') {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, [driverStatus]);

  const toggleDriverStatus = () => {
    if (driverStatus === 'offline') {
      setDriverStatus('online');
      toast({
        title: "أصبحت متاح",
        description: "يمكنك الآن استلام الطلبات",
      });
    } else if (driverStatus === 'online') {
      setDriverStatus('offline');
      toast({
        title: "أصبحت غير متاح",
        description: "لن تتلقى طلبات جديدة",
      });
    }
  };

  const openGoogleMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">لوحة السائق المطورة</h1>
          <p className="text-muted-foreground">
            إدارة الطلبات والتوصيل - النظام الجديد
          </p>
        </div>
        
        {/* Status Toggle */}
        <div className="flex items-center gap-3">
          <Badge 
            className={
              driverStatus === 'online' ? 'bg-green-50 text-green-700 border-green-200' :
              driverStatus === 'busy' ? 'bg-orange-50 text-orange-700 border-orange-200' :
              'bg-gray-50 text-gray-700 border-gray-200'
            }
          >
            {driverStatus === 'online' ? '🟢 متاح' :
             driverStatus === 'busy' ? '🟡 مشغول' : '🔴 غير متاح'}
          </Badge>
          
          {driverStatus !== 'busy' && (
            <Button 
              onClick={toggleDriverStatus}
              variant={driverStatus === 'online' ? 'destructive' : 'default'}
            >
              {driverStatus === 'online' ? 'إيقاف التوصيل' : 'بدء التوصيل'}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
                <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats?.completedToday || 0}</p>
                <p className="text-xs text-muted-foreground">تم اليوم</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{assignedOrders?.length || 0}</p>
                <p className="text-xs text-muted-foreground">طلبات حالية</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-xl">💰</span>
              <div>
                <p className="text-2xl font-bold">{stats?.todayEarnings || 0}</p>
                <p className="text-xs text-muted-foreground">كسب اليوم (جنيه)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {driverStatus === 'offline' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">غير متاح للطلبات</p>
                <p className="text-sm text-orange-700">اضغط "بدء التوصيل" لتصبح متاح لاستقبال الطلبات</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assigned Orders */}
      {assignedOrders && assignedOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">طلباتك الحالية ({assignedOrders.length})</h2>
            <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries()}>
              <RefreshCw className="w-4 h-4 mr-1" />
              تحديث
            </Button>
          </div>

          <div className="space-y-3">
            {assignedOrders.map((order: any) => (
              <Card key={order.id} className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getOrderStatusIcon(order.status)}</span>
                      <div>
                        <CardTitle className="text-lg">
                          طلب #{order.orderNumber}
                        </CardTitle>
                        <CardDescription>
                          العميل: {order.customerName || 'العميل'} • {order.customerPhone || 'لا يوجد'}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getOrderStatusColor(order.status)}>
                      {getOrderStatusText(order.status)}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">عنوان التوصيل:</p>
                      <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openGoogleMaps(order.deliveryAddress)}
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      فتح الخريطة
                    </Button>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>مُرّ {Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)} دقيقة</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                      <span>💰</span>
                      <span>{order.totalAmount} جنيه</span>
                    </div>
                  </div>

                  {/* Action buttons based on status */}
                  <div className="flex gap-2 pt-2 border-t">
                    {order.status === 'driver_assigned' && (
                      <Button
                        onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'out_for_delivery' })}
                        disabled={updateOrderStatusMutation.isPending}
                        className="flex-1"
                      >
                        <Truck className="w-4 h-4 mr-1" />
                        بدء التوصيل
                      </Button>
                    )}

                    {order.status === 'out_for_delivery' && (
                      <>
                        <Button
                          onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'delivered' })}
                          disabled={updateOrderStatusMutation.isPending}
                          className="flex-1"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          تم التسليم
                        </Button>
                        <Button
                          onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'cancelled' })}
                          disabled={updateOrderStatusMutation.isPending}
                          variant="destructive"
                          className="flex-1"
                        >
                          إلغاء
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Orders */}
      {driverStatus === 'online' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">طلبات متاحة ({availableOrders.length})</h2>
            <Button variant="outline" size="sm" onClick={() => refetchOrders()}>
              <RefreshCw className="w-4 h-4 mr-1" />
              تحديث
            </Button>
          </div>

          {availableOrders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">لا توجد طلبات متاحة حالياً</p>
                <p className="text-sm text-gray-500 mt-1">ستظهر الطلبات الجديدة هنا تلقائياً</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {availableOrders.map((order: any) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📦</span>
                        <div>
                          <CardTitle className="text-lg">
                            طلب #{order.orderNumber}
                          </CardTitle>
                          <CardDescription>
                            العميل: {order.customerName || 'العميل'} • {order.customerPhone || 'لا يوجد'}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className="bg-green-50 text-green-700 border-green-200">
                        جاهز للتوصيل
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">عنوان التوصيل:</p>
                        <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4" />
                          <span>مُرّ {Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)} دقيقة</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                          <span>💰</span>
                          <span>{order.totalAmount} جنيه</span>
                        </div>
                      </div>

                      <Button
                        onClick={() => acceptOrderMutation.mutate(order.id)}
                        disabled={acceptOrderMutation.isPending}
                      >
                        {acceptOrderMutation.isPending ? 'جاري الاستلام...' : 'استلم الطلب'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}