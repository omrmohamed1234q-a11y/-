import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Truck, Package, CheckCircle, Clock, MapPin, Phone, Star, Activity } from 'lucide-react';

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: string[];
  totalPrice: number;
  status: string;
  priority: 'low' | 'normal' | 'high';
  securityLevel: 'standard' | 'secure' | 'confidential';
  createdAt: string;
  estimatedDelivery?: string;
}

interface DriverStats {
  totalDeliveries: number;
  todayDeliveries: number;
  rating: number;
  earnings: number;
}

export default function SecureDriverControl() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [driverStatus, setDriverStatus] = useState<'offline' | 'online' | 'busy'>('offline');
  const [stats, setStats] = useState<DriverStats>({
    totalDeliveries: 0,
    todayDeliveries: 0,
    rating: 0,
    earnings: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDriverData();
    // Refresh orders every 30 seconds
    const interval = setInterval(fetchDriverData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDriverData = async () => {
    try {
      const response = await fetch('/api/driver/secure-orders', {
        headers: { 'Authorization': 'Bearer driver-token' }
      });

      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData);
        
        // Mock stats for demo
        setStats({
          totalDeliveries: 156,
          todayDeliveries: 8,
          rating: 4.8,
          earnings: 2450
        });
      }
    } catch (error) {
      console.error('Error fetching driver data:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل البيانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDriverStatus = async (newStatus: 'offline' | 'online' | 'busy') => {
    try {
      const response = await fetch('/api/driver/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer driver-token'
        },
        body: JSON.stringify({ 
          status: newStatus,
          securityToken: 'secure-driver-token'
        })
      });

      if (response.ok) {
        setDriverStatus(newStatus);
        toast({
          title: "تم التحديث",
          description: `تم تحديث حالتك إلى: ${getStatusText(newStatus)}`,
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الحالة",
        variant: "destructive",
      });
    }
  };

  const acceptOrder = async (orderId: string) => {
    try {
      const response = await fetch('/api/driver/accept-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer driver-token'
        },
        body: JSON.stringify({ 
          orderId,
          driverId: 'current-driver-id',
          securityToken: 'secure-driver-token'
        })
      });

      if (response.ok) {
        toast({
          title: "تم قبول الطلب",
          description: "تم قبول الطلب بنجاح",
        });
        fetchDriverData();
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في قبول الطلب",
        variant: "destructive",
      });
    }
  };

  const markAsDelivered = async (orderId: string) => {
    try {
      const response = await fetch('/api/driver/deliver-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer driver-token'
        },
        body: JSON.stringify({ 
          orderId,
          deliveredAt: new Date().toISOString(),
          securityToken: 'secure-driver-token'
        })
      });

      if (response.ok) {
        toast({
          title: "تم التسليم",
          description: "تم تسليم الطلب بنجاح",
        });
        fetchDriverData();
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تأكيد التسليم",
        variant: "destructive",
      });
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'متاح';
      case 'busy': return 'مشغول';
      case 'offline': return 'غير متاح';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'normal': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getSecurityColor = (level: string) => {
    switch (level) {
      case 'confidential': return 'bg-red-100 text-red-800';
      case 'secure': return 'bg-orange-100 text-orange-800';
      case 'standard': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const activeOrders = orders.filter(order => ['accepted', 'picked_up', 'out_for_delivery'].includes(order.status));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Truck className="h-8 w-8 text-blue-600" />
                لوحة تحكم السائق الآمنة
              </h1>
              <p className="text-gray-600 mt-2">إدارة الطلبات ومتابعة التسليم بأمان عالي</p>
            </div>
            
            {/* Driver Status Controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(driverStatus)}`}></div>
                <span className="font-medium" data-testid="text-driver-status">{getStatusText(driverStatus)}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={driverStatus === 'online' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateDriverStatus('online')}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-status-online"
                >
                  متاح
                </Button>
                <Button
                  variant={driverStatus === 'busy' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateDriverStatus('busy')}
                  className="bg-yellow-600 hover:bg-yellow-700"
                  data-testid="button-status-busy"
                >
                  مشغول
                </Button>
                <Button
                  variant={driverStatus === 'offline' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateDriverStatus('offline')}
                  className="bg-gray-600 hover:bg-gray-700"
                  data-testid="button-status-offline"
                >
                  غير متاح
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي التسليمات</p>
                  <p className="text-2xl font-bold text-blue-600" data-testid="text-total-deliveries">{stats.totalDeliveries}</p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">تسليمات اليوم</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="text-today-deliveries">{stats.todayDeliveries}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">التقييم</p>
                  <p className="text-2xl font-bold text-yellow-600" data-testid="text-rating">{stats.rating}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">الأرباح (جنيه)</p>
                  <p className="text-2xl font-bold text-purple-600" data-testid="text-earnings">{stats.earnings.toLocaleString()}</p>
                </div>
                <Activity className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                الطلبات المتاحة ({pendingOrders.length})
              </CardTitle>
              <CardDescription>الطلبات الجديدة في انتظار القبول</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 space-y-3" data-testid={`pending-order-${order.id}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{order.customerName}</h3>
                      <div className="flex gap-2">
                        <Badge variant={getPriorityColor(order.priority)}>
                          {order.priority === 'high' ? 'عاجل' : order.priority === 'normal' ? 'عادي' : 'منخفض'}
                        </Badge>
                        <span className={`px-2 py-1 text-xs rounded-full ${getSecurityColor(order.securityLevel)}`}>
                          {order.securityLevel === 'confidential' ? 'سري' : 
                           order.securityLevel === 'secure' ? 'آمن' : 'عادي'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{order.customerPhone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{order.deliveryAddress}</span>
                      </div>
                      <div>
                        <strong>المنتجات:</strong> {order.items.join(', ')}
                      </div>
                      <div>
                        <strong>المبلغ:</strong> {order.totalPrice} جنيه
                      </div>
                    </div>

                    <Button 
                      onClick={() => acceptOrder(order.id)}
                      className="w-full bg-green-600 hover:bg-green-700"
                      data-testid={`button-accept-${order.id}`}
                    >
                      قبول الطلب
                    </Button>
                  </div>
                ))}
                {pendingOrders.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد طلبات متاحة حالياً</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                الطلبات النشطة ({activeOrders.length})
              </CardTitle>
              <CardDescription>الطلبات المقبولة وقيد التسليم</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {activeOrders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 space-y-3" data-testid={`active-order-${order.id}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{order.customerName}</h3>
                      <Badge variant="default">
                        {order.status === 'accepted' ? 'مقبول' :
                         order.status === 'picked_up' ? 'تم الاستلام' :
                         order.status === 'out_for_delivery' ? 'في الطريق' : order.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{order.customerPhone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{order.deliveryAddress}</span>
                      </div>
                      <div>
                        <strong>المبلغ:</strong> {order.totalPrice} جنيه
                      </div>
                    </div>

                    {order.status === 'out_for_delivery' && (
                      <Button 
                        onClick={() => markAsDelivered(order.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        data-testid={`button-deliver-${order.id}`}
                      >
                        تأكيد التسليم
                      </Button>
                    )}
                  </div>
                ))}
                {activeOrders.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد طلبات نشطة حالياً</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}