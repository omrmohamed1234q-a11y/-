import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import PaymentMethods from '@/components/PaymentMethods';
import { CreditCard, Receipt, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: 'printing' | 'product';
}

export default function PaymentPage() {
  const { toast } = useToast();
  const [cartItems] = useState<CartItem[]>([
    {
      id: '1',
      name: 'طباعة أسود وأبيض - 20 صفحة',
      price: 5.00,
      quantity: 1,
      type: 'printing'
    },
    {
      id: '2', 
      name: 'كتاب الرياضيات - الصف الأول',
      price: 45.50,
      quantity: 1,
      type: 'product'
    }
  ]);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.14; // 14% VAT in Egypt
  const total = subtotal + tax;

  const handlePaymentSuccess = (paymentData: any) => {
    console.log('Payment successful:', paymentData);
    toast({
      title: 'تم الدفع بنجاح!',
      description: `تم إتمام الدفعة بمبلغ ${total.toFixed(2)} جنيه مصري`
    });
    // Redirect to success page or update UI
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment failed:', error);
    toast({
      title: 'فشل في الدفع',
      description: 'حدث خطأ أثناء معالجة الدفعة، يرجى المحاولة مرة أخرى',
      variant: 'destructive'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="w-4 h-4 ml-2" />
              العودة للرئيسية
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">إتمام الدفع</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <Receipt className="w-5 h-5" />
                  <span>ملخص الطلب</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <p className="text-xs text-gray-500">الكمية: {item.quantity}</p>
                      <Badge variant={item.type === 'printing' ? 'default' : 'secondary'} className="text-xs mt-1">
                        {item.type === 'printing' ? 'طباعة' : 'منتج'}
                      </Badge>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">{(item.price * item.quantity).toFixed(2)} جنيه</p>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>المجموع الفرعي:</span>
                    <span>{subtotal.toFixed(2)} جنيه</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>الضريبة (14%):</span>
                    <span>{tax.toFixed(2)} جنيه</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>الإجمالي:</span>
                    <span className="text-green-600">{total.toFixed(2)} جنيه</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods */}
          <div className="lg:col-span-2">
            <PaymentMethods
              amount={total}
              orderId={`order-${Date.now()}`}
              customerData={{
                firstName: 'محمد',
                lastName: 'أحمد',
                email: 'customer@example.com',
                phone: '01012345678',
                address: 'Cairo, Egypt'
              }}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}