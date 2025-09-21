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

        {/* Modern Orders Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">جميع الطلبات</h2>
            <div className="flex-1"></div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="bg-white hover:bg-gray-50 border-2"
              data-testid="refresh-orders"
            >
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
          </div>
          
          <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 font-medium rounded-lg"
            >
              كل الطلبات ({orders.length})
            </TabsTrigger>
            <TabsTrigger 
              value="active"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 font-medium rounded-lg"
            >
              قيد التنفيذ ({orders.filter((o: Order) => ['pending', 'confirmed', 'processing', 'ready', 'out_for_delivery'].includes(o.status)).length})
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 font-medium rounded-lg"
            >
              مكتملة ({orders.filter((o: Order) => o.status === 'delivered').length})
            </TabsTrigger>
            <TabsTrigger 
              value="cancelled"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 font-medium rounded-lg"
            >
              ملغية ({orders.filter((o: Order) => o.status === 'cancelled').length})
            </TabsTrigger>
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
                <Card key={order.id} className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] bg-white overflow-hidden">
                  {/* Status Indicator Bar */}
                  <div className={`h-1 ${
                    order.status === 'delivered' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                    order.status === 'out_for_delivery' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                    order.status === 'processing' ? 'bg-gradient-to-r from-purple-500 to-violet-500' :
                    order.status === 'cancelled' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                    'bg-gradient-to-r from-orange-500 to-yellow-500'
                  }`}></div>
                  
                  <CardContent className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`p-3 rounded-2xl ${
                            order.status === 'delivered' ? 'bg-green-100' :
                            order.status === 'out_for_delivery' ? 'bg-blue-100' :
                            order.status === 'processing' ? 'bg-purple-100' :
                            order.status === 'cancelled' ? 'bg-red-100' :
                            'bg-orange-100'
                          }`}>
                            {getOrderStatusIcon(order.status)}
                          </div>
                          {(order.status === 'out_for_delivery' || order.status === 'processing') && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                            طلب #{order.orderNumber}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{formatDate(order.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge className={`border-0 text-sm px-4 py-2 font-medium shadow-sm ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'processing' ? 'bg-purple-100 text-purple-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {order.statusText || order.status}
                        </Badge>
                        <div className="mt-2 text-2xl font-bold text-green-600">
                          {order.totalAmount} <span className="text-sm">ج</span>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Processing Animation */}
                    {order.status === 'processing' && (
                      <div className="mb-6 p-5 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <PrintingAnimation status={order.status} className="flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-bold text-purple-900 mb-2 text-lg">🖨️ طلبك قيد التنفيذ الآن!</h4>
                            <p className="text-sm text-purple-700 mb-3">
                              فريقنا يعمل على تحضير طلبك بعناية فائقة. ستحصل على إشعار فور اكتمال العملية.
                            </p>
                            <div className="flex items-center gap-3 bg-white/70 rounded-lg p-2">
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '200ms'}}></div>
                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '400ms'}}></div>
                              </div>
                              <span className="text-xs text-purple-600 font-medium">متوقع الانتهاء خلال 15-30 دقيقة</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Enhanced Order Items */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-gray-600" />
                        <h4 className="font-bold text-gray-900">المنتجات</h4>
                      </div>
                      <div className="bg-gray-50/80 rounded-2xl p-4 space-y-3">
                        {order.items?.slice(0, 2).map((item: OrderItem) => (
                          <div key={item.id} className="flex items-center gap-4 p-3 bg-white rounded-xl shadow-sm relative overflow-hidden hover:shadow-md transition-shadow">
                            
                            {/* Enhanced Printing overlay for processing orders */}
                            {order.status === 'processing' && (
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-100/90 to-blue-100/90 backdrop-blur-sm flex items-center justify-center">
                                <div className="flex items-center gap-3 bg-white/80 rounded-full px-4 py-2 shadow-lg">
                                  <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                                  </div>
                                  <span className="text-sm text-purple-700 font-bold">جاري الطباعة...</span>
                                </div>
                              </div>
                            )}
                            
                            <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-inner">
                              {item.productImage ? (
                                <img
                                  src={item.productImage}
                                  alt={item.productName || item.name}
                                  className="w-full h-full object-cover rounded-xl"
                                />
                              ) : (
                                <Package className="h-7 w-7 text-gray-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 line-clamp-1 mb-1">{item.productName || item.name}</p>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-600">الكمية: {item.quantity}×</span>
                                <span className="text-sm font-bold text-green-600">{item.price} ج</span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {order.items && order.items.length > 2 && (
                          <div className="text-center p-2 bg-white/70 rounded-xl">
                            <p className="text-sm text-gray-600 font-medium">
                              <span className="text-green-600 font-bold">+{order.items.length - 2}</span> منتج إضافي
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Enhanced Order Info */}
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-2xl p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-700">عنوان التسليم</span>
                          <p className="text-gray-900 font-medium mt-1">{order.deliveryAddress}</p>
                        </div>
                      </div>
                      
                      {order.estimatedDelivery && (
                        <div className="flex items-center gap-3">
                          <Timer className="h-5 w-5 text-orange-600" />
                          <div>
                            <span className="text-sm font-medium text-gray-700">وقت التسليم المتوقع</span>
                            <p className="text-orange-600 font-bold">{order.estimatedDelivery}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Driver Info */}
                    {order.driverName && (
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-5 border-2 border-blue-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-blue-100 rounded-xl">
                            <Truck className="h-5 w-5 text-blue-600" />
                          </div>
                          <h4 className="font-bold text-blue-900 text-lg">🚚 معلومات الكابتن</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3 bg-white/70 rounded-xl p-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-sm">{order.driverName.charAt(0)}</span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-600">الكابتن</span>
                              <p className="font-bold text-gray-900">{order.driverName}</p>
                            </div>
                          </div>
                          
                          {order.driverPhone && (
                            <div className="flex items-center gap-3 bg-white/70 rounded-xl p-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <Phone className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <span className="text-xs text-gray-600">الهاتف</span>
                                <p className="font-bold text-gray-900">{order.driverPhone}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {order.driverPhone && (
                          <div className="mt-4 pt-3 border-t border-blue-200">
                            <Button
                              size="sm"
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => window.open(`tel:${order.driverPhone}`)}
                            >
                              <Phone className="h-4 w-4 ml-2" />
                              اتصال بالكابتن
                              <MessageCircle className="h-4 w-4 mr-2" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Enhanced Action Buttons */}
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => handleViewOrder(order.id)}
                        className="h-12 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 font-medium"
                        data-testid={`view-order-${order.id}`}
                      >
                        <Eye className="h-5 w-5 ml-2" />
                        عرض التفاصيل
                      </Button>
                      
                      <Button
                        onClick={() => handleTrackOrder(order.orderNumber)}
                        className="h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold shadow-lg hover:shadow-xl transition-all"
                        data-testid={`track-order-${order.orderNumber}`}
                      >
                        <Navigation className="h-5 w-5 ml-2" />
                        تتبع مباشر
                        <Zap className="h-4 w-4 mr-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}