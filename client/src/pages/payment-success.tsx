import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { CheckCircle, Copy, Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccess() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute("/payment-success");
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Extract order_id from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order_id');

  useEffect(() => {
    // Simulate loading order details
    const timer = setTimeout(() => {
      setOrderDetails({
        orderId: orderId || 'ORD-' + Date.now(),
        amount: '15.00',
        currency: 'EGP',
        status: 'completed',
        paymentMethod: 'فودافون كاش'
      });
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [orderId]);

  const copyOrderId = () => {
    if (orderDetails?.orderId) {
      navigator.clipboard.writeText(orderDetails.orderId);
      toast({
        title: "تم النسخ",
        description: "تم نسخ رقم الطلب",
      });
    }
  };

  const goToHome = () => {
    setLocation('/');
  };

  const goToOrders = () => {
    setLocation('/orders');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-semibold mb-2">جاري التحقق من الدفع...</h3>
            <p className="text-gray-600">يرجى الانتظار قليلاً</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <CardTitle className="text-xl text-green-800">
            تم الدفع بنجاح! 🎉
          </CardTitle>
          <CardDescription>
            تمت معالجة عملية الدفع بنجاح
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Order Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">رقم الطلب:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">{orderDetails?.orderId}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={copyOrderId}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">المبلغ:</span>
              <span className="font-semibold">{orderDetails?.amount} {orderDetails?.currency}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">طريقة الدفع:</span>
              <span>{orderDetails?.paymentMethod}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">الحالة:</span>
              <span className="text-green-600 font-semibold">مكتمل</span>
            </div>
          </div>

          {/* Success Message */}
          <div className="bg-green-100 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm">
              ✅ تم استلام دفعتك بنجاح وسيتم معالجة طلبك في أقرب وقت.
              <br />
              📧 ستصلك رسالة تأكيد على البريد الإلكتروني.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={goToOrders} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              عرض طلباتي
            </Button>
            
            <Button 
              onClick={goToHome} 
              variant="outline" 
              className="w-full"
            >
              العودة للرئيسية
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}