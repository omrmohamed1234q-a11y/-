import { Request, Response } from "express";

// Paymob API Configuration
const PAYMOB_API_URL = "https://accept.paymobsolutions.com/api";

interface PaymobAuthResponse {
  token: string;
  profile: {
    id: number;
  };
}

interface PaymobOrderResponse {
  id: number;
  created_at: string;
  delivery_needed: boolean;
  merchant: {
    id: number;
    created_at: string;
    phones: string[];
    company_emails: string[];
    company_name: string;
    state: string;
    country: string;
    city: string;
    postal_code: string;
    street: string;
  };
  collector: null | any;
  amount_cents: number;
  shipping_data: any;
  currency: string;
  is_payment_locked: boolean;
  is_return: boolean;
  is_cancel: boolean;
  is_returned: boolean;
  is_canceled: boolean;
  merchant_order_id: number | string;
  wallet_notification: null | any;
  paid_amount_cents: number;
  notify_user_with_email: boolean;
  items: any[];
  order_url: string;
  commission_fees: number;
  delivery_fees_cents: number;
  delivery_vat_cents: number;
  payment_method: string;
  merchant_staff_tag: null | string;
  api_source: string;
  data: any;
}

interface PaymobPaymentKeyResponse {
  token: string;
}

export class PaymobService {
  private apiKey: string;
  private publicKey: string;
  private secretKey: string;
  private hmacSecret: string;

  constructor() {
    this.apiKey = process.env.PAYMOB_API_KEY || '';
    this.publicKey = process.env.PAYMOB_PUBLIC_KEY || '';
    this.secretKey = process.env.PAYMOB_SECRET_KEY || '';
    this.hmacSecret = process.env.PAYMOB_HMAC || '';

    if (!this.apiKey || !this.publicKey) {
      console.error('🚨 Paymob API keys not configured properly');
      console.error('Required keys: PAYMOB_API_KEY, PAYMOB_PUBLIC_KEY, PAYMOB_SECRET_KEY, PAYMOB_HMAC');
    }
  }

  // Step 1: Authentication - Get token
  async authenticate(): Promise<string> {
    try {
      console.log('🔐 Attempting Paymob authentication...');
      console.log('🔑 API Key exists:', !!this.apiKey);
      console.log('🔑 API Key length:', this.apiKey.length);
      
      const response = await fetch(`${PAYMOB_API_URL}/auth/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey
        })
      });

      console.log('📡 Paymob auth response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🚨 Paymob authentication failed:', response.status, errorText);
        
        if (response.status === 401) {
          throw new Error('مفاتيح Paymob غير صحيحة أو منتهية الصلاحية - يرجى التحقق من PAYMOB_API_KEY');
        }
        throw new Error(`فشل التحقق من Paymob: ${response.status} - ${errorText}`);
      }

      const data: PaymobAuthResponse = await response.json();
      console.log('✅ Paymob authentication successful');
      return data.token;
    } catch (error: any) {
      console.error('💥 Paymob authentication error:', error.message);
      if (error.message.includes('مفاتيح Paymob')) {
        throw error; // Re-throw the Arabic error message
      }
      throw new Error('فشل في الاتصال بخدمة Paymob - يرجى المحاولة لاحقاً');
    }
  }

  // Step 2: Create order
  async createOrder(authToken: string, orderData: {
    amount_cents: number;
    merchant_order_id: string;
    currency: string;
    items: any[];
  }): Promise<PaymobOrderResponse> {
    try {
      const response = await fetch(`${PAYMOB_API_URL}/ecommerce/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_token: authToken,
          delivery_needed: "true",
          amount_cents: orderData.amount_cents,
          currency: orderData.currency || "EGP",
          merchant_order_id: orderData.merchant_order_id,
          items: orderData.items
        })
      });

      if (!response.ok) {
        throw new Error(`Order creation failed: ${response.status}`);
      }

      const data: PaymobOrderResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Paymob order creation error:', error);
      throw new Error('Failed to create order with Paymob');
    }
  }

  // Step 3: Generate payment key
  async generatePaymentKey(authToken: string, paymentData: {
    amount_cents: number;
    expiration: number;
    order_id: number;
    billing_data: {
      apartment: string;
      email: string;
      floor: string;
      first_name: string;
      street: string;
      building: string;
      phone_number: string;
      shipping_method: string;
      postal_code: string;
      city: string;
      country: string;
      last_name: string;
      state: string;
    };
    currency: string;
    integration_id: number;
  }): Promise<string> {
    try {
      const response = await fetch(`${PAYMOB_API_URL}/acceptance/payment_keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth_token: authToken,
          amount_cents: paymentData.amount_cents,
          expiration: paymentData.expiration || 3600, // 1 hour
          order_id: paymentData.order_id,
          billing_data: paymentData.billing_data,
          currency: paymentData.currency || "EGP",
          integration_id: paymentData.integration_id
        })
      });

      if (!response.ok) {
        throw new Error(`Payment key generation failed: ${response.status}`);
      }

      const data: PaymobPaymentKeyResponse = await response.json();
      return data.token;
    } catch (error) {
      console.error('Paymob payment key generation error:', error);
      throw new Error('Failed to generate payment key');
    }
  }

  // Generate HMAC signature for validation
  generateHMAC(data: string): string {
    const crypto = require('crypto');
    return crypto.createHmac('sha512', this.hmacSecret).update(data).digest('hex');
  }

  // Validate callback HMAC
  validateCallback(callbackData: any): boolean {
    if (!this.hmacSecret) {
      console.warn('HMAC secret not configured - skipping validation');
      return true;
    }

    try {
      const {
        amount_cents,
        created_at,
        currency,
        error_occured,
        has_parent_transaction,
        id,
        integration_id,
        is_3d_secure,
        is_auth,
        is_capture,
        is_refunded,
        is_standalone_payment,
        is_voided,
        order,
        owner,
        pending,
        source_data_pan,
        source_data_sub_type,
        source_data_type,
        success
      } = callbackData;

      const concatenatedString = 
        `${amount_cents}${created_at}${currency}${error_occured}${has_parent_transaction}${id}${integration_id}${is_3d_secure}${is_auth}${is_capture}${is_refunded}${is_standalone_payment}${is_voided}${order?.id}${owner}${pending}${source_data_pan}${source_data_sub_type}${source_data_type}${success}`;

      const generatedHMAC = this.generateHMAC(concatenatedString);
      return generatedHMAC === callbackData.hmac;
    } catch (error) {
      console.error('HMAC validation error:', error);
      return false;
    }
  }
}

// Initialize Paymob service
const paymobService = new PaymobService();

// Create payment intention for Paymob
export async function createPaymobPayment(req: Request, res: Response) {
  try {
    const { amount, currency = 'EGP', orderId, customerData, items = [] } = req.body;

    if (!amount || !orderId || !customerData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: amount, orderId, customerData'
      });
    }

    // Step 1: Authenticate
    const authToken = await paymobService.authenticate();

    // Step 2: Create order
    const paymobOrder = await paymobService.createOrder(authToken, {
      amount_cents: Math.round(amount * 100), // Convert to cents
      merchant_order_id: orderId,
      currency,
      items: items.map((item: any) => ({
        name: item.name || 'Print Service',
        amount_cents: Math.round((item.price || 0) * 100),
        description: item.description || '',
        quantity: item.quantity || 1
      }))
    });

    // Step 3: Generate payment key (for iframe integration)
    const paymentKey = await paymobService.generatePaymentKey(authToken, {
      amount_cents: Math.round(amount * 100),
      expiration: 3600,
      order_id: paymobOrder.id,
      billing_data: {
        apartment: customerData.apartment || "NA",
        email: customerData.email || "customer@example.com",
        floor: customerData.floor || "NA",
        first_name: customerData.firstName || "Customer",
        street: customerData.address || "NA",
        building: customerData.building || "NA",
        phone_number: customerData.phone || "01000000000",
        shipping_method: "PKG",
        postal_code: customerData.postalCode || "12345",
        city: customerData.city || "Cairo",
        country: customerData.country || "Egypt",
        last_name: customerData.lastName || "User",
        state: customerData.state || "Cairo"
      },
      currency,
      integration_id: 4736159 // Default integration ID for cards
    });

    res.json({
      success: true,
      paymentKey,
      paymobOrderId: paymobOrder.id,
      iframeUrl: `https://accept.paymob.com/api/acceptance/iframes/${process.env.PAYMOB_IFRAME_ID}?payment_token=${paymentKey}`,
      amount_cents: Math.round(amount * 100),
      currency
    });

  } catch (error: any) {
    console.error('Create Paymob payment error:', error);
    
    // Special handling for authentication errors
    if (error.message.includes('مفاتيح Paymob')) {
      res.status(401).json({
        success: false,
        error: error.message,
        code: 'PAYMOB_AUTH_ERROR'
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message || 'فشل في إنشاء عملية الدفع'
      });
    }
  }
}

// Handle Paymob webhook/callback
export async function handlePaymobCallback(req: Request, res: Response) {
  try {
    const callbackData = req.body;

    // Validate HMAC signature
    const isValid = paymobService.validateCallback(callbackData);
    if (!isValid) {
      console.warn('Invalid HMAC signature for Paymob callback');
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }

    const {
      success,
      pending,
      id: transactionId,
      order: { merchant_order_id },
      amount_cents
    } = callbackData;

    console.log(`Paymob callback received: Transaction ${transactionId}, Order ${merchant_order_id}, Success: ${success}`);

    // Update order status based on payment result
    if (success === true && !pending) {
      // Payment successful
      try {
        // Update order status in database
        // This depends on your storage implementation
        console.log(`Payment successful for order ${merchant_order_id}`);
        
        // You can update the order status here
        // await storage.updateOrder(merchant_order_id, { 
        //   paymentStatus: 'paid',
        //   transactionId: transactionId,
        //   paidAt: new Date()
        // });
        
      } catch (updateError) {
        console.error('Error updating order after successful payment:', updateError);
      }
    } else if (success === false) {
      // Payment failed
      console.log(`Payment failed for order ${merchant_order_id}`);
      
      // await storage.updateOrder(merchant_order_id, { 
      //   paymentStatus: 'failed',
      //   transactionId: transactionId
      // });
    }

    res.json({ success: true });

  } catch (error: any) {
    console.error('Paymob callback error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Callback processing failed'
    });
  }
}

// Get supported payment methods for Paymob
export async function getPaymobPaymentMethods(req: Request, res: Response) {
  try {
    const paymentMethods = [
      {
        id: 'card',
        name: 'بطاقة ائتمانية',
        nameEn: 'Credit Card',
        icon: '💳',
        integration_id: 4736159
      },
      {
        id: 'vodafone_cash',
        name: 'فودافون كاش',
        nameEn: 'Vodafone Cash',
        icon: '📱',
        integration_id: 4736160
      },
      {
        id: 'orange_money',
        name: 'اورنچ موني',
        nameEn: 'Orange Money',
        icon: '🟠',
        integration_id: 4736161
      },
      {
        id: 'etisalat_cash',
        name: 'اتصالات كاش',
        nameEn: 'Etisalat Cash',
        icon: '🟢',
        integration_id: 4736162
      },
      {
        id: 'instapay',
        name: 'انستا باي',
        nameEn: 'InstaPay',
        icon: '⚡',
        integration_id: 4736163,
        comingSoon: true
      },
      {
        id: 'valu',
        name: 'فاليو',
        nameEn: 'valU',
        icon: '💰',
        integration_id: 4736164
      },
      {
        id: 'souhoola',
        name: 'سهولة',
        nameEn: 'Souhoola',
        icon: '💳',
        integration_id: 4736165
      }
    ];

    res.json({
      success: true,
      paymentMethods
    });

  } catch (error: any) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get payment methods'
    });
  }
}

export { paymobService };