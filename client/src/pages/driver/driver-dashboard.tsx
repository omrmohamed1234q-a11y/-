import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Truck, 
  Package, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle, 
  XCircle,
  Star,
  Navigation,
  DollarSign,
  Timer,
  User,
  LogOut,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  totalAmount: string;
  status: string;
  deliveryNotes?: string;
  estimatedDelivery?: number;
  createdAt: string;
}

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  rating: string;
  totalDeliveries: number;
  status: string;
  earnings: string;
}

export default function DriverDashboard() {
  const [, setLocation] = useLocation();
  const [isOnline, setIsOnline] = useState(false);
  const [driverData, setDriverData] = useState<Driver | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const storedDriverData = localStorage.getItem('driverData');
    if (storedDriverData) {
      const driver = JSON.parse(storedDriverData);
      setDriverData(driver);
      setIsOnline(driver.status === 'online');
    } else {
      setLocation('/driver/login');
    }
  }, [setLocation]);

  // Fetch available orders
  const { data: orders = [], isLoading, refetch } = useQuery<Order[]>({
    queryKey: ['/api/driver/orders'],
    enabled: !!driverData && isOnline,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Toggle online status
  const toggleStatusMutation = useMutation({
    mutationFn: async (online: boolean) => {
      const response = await apiRequest('PUT', '/api/driver/status', { online });
      return response.json();
    },
    onSuccess: (data) => {
      setIsOnline(data.status === 'online');
      const updatedDriver = { ...driverData!, status: data.status };
      setDriverData(updatedDriver);
      localStorage.setItem('driverData', JSON.stringify(updatedDriver));
      
      toast({
        title: data.status === 'online' ? 'أصبحت متاحاً' : 'أصبحت غير متاح',
        description: data.status === 'online' ? 'يمكنك الآن استلام طلبات جديدة' : 'لن تتلقى طلبات جديدة',
      });
    },
  });

  // Accept order
  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest('PUT', `/api/driver/orders/${orderId}/accept`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'تم قبول الطلب',
        description: 'يمكنك الآن التوجه لاستلام الطلب من المتجر',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/driver/orders'] });
    },
  });

  // Reject order
  const rejectOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest('PUT', `/api/driver/orders/${orderId}/reject`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'تم رفض الطلب',
        description: 'سيتم عرض الطلب على كباتن آخرين',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/driver/orders'] });
    },
  });

  // Update order status
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await apiRequest('PUT', `/api/driver/orders/${orderId}/status`, { status });
      return response.json();
    },
    onSuccess: (data, variables) => {
      const statusMessages = {
        picked_up: 'تم استلام الطلب من المتجر',
        delivered: 'تم توصيل الطلب بنجاح',
      };
      
      toast({
        title: statusMessages[variables.status as keyof typeof statusMessages],
        description: 'تم تحديث حالة الطلب بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/driver/orders'] });
    },
  });

  const handleLogout = () => {
    localStorage.removeItem('driverToken');
    localStorage.removeItem('driverData');
    setLocation('/driver/login');
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'في الانتظار', color: 'bg-yellow-100 text-yellow-800' },
      accepted: { label: 'مقبول', color: 'bg-blue-100 text-blue-800' },
      picked_up: { label: 'تم الاستلام', color: 'bg-purple-100 text-purple-800' },
      out_for_delivery: { label: 'في الطريق', color: 'bg-orange-100 text-orange-800' },
      delivered: { label: 'تم التوصيل', color: 'bg-green-100 text-green-800' },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  if (!driverData) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-blue-600 text-white">
                    <User className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{driverData.name}</CardTitle>
                  <p className="text-gray-600">{driverData.vehicleType}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">متاح للتوصيل</span>
                  <Switch
                    checked={isOnline}
                    onCheckedChange={(checked) => toggleStatusMutation.mutate(checked)}
                    disabled={toggleStatusMutation.isPending}
                    data-testid="switch-online-status"
                  />
                </div>
                
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  data-testid="button-logout"
                >
                  <LogOut className="w-4 h-4 ml-2" />
                  تسجيل الخروج
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">إجمالي الطلبات</p>
                  <p className="text-2xl font-bold">{driverData.totalDeliveries}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">الأرباح</p>
                  <p className="text-2xl font-bold">{driverData.earnings} جنيه</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">التقييم</p>
                  <p className="text-2xl font-bold">{driverData.rating}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Timer className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">الحالة</p>
                  <p className="text-2xl font-bold">
                    {isOnline ? 'متاح' : 'غير متاح'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                الطلبات المتاحة
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                data-testid="button-refresh-orders"
              >
                <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {!isOnline ? (
              <div className="text-center py-8 text-gray-500">
                <Truck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>قم بتفعيل الحالة "متاح للتوصيل" لرؤية الطلبات</p>
              </div>
            ) : isLoading ? (
              <div className="text-center py-8 text-gray-500">
                <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin" />
                <p>جاري تحميل الطلبات...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>لا توجد طلبات متاحة حالياً</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order: Order) => (
                  <Card key={order.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">طلب #{order.orderNumber}</h3>
                          <p className="text-gray-600">{order.customerName}</p>
                        </div>
                        <div className="text-left">
                          {getStatusBadge(order.status)}
                          <p className="text-lg font-bold mt-1">{order.totalAmount} جنيه</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm">{order.deliveryAddress}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4" />
                          <a 
                            href={`tel:${order.customerPhone}`}
                            className="text-sm hover:text-blue-600"
                            data-testid={`link-call-customer-${order.id}`}
                          >
                            {order.customerPhone}
                          </a>
                        </div>

                        {order.estimatedDelivery && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">مدة التوصيل المتوقعة: {order.estimatedDelivery} دقيقة</span>
                          </div>
                        )}

                        {order.deliveryNotes && (
                          <div className="bg-yellow-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-yellow-800">ملاحظات التوصيل:</p>
                            <p className="text-sm text-yellow-700">{order.deliveryNotes}</p>
                          </div>
                        )}
                      </div>

                      <Separator className="my-4" />

                      <div className="mb-4">
                        <p className="font-medium mb-2">تفاصيل الطلب:</p>
                        <div className="space-y-1">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{item.name} × {item.quantity}</span>
                              <span>{item.price} جنيه</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {order.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => acceptOrderMutation.mutate(order.id)}
                            disabled={acceptOrderMutation.isPending}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            data-testid={`button-accept-order-${order.id}`}
                          >
                            <CheckCircle className="w-4 h-4 ml-2" />
                            قبول الطلب
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => rejectOrderMutation.mutate(order.id)}
                            disabled={rejectOrderMutation.isPending}
                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                            data-testid={`button-reject-order-${order.id}`}
                          >
                            <XCircle className="w-4 h-4 ml-2" />
                            رفض الطلب
                          </Button>
                        </div>
                      )}

                      {order.status === 'accepted' && (
                        <Button
                          onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: 'picked_up' })}
                          disabled={updateOrderMutation.isPending}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          data-testid={`button-pickup-order-${order.id}`}
                        >
                          <Package className="w-4 h-4 ml-2" />
                          استلام الطلب من المتجر
                        </Button>
                      )}

                      {order.status === 'picked_up' && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => updateOrderMutation.mutate({ orderId: order.id, status: 'delivered' })}
                            disabled={updateOrderMutation.isPending}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            data-testid={`button-deliver-order-${order.id}`}
                          >
                            <CheckCircle className="w-4 h-4 ml-2" />
                            تم التوصيل
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(order.deliveryAddress)}`, '_blank')}
                            data-testid={`button-navigate-${order.id}`}
                          >
                            <Navigation className="w-4 h-4 ml-2" />
                            التوجه للعنوان
                          </Button>
                        </div>
                      )}
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