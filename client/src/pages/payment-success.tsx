import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, Copy, Loader, Package, MapPin, Phone, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getOrderStatusText, getOrderStatusIcon } from "@/lib/order-utils";

export default function PaymentSuccess() {
  const [location, setLocation] = useLocation();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const { toast } = useToast();

  // Extract payment details from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order_id');
  const amount = urlParams.get('amount') || '15';
  const paymentMethod = urlParams.get('payment_method') || 'vodafone_cash';

  useEffect(() => {
    const verifyAndFetchOrder = async () => {
      try {
        setLoading(true);

        if (!orderId) {
          throw new Error('معرف الطلب مفقود');
        }

        // 🔒 SECURE: Fetch order from server using authenticated API
        // The server should verify payment status with Paymob before returning order details
        const result = await apiRequest('GET', `/api/orders/verify-payment/${orderId}`);

        if (result.success && result.order) {
          setOrderDetails(result.order);
          toast({
            title: "تم التحقق من الدفع بنجاح",
            description: `رقم الطلب: ${result.order.orderNumber}`,
          });
        } else {
          throw new Error(result.message || 'فشل في التحقق من حالة الطلب');
        }

      } catch (error: any) {
        console.error('Error verifying payment:', error);
        toast({
          title: "خطأ في التحقق من الدفع",
          description: error.message || 'لا يمكن التحقق من حالة الدفع',
          variant: "destructive",
        });

        // 🔒 SECURE: Don't create fake orders on error
        // Redirect to home or show error instead
        setTimeout(() => {
          setLocation('/');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    // Delay to show loading state
    const timer = setTimeout(() => {
      verifyAndFetchOrder();
    }, 1500);

    return () => clearTimeout(timer);
  }, [orderId, setLocation, toast]);

  const copyOrderNumber = () => {
    if (orderDetails?.orderNumber) {
      navigator.clipboard.writeText(orderDetails.orderNumber);
      toast({
        title: "تم النسخ",
        description: "تم نسخ رقم الطلب",
      });
    }
  };

  const goToHome = () => {
    setLocation('/');
  };

  const trackOrder = () => {
    if (orderDetails?.orderNumber) {
      setLocation(`/order-tracking/${orderDetails.orderNumber}`);
    }
  };

  if (loading || creatingOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-semibold mb-2">
              {creatingOrder ? 'جاري إنشاء الطلب...' : 'جاري التحقق من الدفع...'}
            </h3>
            <p className="text-gray-600">يرجى الانتظار قليلاً</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-xl">❌</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-red-600">فشل في إنشاء الطلب</h3>
            <p className="text-gray-600 mb-4">حدث خطأ أثناء معالجة طلبك</p>
            <Button onClick={goToHome} variant="outline">
              العودة للرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Header */}
        <Card className="text-center">
          <CardHeader>
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">
              تم الدفع بنجاح! 🎉
            </CardTitle>
            <CardDescription>
              تم إنشاء طلبك وسيتم البدء في معالجته قريباً
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getOrderStatusIcon(orderDetails.status)}</span>
                <div>
                  <CardTitle className="text-xl">
                    طلب #{orderDetails.orderNumber}
                  </CardTitle>
                  <CardDescription>
                    تم إنشاء الطلب في: {new Date(orderDetails.createdAt || Date.now()).toLocaleString('ar-EG')}
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                {getOrderStatusText(orderDetails.status)}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Order Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">المبلغ الإجمالي:</span>
                  <span className="text-sm font-bold text-green-600">{orderDetails.totalAmount} جنيه</span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">طريقة الدفع:</span>
                  <span className="text-sm">{orderDetails.paymentMethod}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">طريقة التسليم:</span>
                  <span className="text-sm">
                    {orderDetails.deliveryMethod === 'delivery' ? 'توصيل للمنزل' : 'استلام من الفرع'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">العنوان:</span>
                  <span className="text-sm">{orderDetails.deliveryAddress || 'الفرع الرئيسي'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">الوقت المتوقع:</span>
                  <span className="text-sm">15-30 دقيقة</span>
                </div>
              </div>
            </div>

            {/* Order Number with Copy */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">رقم الطلب للتتبع:</p>
                  <p className="font-mono font-bold text-lg">{orderDetails.orderNumber}</p>
                </div>
                <Button variant="outline" size="sm" onClick={copyOrderNumber}>
                  <Copy className="h-4 w-4 mr-1" />
                  نسخ
                </Button>
              </div>
            </div>

            {/* Timeline */}
            {orderDetails.timeline && orderDetails.timeline.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">تاريخ الطلب:</h4>
                <div className="space-y-2">
                  {orderDetails.timeline.map((event: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium">{event.event}</p>
                        <p className="text-gray-500 text-xs">
                          {new Date(event.timestamp).toLocaleString('ar-EG')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">الخطوات التالية:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-sm font-bold">1</span>
              </div>
              <p className="text-sm">سيقوم الموظف باستلام طلبك خلال دقائق</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-sm font-bold">2</span>
              </div>
              <p className="text-sm">سيتم البدء في الطباعة فوراً</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-sm font-bold">3</span>
              </div>
              <p className="text-sm">
                {orderDetails.deliveryMethod === 'delivery'
                  ? 'سيتم إرسال الكابتن لتوصيل الطلب'
                  : 'ستتلقى إشعار عندما يكون الطلب جاهز للاستلام'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={trackOrder} className="flex-1">
            <Package className="h-4 w-4 mr-2" />
            تتبع الطلب
          </Button>
          <Button onClick={goToHome} variant="outline" className="flex-1">
            العودة للرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
}