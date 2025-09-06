import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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
  Search,
  CheckCircle2,
  Truck,
  User,
  Navigation,
  RefreshCw,
  Copy,
  AlertTriangle,
  Star,
  MessageCircle,
  Timer,
  ArrowLeft,
  Eye,
  ShoppingBag,
  CalendarDays,
  CreditCard,
  Route
} from 'lucide-react';

interface OrderTimeline {
  event: string;
  timestamp: string;
  note?: string;
  staff?: string;
}

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
  status: string;
  statusText: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryMethod: string;
  totalAmount: number;
  paymentMethod: string;
  estimatedDelivery?: number;
  driverName?: string;
  driverPhone?: string;
  createdAt: string;
  timeline?: OrderTimeline[];
  items?: OrderItem[];
}

const ORDER_PROGRESS_STEPS = [
  { key: 'pending', label: 'تم الطلب', icon: ShoppingBag },
  { key: 'confirmed', label: 'مؤكد', icon: CheckCircle2 },
  { key: 'processing', label: 'قيد التنفيذ', icon: Package },
  { key: 'ready', label: 'جاهز', icon: Star },
  { key: 'out_for_delivery', label: 'في الطريق', icon: Truck },
  { key: 'delivered', label: 'تم التسليم', icon: CheckCircle2 },
];

const getProgressPercentage = (status: string) => {
  const statusIndex = ORDER_PROGRESS_STEPS.findIndex(step => step.key === status);
  if (statusIndex === -1) return 0;
  return ((statusIndex + 1) / ORDER_PROGRESS_STEPS.length) * 100;
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return <ShoppingBag className="h-4 w-4" />;
    case 'confirmed': return <CheckCircle2 className="h-4 w-4" />;
    case 'processing': return <Package className="h-4 w-4" />;
    case 'ready': return <Star className="h-4 w-4" />;
    case 'out_for_delivery': return <Truck className="h-4 w-4" />;
    case 'delivered': return <CheckCircle2 className="h-4 w-4" />;
    case 'cancelled': return <AlertTriangle className="h-4 w-4" />;
    default: return <Package className="h-4 w-4" />;
  }
};

export default function OrderTrackingTalabatStyle() {
  const [match, params] = useRoute('/order-tracking-enhanced/:orderNumber?');
  const [searchOrderNumber, setSearchOrderNumber] = useState(params?.orderNumber || '');
  const [orderToTrack, setOrderToTrack] = useState(params?.orderNumber || '');
  const { toast } = useToast();

  // Real-time order tracking query
  const { data: orderData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/orders/track', orderToTrack],
    queryFn: async () => {
      if (!orderToTrack) return null;
      
      try {
        const response = await apiRequest('GET', `/api/orders/track/${orderToTrack}`);
        return response.json();
      } catch (err) {
        console.error('Error tracking order:', err);
        throw err;
      }
    },
    enabled: !!orderToTrack,
    refetchInterval: orderData?.status === 'out_for_delivery' ? 30000 : 60000, // Faster updates when delivering
  });

  const handleSearch = () => {
    if (!searchOrderNumber.trim()) {
      toast({
        title: "رقم الطلب مطلوب",
        description: "من فضلك أدخل رقم الطلب للبحث",
        variant: "destructive",
      });
      return;
    }
    setOrderToTrack(searchOrderNumber.trim());
  };

  const handleCopyOrderNumber = () => {
    if (orderData?.orderNumber) {
      navigator.clipboard.writeText(orderData.orderNumber);
      toast({
        title: "تم النسخ",
        description: "تم نسخ رقم الطلب",
      });
    }
  };

  const handleCallDriver = () => {
    if (orderData?.driverPhone) {
      window.open(`tel:${orderData.driverPhone}`, '_self');
    }
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

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(0)} جنيه`;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2 text-red-800">لم يتم العثور على الطلب</h3>
              <p className="text-red-600 mb-6">
                الطلب رقم "{orderToTrack}" غير موجود أو تم حذفه
              </p>
              <Button 
                onClick={() => {
                  setOrderToTrack('');
                  setSearchOrderNumber('');
                }}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                البحث عن طلب آخر
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        
        {/* Header & Search */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Package className="h-6 w-6 text-green-600" />
              تتبع الطلب
            </CardTitle>
            <CardDescription>
              تابع حالة طلبك لحظة بلحظة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="أدخل رقم الطلب (مثل: ORD-2024-001)"
                  value={searchOrderNumber}
                  onChange={(e) => setSearchOrderNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="text-center"
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Order Status - Talabat Style */}
        {orderData && (
          <>
            {/* Order Header */}
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      {getStatusIcon(orderData.status)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
                        طلب #{orderData.orderNumber}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {formatDate(orderData.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyOrderNumber}
                    className="bg-white"
                  >
                    <Copy className="h-3 w-3 ml-1" />
                    نسخ
                  </Button>
                </div>

                <Badge className={`${getOrderStatusColor(orderData.status)} text-sm px-3 py-1`}>
                  {orderData.statusText || getOrderStatusText(orderData.status)}
                </Badge>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">التقدم</span>
                    <span className="text-sm text-gray-600">
                      {Math.round(getProgressPercentage(orderData.status))}%
                    </span>
                  </div>
                  <Progress 
                    value={getProgressPercentage(orderData.status)} 
                    className="h-2 bg-gray-200"
                  />
                </div>

                {/* Order Steps */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-6">
                  {ORDER_PROGRESS_STEPS.map((step, index) => {
                    const isCompleted = getProgressPercentage(orderData.status) > (index / ORDER_PROGRESS_STEPS.length) * 100;
                    const isCurrent = step.key === orderData.status;
                    
                    return (
                      <div key={step.key} className="text-center">
                        <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs mb-1 ${
                          isCompleted || isCurrent 
                            ? 'bg-green-600 text-white' 
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          <step.icon className="h-3 w-3" />
                        </div>
                        <span className={`text-xs ${
                          isCompleted || isCurrent ? 'text-green-600 font-medium' : 'text-gray-400'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Estimated Delivery */}
                {orderData.estimatedDelivery && orderData.status !== 'delivered' && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Timer className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        الوصول خلال {orderData.estimatedDelivery} دقيقة تقريباً
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Driver Info */}
            {orderData.driverName && orderData.status === 'out_for_delivery' && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-orange-900">الكابتن {orderData.driverName}</h3>
                        <p className="text-sm text-orange-700">في الطريق إليك الآن</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleCallDriver}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Phone className="h-4 w-4 ml-1" />
                        اتصال
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-orange-300 text-orange-700 hover:bg-orange-100"
                      >
                        <MessageCircle className="h-4 w-4 ml-1" />
                        رسالة
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">تفاصيل الطلب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">معلومات العميل</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>{orderData.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{orderData.customerPhone}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">تفاصيل التسليم</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="line-clamp-2">{orderData.deliveryAddress}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        <span>
                          {orderData.paymentMethod === 'cash' ? 'دفع عند الاستلام' : 
                           orderData.paymentMethod === 'card' ? 'بطاقة ائتمان' : 
                           orderData.paymentMethod === 'vodafone_cash' ? 'فودافون كاش' : 
                           orderData.paymentMethod}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Order Items */}
                {orderData.items && orderData.items.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">المنتجات</h4>
                    <div className="space-y-3">
                      {orderData.items.map((item: OrderItem, index: number) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                            {item.productImage ? (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.productName}</p>
                            <p className="text-xs text-gray-600">{item.quantity}× بسعر {item.price} جنيه</p>
                          </div>
                          <p className="font-bold text-green-600">
                            {formatCurrency(parseFloat(item.price) * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">الإجمالي:</span>
                        <span className="text-xl font-bold text-green-600">
                          {formatCurrency(orderData.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                {orderData.timeline && orderData.timeline.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">مراحل الطلب</h4>
                      <div className="space-y-3">
                        {orderData.timeline.map((event: OrderTimeline, index: number) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{event.event}</p>
                              <p className="text-xs text-gray-600">{formatDate(event.timestamp)}</p>
                              {event.note && (
                                <p className="text-xs text-gray-500 mt-1">{event.note}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 ml-2" />
                تحديث الحالة
              </Button>
              
              {orderData.status === 'delivered' && (
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Star className="h-4 w-4 ml-2" />
                  تقييم الطلب
                </Button>
              )}
            </div>
          </>
        )}

        {/* Empty State */}
        {!orderToTrack && (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">تتبع طلبك</h3>
              <p className="text-gray-600 mb-6">
                أدخل رقم الطلب في الأعلى لتتبع حالته
              </p>
              <div className="text-sm text-gray-500">
                <p>يمكنك العثور على رقم الطلب في:</p>
                <ul className="mt-2 space-y-1">
                  <li>• رسالة تأكيد الطلب</li>
                  <li>• بريدك الإلكتروني</li>
                  <li>• صفحة طلباتي</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}