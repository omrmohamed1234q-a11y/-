import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Smartphone, Banknote } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PaymentMethod {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  integration_id: number;
  comingSoon?: boolean;
}

interface PaymentMethodsProps {
  amount: number;
  orderId: string;
  customerData: any;
  onPaymentSuccess: (result: any) => void;
  onPaymentError: (error: string) => void;
}

export default function PaymentMethods({
  amount,
  orderId,
  customerData,
  onPaymentSuccess,
  onPaymentError
}: PaymentMethodsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', '/api/payments/paymob/methods');
      const data = await response.json();
      
      if (data.success) {
        setPaymentMethods(data.paymentMethods);
      } else {
        throw new Error(data.error || 'Failed to load payment methods');
      }
    } catch (error: any) {
      console.error('Error fetching payment methods:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل طرق الدفع',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentMethod = async (method: PaymentMethod) => {
    if (method.comingSoon) {
      toast({
        title: 'قريباً',
        description: `${method.name} سيكون متاحاً قريباً`,
      });
      return;
    }

    try {
      setProcessingPayment(method.id);

      // Create payment intention with Paymob
      const response = await apiRequest('POST', '/api/payments/paymob/create', {
        amount,
        orderId,
        customerData,
        paymentMethod: method.id,
        integration_id: method.integration_id
      });

      const paymentData = await response.json();

      if (paymentData.success) {
        // For mobile wallets, redirect to payment URL
        if (['vodafone_cash', 'orange_money', 'etisalat_cash'].includes(method.id)) {
          // Open payment iframe in new window
          const paymentWindow = window.open(
            paymentData.iframeUrl,
            'PaymentWindow',
            'width=800,height=600,scrollbars=yes,resizable=yes'
          );

          // Check payment status
          const checkPaymentStatus = setInterval(() => {
            if (paymentWindow?.closed) {
              clearInterval(checkPaymentStatus);
              setProcessingPayment(null);
              
              toast({
                title: 'تم إغلاق نافذة الدفع',
                description: 'يرجى المحاولة مرة أخرى إذا لم يكتمل الدفع',
                variant: 'destructive'
              });
            }
          }, 1000);

          // Listen for payment completion message
          window.addEventListener('message', (event) => {
            if (event.origin === 'https://accept.paymob.com') {
              clearInterval(checkPaymentStatus);
              paymentWindow?.close();
              setProcessingPayment(null);

              if (event.data.success) {
                onPaymentSuccess({
                  method: method.name,
                  transactionId: event.data.transactionId
                });
              } else {
                onPaymentError(event.data.error || 'فشل في عملية الدفع');
              }
            }
          });

        } else if (method.id === 'card') {
          // For cards, embed iframe directly
          showCardPaymentModal(paymentData.iframeUrl, method.name);
        }
      } else {
        throw new Error(paymentData.error || 'Failed to create payment');
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      setProcessingPayment(null);
      
      // Special handling for Paymob authentication errors
      if (error.message?.includes('مفاتيح Paymob') || error.message?.includes('401')) {
        toast({
          title: "مشكلة في إعدادات الدفع",
          description: "مفاتيح Paymob غير صحيحة أو منتهية الصلاحية. يرجى التواصل مع الإدارة.",
          variant: "destructive",
        });
        onPaymentError('مشكلة في إعدادات الدفع - يرجى التواصل مع الإدارة');
      } else {
        toast({
          title: "فشل في بدء الدفع",
          description: error.message || 'فشل في بدء عملية الدفع',
          variant: "destructive",
        });
        onPaymentError(error.message || 'فشل في بدء عملية الدفع');
      }
    }
  };

  const showCardPaymentModal = (iframeUrl: string, methodName: string) => {
    // Create modal for card payment
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-4 w-full max-w-4xl h-[80vh] relative">
        <button id="close-payment" class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl">×</button>
        <h3 class="text-lg font-bold mb-4 text-center">الدفع بـ ${methodName}</h3>
        <iframe src="${iframeUrl}" class="w-full h-full border-0"></iframe>
      </div>
    `;

    document.body.appendChild(modal);

    // Close modal event
    const closeButton = modal.querySelector('#close-payment');
    closeButton?.addEventListener('click', () => {
      document.body.removeChild(modal);
      setProcessingPayment(null);
    });

    // Listen for payment completion
    window.addEventListener('message', (event) => {
      if (event.origin === 'https://accept.paymob.com') {
        document.body.removeChild(modal);
        setProcessingPayment(null);

        if (event.data.success) {
          onPaymentSuccess({
            method: methodName,
            transactionId: event.data.transactionId
          });
        } else {
          onPaymentError(event.data.error || 'فشل في عملية الدفع');
        }
      }
    });
  };

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method.id) {
      case 'card':
        return <CreditCard className="h-6 w-6" />;
      case 'valu':
        return <span className="text-2xl font-bold text-purple-600">💰</span>;
      case 'vodafone_cash':
      case 'orange_money':
      case 'etisalat_cash':
        return <Smartphone className="h-6 w-6" />;
      case 'instapay':
        return <Banknote className="h-6 w-6" />;
      default:
        return <span className="text-2xl">{method.icon}</span>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            طرق الدفع المتاحة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="mr-2">جاري تحميل طرق الدفع...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          طرق الدفع المتاحة
        </CardTitle>
        <p className="text-sm text-gray-600">
          اختر طريقة الدفع المفضلة لديك لإتمام الطلب
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => (
            <Button
              key={method.id}
              variant="outline"
              className={`h-auto p-4 flex flex-col items-center gap-3 hover:bg-gray-50 relative ${
                method.comingSoon ? 'opacity-60' : ''
              } ${method.featured ? 'border-purple-200 bg-purple-50 hover:bg-purple-100' : ''}`}
              onClick={() => handlePaymentMethod(method)}
              disabled={processingPayment === method.id || method.comingSoon}
              data-testid={`payment-method-${method.id}`}
            >
              {method.featured && (
                <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                  مميز
                </div>
              )}

              {processingPayment === method.id ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                getMethodIcon(method)
              )}
              
              <div className="text-center">
                <div className="font-medium">{method.name}</div>
                <div className="text-xs text-gray-500">{method.nameEn}</div>
                {method.description && (
                  <div className="text-xs text-purple-600 mt-1">{method.description}</div>
                )}
              </div>

              {method.comingSoon && (
                <Badge variant="secondary" className="text-xs">
                  قريباً
                </Badge>
              )}

              {processingPayment === method.id && (
                <div className="text-xs text-blue-600">
                  جاري المعالجة...
                </div>
              )}
            </Button>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="font-medium text-blue-800">ملاحظة مهمة</span>
          </div>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• جميع المعاملات محمية بتشفير SSL</li>
            <li>• يمكنك الدفع بالجنيه المصري</li>
            <li>• لا نحتفظ ببيانات البطاقة الائتمانية</li>
            <li>• ستتلقى تأكيد الدفع عبر الرسائل النصية</li>
          </ul>
        </div>

        <div className="mt-4 text-center">
          <div className="text-lg font-bold text-green-600">
            المبلغ الإجمالي: {amount.toFixed(2)} جنيه
          </div>
        </div>
      </CardContent>
    </Card>
  );
}