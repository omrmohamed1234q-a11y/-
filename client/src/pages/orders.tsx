import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Package, 
  Clock, 
  MapPin, 
  Phone,
  Truck,
  Star,
  Eye,
  ChevronRight,
  ShoppingBag,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Navigation,
  Timer,
  MessageCircle,
  Zap,
  TrendingUp,
  Calendar,
  Award,
  Target
} from 'lucide-react';
import PrintingAnimation from '@/components/PrintingAnimation';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: string;
  productImage?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: string;
  status: string;
  statusText: string;
  deliveryAddress: string;
  deliveryMethod: string;
  paymentMethod: string;
  createdAt: string;
  estimatedDelivery?: string;
  driverName?: string;
  driverPhone?: string;
}

const getOrderStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'processing':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'ready':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'out_for_delivery':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'delivered':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getOrderStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'confirmed':
      return <CheckCircle className="h-4 w-4" />;
    case 'processing':
      return <RefreshCw className="h-4 w-4" />;
    case 'ready':
      return <Package className="h-4 w-4" />;
    case 'out_for_delivery':
      return <Truck className="h-4 w-4" />;
    case 'delivered':
      return <Star className="h-4 w-4" />;
    case 'cancelled':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
};

export default function OrdersPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  // Fetch user orders
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/orders/user'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/orders/user');
      return response.json();
    },
  });

  const handleTrackOrder = (orderNumber: string) => {
    setLocation(`/order-tracking-enhanced/${orderNumber}`);
  };

  const handleViewOrder = (orderId: string) => {
    setLocation(`/order-tracking/${orderId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filterOrders = (status: string) => {
    if (status === 'all') return orders;
    if (status === 'active') {
      return orders.filter((order: Order) => 
        ['pending', 'confirmed', 'processing', 'ready', 'out_for_delivery'].includes(order.status)
      );
    }
    if (status === 'completed') {
      return orders.filter((order: Order) => order.status === 'delivered');
    }
    return orders.filter((order: Order) => order.status === status);
  };

  const filteredOrders = filterOrders(activeTab);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/20">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Modern Delivery App Header */}
        <div className="relative mb-8 overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-3xl"></div>
          <div className="absolute inset-0 bg-black/5 rounded-3xl"></div>
          
          {/* Content */}
          <div className="relative p-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <Truck className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">طلباتي 🚚</h1>
                  <p className="text-green-100 mt-1">تتبع طلباتك بكل سهولة ووضوح</p>
                </div>
              </div>
              
              {/* Active Orders Badge */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-300" />
                    <span className="text-sm font-medium">
                      {orders.filter((o: Order) => ['pending', 'confirmed', 'processing', 'ready', 'out_for_delivery'].includes(o.status)).length} نشط
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <Package className="h-6 w-6 mx-auto mb-2 text-green-200" />
                <div className="text-2xl font-bold">{orders.length}</div>
                <div className="text-xs text-green-100">إجمالي الطلبات</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-orange-200" />
                <div className="text-2xl font-bold">
                  {orders.filter((o: Order) => ['pending', 'confirmed', 'processing', 'ready', 'out_for_delivery'].includes(o.status)).length}
                </div>
                <div className="text-xs text-orange-100">قيد التنفيذ</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <Award className="h-6 w-6 mx-auto mb-2 text-yellow-200" />
                <div className="text-2xl font-bold">
                  {orders.filter((o: Order) => o.status === 'delivered').length}
                </div>
                <div className="text-xs text-yellow-100">تم التسليم</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <Target className="h-6 w-6 mx-auto mb-2 text-blue-200" />
                <div className="text-2xl font-bold">
                  {orders.reduce((sum: number, order: Order) => sum + parseFloat(order.totalAmount || '0'), 0).toFixed(0)} ج
                </div>
                <div className="text-xs text-blue-100">إجمالي القيمة</div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Orders Section - Prominent Display */}
        {orders.filter((o: Order) => ['pending', 'confirmed', 'processing', 'ready', 'out_for_delivery'].includes(o.status)).length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">طلباتي النشطة</h2>
              </div>
              <Badge className="bg-orange-100 text-orange-800 border-orange-200 animate-pulse">
                {orders.filter((o: Order) => ['pending', 'confirmed', 'processing', 'ready', 'out_for_delivery'].includes(o.status)).length} طلب نشط
              </Badge>
            </div>
            
            <div className="grid gap-4">
              {orders
                .filter((o: Order) => ['pending', 'confirmed', 'processing', 'ready', 'out_for_delivery'].includes(o.status))
                .slice(0, 3)
                .map((order: Order) => (
                <Card key={order.id} className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 rounded-xl">
                          {getOrderStatusIcon(order.status)}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">طلب #{order.orderNumber}</h3>
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge className={`border-2 text-sm px-3 py-1 ${getOrderStatusColor(order.status)}`}>
                          {order.statusText || order.status}
                        </Badge>
                        <div className="mt-2 text-2xl font-bold text-green-600">
                          {order.totalAmount} ج
                        </div>
                      </div>
                    </div>
                    
                    {/* Enhanced Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleTrackOrder(order.orderNumber)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium h-12"
                        data-testid={`track-order-${order.orderNumber}`}
                      >
                        <Navigation className="h-5 w-5 ml-2" />
                        تتبع مباشر
                        <Zap className="h-4 w-4 mr-2" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        onClick={() => handleViewOrder(order.id)}
                        className="px-6 border-2 border-gray-300 hover:border-gray-400 h-12"
                        data-testid={`view-order-${order.id}`}
                      >
                        <Eye className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Orders Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">كل الطلبات</TabsTrigger>
            <TabsTrigger value="active">قيد التنفيذ</TabsTrigger>
            <TabsTrigger value="completed">مكتملة</TabsTrigger>
            <TabsTrigger value="cancelled">ملغية</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="py-20 text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد طلبات</h3>
                  <p className="text-gray-600 mb-6">
                    {activeTab === 'all' ? 'لم تقم بإنشاء أي طلبات بعد' : 
                     activeTab === 'active' ? 'لا توجد طلبات قيد التنفيذ حالياً' :
                     activeTab === 'completed' ? 'لا توجد طلبات مكتملة' : 'لا توجد طلبات ملغية'}
                  </p>
                  <Button onClick={() => setLocation('/')} className="bg-green-600 hover:bg-green-700">
                    ابدأ التسوق الآن
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredOrders.map((order: Order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          {getOrderStatusIcon(order.status)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">طلب #{order.orderNumber}</CardTitle>
                          <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                      <Badge className={`border ${getOrderStatusColor(order.status)}`}>
                        {order.statusText || order.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Special animation for processing orders */}
                    {order.status === 'processing' && (
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-4">
                          <PrintingAnimation status={order.status} className="flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-medium text-blue-900 mb-2">طلبك قيد التنفيذ الآن!</h4>
                            <p className="text-sm text-blue-700">
                              فريقنا يعمل على تحضير طلبك بعناية فائقة. ستحصل على إشعار فور اكتمال العملية.
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                              <span className="text-xs text-blue-600 font-medium">متوقع الانتهاء خلال 15-30 دقيقة</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700">المنتجات:</h4>
                      <div className="space-y-2">
                        {order.items?.slice(0, 2).map((item: OrderItem) => (
                          <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg relative overflow-hidden">
                            
                            {/* Printing overlay for processing orders */}
                            {order.status === 'processing' && (
                              <div className="absolute inset-0 bg-blue-50 bg-opacity-80 flex items-center justify-center">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '100ms'}}></div>
                                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '200ms'}}></div>
                                  <span className="text-xs text-blue-700 font-medium mr-2">طباعة...</span>
                                </div>
                              </div>
                            )}
                            
                            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                              {item.productImage ? (
                                <img
                                  src={item.productImage}
                                  alt={item.productName || item.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Package className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium line-clamp-1">{item.productName || item.name}</p>
                              <p className="text-xs text-gray-600">{item.quantity}× بسعر {item.price} جنيه</p>
                            </div>
                          </div>
                        ))}
                        {order.items && order.items.length > 2 && (
                          <p className="text-xs text-gray-500 text-center">
                            +{order.items.length - 2} منتج آخر
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Order Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">العنوان:</span>
                        <span className="text-gray-600 line-clamp-1">{order.deliveryAddress}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">الإجمالي:</span>
                        <span className="text-green-600 font-bold">{order.totalAmount} جنيه</span>
                      </div>
                    </div>

                    {/* Driver Info (if available) */}
                    {order.driverName && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">معلومات الكابتن</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">الاسم:</span>
                            <span>{order.driverName}</span>
                          </div>
                          {order.driverPhone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              <span>{order.driverPhone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewOrder(order.id)}
                        className="flex-1"
                        data-testid={`view-order-${order.id}`}
                      >
                        <Eye className="h-4 w-4 ml-1" />
                        عرض التفاصيل
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => handleTrackOrder(order.orderNumber)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        data-testid={`track-order-${order.orderNumber}`}
                      >
                        <MapPin className="h-4 w-4 ml-1" />
                        تتبع الطلب
                        <ChevronRight className="h-4 w-4 mr-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Refresh Button */}
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="bg-white hover:bg-gray-50"
            data-testid="refresh-orders"
          >
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث الطلبات
          </Button>
        </div>
      </div>
    </div>
  );
}