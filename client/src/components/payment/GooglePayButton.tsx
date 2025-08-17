import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface GooglePayButtonProps {
  amount: number;
  currency?: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: any) => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    google?: {
      payments: {
        api: {
          PaymentsClient: new (config: any) => any;
        };
      };
    };
  }
}

export function GooglePayButton({ 
  amount, 
  currency = 'EGP', 
  onSuccess, 
  onError, 
  disabled = false 
}: GooglePayButtonProps) {
  const [isGooglePayReady, setIsGooglePayReady] = useState(false);
  const [paymentsClient, setPaymentsClient] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load Google Pay API
    const script = document.createElement('script');
    script.src = 'https://pay.google.com/gp/p/js/pay.js';
    script.async = true;
    script.onload = initializeGooglePay;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializeGooglePay = () => {
    if (window.google?.payments?.api) {
      const client = new window.google.payments.api.PaymentsClient({
        environment: 'TEST' // Change to 'PRODUCTION' for live payments
      });

      client.isReadyToPay({
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['MASTERCARD', 'VISA']
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'example', // Replace with your payment gateway
              gatewayMerchantId: 'exampleGatewayMerchantId'
            }
          }
        }]
      }).then((response: any) => {
        if (response.result) {
          setIsGooglePayReady(true);
          setPaymentsClient(client);
        }
      }).catch((err: any) => {
        console.error('Error checking Google Pay readiness:', err);
      });
    }
  };

  const handleGooglePayClick = async () => {
    if (!paymentsClient) return;

    const paymentDataRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [{
        type: 'CARD',
        parameters: {
          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
          allowedCardNetworks: ['MASTERCARD', 'VISA']
        },
        tokenizationSpecification: {
          type: 'PAYMENT_GATEWAY',
          parameters: {
            gateway: 'example',
            gatewayMerchantId: 'exampleGatewayMerchantId'
          }
        }
      }],
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPrice: amount.toString(),
        currencyCode: currency,
        countryCode: 'EG'
      },
      merchantInfo: {
        merchantId: '12345678901234567890', // Your Google Pay merchant ID
        merchantName: 'اطبعلي - Print for Me'
      }
    };

    try {
      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);
      
      // Process payment with backend
      const response = await apiRequest('POST', '/api/google-pay/payment', {
        amount,
        currency,
        paymentData
      });

      onSuccess(response);
      toast({
        title: 'تم الدفع بنجاح',
        description: 'تمت معالجة الدفعة عبر Google Pay بنجاح'
      });
    } catch (error: any) {
      console.error('Google Pay error:', error);
      onError(error);
      toast({
        title: 'فشل في الدفع',
        description: 'حدث خطأ أثناء معالجة الدفعة عبر Google Pay',
        variant: 'destructive'
      });
    }
  };

  if (!isGooglePayReady) {
    return (
      <Button disabled className="w-full bg-gray-400">
        <div className="flex items-center space-x-2 space-x-reverse">
          <span>⚡</span>
          <span>Google Pay غير متوفر</span>
        </div>
      </Button>
    );
  }

  return (
    <Button
      onClick={handleGooglePayClick}
      disabled={disabled}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      data-testid="button-google-pay"
    >
      <div className="flex items-center space-x-2 space-x-reverse">
        <span>💳</span>
        <span>ادفع بـ Google Pay</span>
        <span className="font-bold">{amount} {currency}</span>
      </div>
    </Button>
  );
}