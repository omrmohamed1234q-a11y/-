import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface VodafoneCashButtonProps {
  amount: number;
  currency?: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: any) => void;
  disabled?: boolean;
}

export function VodafoneCashButton({ 
  amount, 
  currency = 'EGP', 
  onSuccess, 
  onError, 
  disabled = false 
}: VodafoneCashButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    if (!phoneNumber || !pin) {
      toast({
        title: 'بيانات مطلوبة',
        description: 'يرجى إدخال رقم الموبايل والرقم السري',
        variant: 'destructive'
      });
      return;
    }

    // Validate Egyptian phone number format
    const egyptianPhoneRegex = /^(010|011|012|015)\d{8}$/;
    if (!egyptianPhoneRegex.test(phoneNumber)) {
      toast({
        title: 'رقم موبايل غير صحيح',
        description: 'يرجى إدخال رقم موبايل مصري صحيح (010, 011, 012, 015)',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await apiRequest('POST', '/api/vodafone-cash/payment', {
        amount,
        currency,
        phoneNumber,
        pin
      });

      onSuccess(response);
      setIsOpen(false);
      setPhoneNumber('');
      setPin('');
      toast({
        title: 'تم الدفع بنجاح',
        description: 'تمت معالجة الدفعة عبر فودافون كاش بنجاح'
      });
    } catch (error: any) {
      console.error('Vodafone Cash error:', error);
      onError(error);
      toast({
        title: 'فشل في الدفع',
        description: error.message || 'حدث خطأ أثناء معالجة الدفعة عبر فودافون كاش',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={disabled}
          className="w-full bg-red-600 hover:bg-red-700 text-white"
          data-testid="button-vodafone-cash"
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <span>📱</span>
            <span>ادفع بـ فودافون كاش</span>
            <span className="font-bold">{amount} {currency}</span>
          </div>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-center">
            الدفع عبر فودافون كاش
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center bg-red-50 p-4 rounded-lg">
            <h3 className="font-bold text-lg text-red-800">المبلغ المطلوب</h3>
            <p className="text-2xl font-bold text-red-600">{amount} {currency}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الموبايل المسجل في فودافون كاش</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="01012345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              maxLength={11}
              data-testid="input-phone-number"
            />
            <p className="text-xs text-gray-500">
              يدعم أرقام فودافون (010), اتصالات (011), أورانج (012), WE (015)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin">الرقم السري لفودافون كاش</Label>
            <Input
              id="pin"
              type="password"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={4}
              data-testid="input-cash-pin"
            />
          </div>

          <div className="flex space-x-2 space-x-reverse">
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1 bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-payment"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>جاري المعالجة...</span>
                </div>
              ) : (
                <span>تأكيد الدفع</span>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isProcessing}
              className="flex-1"
              data-testid="button-cancel-payment"
            >
              إلغاء
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>ستتم إعادة توجيهك لتطبيق فودافون كاش لإتمام العملية</p>
            <p>تأكد من وجود رصيد كافي في محفظتك</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}