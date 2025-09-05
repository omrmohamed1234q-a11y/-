import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  getOrderStatusText, 
  getOrderStatusColor, 
  getOrderStatusIcon,
  getOrderTimeline 
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
  AlertTriangle
} from 'lucide-react';

export default function OrderTrackingEnhanced() {
  const [match, params] = useRoute('/order-tracking-enhanced/:orderNumber?');
  const [searchOrderNumber, setSearchOrderNumber] = useState('');
  const [orderToTrack, setOrderToTrack] = useState(params?.orderNumber || '');
  const { toast } = useToast();

  // Track order query
  const { data: orderData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/orders/track', orderToTrack],
    queryFn: async () => {
      if (!orderToTrack) return null;
      
      // Simulated order tracking data - replace with real API call
      if (orderToTrack === 'ORD-2024-001') {
        return {
          orderNumber: 'ORD-2024-001',
          status: 'printing',
          statusText: 'جاري الطباعة دلوقتي',
          customerName: 'أحمد محمد',
          customerPhone: '01234567890',
          deliveryAddress: '123 شارع النيل، المعادي، القاهرة',
          deliveryMethod: 'delivery',
          totalAmount: 15,
          paymentMethod: 'vodafone_cash',
          estimatedDelivery: 20,
          driverName: null,
          driverPhone: null,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          timeline: [
            {
              event: 'تم إنشاء الطلب وتأكيد الدفع',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              note: 'Payment ID: PMT-123456'
            },
            {
              event: 'استلم الطلب: محمود الموظف',
              timestamp: new Date(Date.now() - 2400000).toISOString()
            },
            {
              event: 'بدء الطباعة',
              timestamp: new Date(Date.now() - 1200000).toISOString()
            }
          ]
        };
      } else if (orderToTrack === 'ORD-2024-002') {
        return {
          orderNumber: 'ORD-2024-002',
          status: 'out_for_delivery',
          statusText: 'الكابتن في الطريق إليك',
          customerName: 'فاطمة أحمد',
          customerPhone: '01555666777',
          deliveryAddress: '789 شارع الهرم، الجيزة',
          deliveryMethod: 'delivery',
          totalAmount: 30,
          paymentMethod: 'card',
          estimatedDelivery: 10,
          driverName: 'أحمد السائق',
          driverPhone: '01999888777',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          timeline: [
            {
              event: 'تم إنشاء الطلب وتأكيد الدفع',
              timestamp: new Date(Date.now() - 7200000).toISOString()
            },
            {
              event: 'استلم الطلب: سارة الموظف',
              timestamp: new Date(Date.now() - 5400000).toISOString()
            },
            {
              event: 'بدء الطباعة',
              timestamp: new Date(Date.now() - 3600000).toISOString()
            },
            {
              event: 'انتهت الطباعة',
              timestamp: new Date(Date.now() - 2400000).toISOString()
            },
            {
              event: 'راح للكابتن: أحمد السائق',
              timestamp: new Date(Date.now() - 1800000).toISOString()
            },
            {
              event: 'خرج للتوصيل مع الكابتن',
              timestamp: new Date(Date.now() - 600000).toISOString()
            }
          ]
        };
      } else if (orderToTrack === 'ORD-2024-003') {
        return {
          orderNumber: 'ORD-2024-003',
          status: 'delivered',
          statusText: 'وصلت خلاص - تم التسليم',
          customerName: 'مريم علي',
          customerPhone: '01987654321',
          deliveryAddress: '456 شارع التحرير، وسط البلد، القاهرة',
          deliveryMethod: 'delivery',
          totalAmount: 25,
          paymentMethod: 'vodafone_cash',
          estimatedDelivery: 0,
          driverName: 'محمد السائق',
          driverPhone: '01777666555',
          createdAt: new Date(Date.now() - 10800000).toISOString(),
          timeline: [
            {
              event: 'تم إنشاء الطلب وتأكيد الدفع',
              timestamp: new Date(Date.now() - 10800000).toISOString()
            },
            {
              event: 'استلم الطلب: علي الموظف',
              timestamp: new Date(Date.now() - 9000000).toISOString()
            },
            {
              event: 'بدء الطباعة',
              timestamp: new Date(Date.now() - 7200000).toISOString()
            },
            {
              event: 'انتهت الطباعة',
              timestamp: new Date(Date.now() - 5400000).toISOString()
            },
            {
              event: 'راح للكابتن: محمد السائق',
              timestamp: new Date(Date.now() - 3600000).toISOString()
            },
            {
              event: 'خرج للتوصيل مع الكابتن',
              timestamp: new Date(Date.now() - 1800000).toISOString()
            },
            {
              event: 'تم التسليم بنجاح',
              timestamp: new Date(Date.now() - 600000).toISOString()
            }
          ]
        };
      } else {
        throw new Error('Order not found');
      }
    },
    enabled: Boolean(orderToTrack),
    refetchInterval: orderData?.status === 'delivered' || orderData?.status === 'cancelled' ? false : 30000
  });

  const handleSearch = () => {
    if (!searchOrderNumber.trim()) {
      toast({
        title: "أدخل رقم الطلب",
        description: "يرجى إدخال رقم الطلب للبحث",
        variant: "destructive",
      });
      return;
    }
    setOrderToTrack(searchOrderNumber.trim());
  };

  const copyOrderNumber = () => {
    if (orderData?.orderNumber) {
      navigator.clipboard.writeText(orderData.orderNumber);
      toast({
        title: "تم النسخ",
        description: "تم نسخ رقم الطلب",
      });
    }
  };

  const callDriver = () => {
    if (orderData?.driverPhone) {
      window.open(`tel:${orderData.driverPhone}`, '_self');
    }
  };

  const openGoogleMaps = () => {
    if (orderData?.deliveryAddress) {
      const encodedAddress = encodeURIComponent(orderData.deliveryAddress);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  };

  useEffect(() => {
    if (params?.orderNumber) {
      setSearchOrderNumber(params.orderNumber);
      setOrderToTrack(params.orderNumber);
    }
  }, [params?.orderNumber]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">تتبع الطلب</h1>
          <p className="text-muted-foreground">
            تابع حالة طلبك لحظة بلحظة
          </p>
        </div>

        {/* Search Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              البحث عن طلب
            </CardTitle>
            <CardDescription>
              أدخل رقم الطلب للاستعلام عن الحالة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="مثال: ORD-2024-001"
                value={searchOrderNumber}
                onChange={(e) => setSearchOrderNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                بحث
              </Button>
            </div>
            
            {/* Demo order numbers */}
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 mb-2">للتجربة، استخدم أحد هذه الأرقام:</p>
              <div className="flex gap-2 flex-wrap">
                {['ORD-2024-001', 'ORD-2024-002', 'ORD-2024-003'].map((orderNum) => (
                  <Button
                    key={orderNum}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchOrderNumber(orderNum);
                      setOrderToTrack(orderNum);
                    }}
                    className="text-xs"
                  >
                    {orderNum}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold text-red-700 mb-2">لم يتم العثور على الطلب</h3>
              <p className="text-red-600 mb-4">
                تأكد من صحة رقم الطلب أو تواصل مع خدمة العملاء
              </p>
              <Button variant="outline" onClick={() => setOrderToTrack('')}>
                بحث مرة أخرى
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        {orderData && !error && (
          <>
            {/* Main Status Card */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="text-4xl">{getOrderStatusIcon(orderData.status)}</span>
                  <div>
                    <CardTitle className="text-2xl">
                      طلب #{orderData.orderNumber}
                    </CardTitle>
                    <Badge className={`${getOrderStatusColor(orderData.status)} mt-2`}>
                      {getOrderStatusText(orderData.status)}
                    </Badge>
                  </div>
                </div>
                
                {orderData.estimatedDelivery > 0 && (
                  <div className="flex items-center justify-center gap-2 text-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">الوقت المتبقي: {orderData.estimatedDelivery} دقيقة</span>
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Order Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">العميل:</span>
                    <span className="text-sm">{orderData.customerName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">الجوال:</span>
                    <span className="text-sm">{orderData.customerPhone}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">المبلغ:</span>
                    <span className="text-sm font-bold text-green-600">{orderData.totalAmount} جنيه</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 text-gray-500">💳</span>
                    <span className="text-sm font-medium">الدفع:</span>
                    <span className="text-sm">{orderData.paymentMethod}</span>
                  </div>
                </div>

                {/* Address */}
                <div className="bg-white p-3 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">عنوان التوصيل:</p>
                        <p className="text-sm text-gray-600">{orderData.deliveryAddress}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={openGoogleMaps}>
                      <Navigation className="w-3 h-3 mr-1" />
                      خريطة
                    </Button>
                  </div>
                </div>

                {/* Driver Info */}
                {orderData.driverName && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🏍️</span>
                        <div>
                          <p className="text-sm font-medium">السائق: {orderData.driverName}</p>
                          <p className="text-xs text-gray-600">{orderData.driverPhone}</p>
                        </div>
                      </div>
                      <Button size="sm" onClick={callDriver}>
                        <Phone className="w-3 h-3 mr-1" />
                        اتصال
                      </Button>
                    </div>
                  </div>
                )}

                {/* Order Number Copy */}
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">رقم الطلب:</p>
                    <p className="font-mono font-bold">{orderData.orderNumber}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={copyOrderNumber}>
                    <Copy className="h-4 w-4 mr-1" />
                    نسخ
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  تاريخ الطلب
                </CardTitle>
                <CardDescription>
                  تتبع مراحل معالجة طلبك
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderData.timeline.map((event: any, index: number) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                        index === orderData.timeline.length - 1 ? 'bg-blue-500' : 'bg-gray-300'
                      }`}></div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{event.event}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(event.timestamp).toLocaleString('ar-EG')}
                        </p>
                        {event.note && (
                          <p className="text-xs text-blue-600 mt-1 bg-blue-50 p-1 rounded">
                            {event.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Refresh Button */}
            <div className="text-center">
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                تحديث الحالة
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}