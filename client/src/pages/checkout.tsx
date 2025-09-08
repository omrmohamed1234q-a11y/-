import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ShoppingBag, MapPin, CreditCard, Truck, Gift, Star, Package } from 'lucide-react';
import PaymentMethods from '@/components/PaymentMethods';

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { cart, isLoading, checkout, isCheckingOut } = useCart();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    deliveryAddress: '',
    buildingNumber: '',
    floor: '',
    apartment: '',
    landmarks: '',
    deliveryMethod: 'delivery',
    paymentMethod: 'paymob',
    notes: '',
    usePoints: false,
  });

  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);

  // Check if cart is empty and redirect
  useEffect(() => {
    if (!isLoading && (!cart?.items || cart.items.length === 0)) {
      toast({
        title: "السلة فارغة",
        description: "يرجى إضافة منتجات للسلة أولاً",
        variant: "destructive",
      });
      setLocation('/');
    }
  }, [cart, isLoading, setLocation, toast]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.customerName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال الاسم",
        variant: "destructive",
      });
      return;
    }

    if (!formData.customerPhone.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رقم الهاتف",
        variant: "destructive",
      });
      return;
    }

    if (formData.deliveryMethod === 'delivery' && !formData.deliveryAddress.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان التوصيل",
        variant: "destructive",
      });
      return;
    }

    // Format address
    const fullAddress = formData.deliveryMethod === 'delivery' 
      ? `${formData.deliveryAddress}${formData.buildingNumber ? `, مبنى رقم ${formData.buildingNumber}` : ''}${formData.floor ? `, الطابق ${formData.floor}` : ''}${formData.apartment ? `, شقة ${formData.apartment}` : ''}${formData.landmarks ? `. علامات مميزة: ${formData.landmarks}` : ''}`
      : 'استلام من الفرع';

    const checkoutData = {
      ...formData,
      deliveryAddress: fullAddress,
    };

    // TEMPORARY: Direct checkout without payment methods
    checkout(checkoutData, {
      onSuccess: () => {
        toast({
          title: "تم إنشاء الطلب بنجاح",
          description: "سيتم التواصل معك قريباً لتأكيد الطلب",
        });
        setLocation('/orders');
      },
    });
  };

  const handlePaymentSuccess = (result: any) => {
    toast({
      title: 'تم الدفع بنجاح',
      description: `تم الدفع بـ ${result.method}`,
    });
    setLocation('/orders');
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: 'فشل في الدفع',
      description: error,
      variant: 'destructive',
    });
    setShowPaymentMethods(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!cart?.items || cart.items.length === 0) {
    return null; // Will redirect via useEffect
  }

  const subtotal = cart.subtotal || 0;
  
  // New payment system calculations
  const baseFare = 5; // Fixed fee
  const costPerKm = 1.5; // Cost per kilometer
  const estimatedDistance = 5; // Default distance estimate for Suez area (can be dynamic later)
  const minimumOrderAmount = 45; // Minimum order amount for delivery
  
  // Service Fee: (Order Value × 5%) + Fixed Fee
  const serviceFee = (subtotal * 0.05) + baseFare;
  
  // Delivery Fee: Base Fare + (Distance × Cost per km) 
  const deliveryFee = formData.deliveryMethod === 'delivery' ? baseFare + (estimatedDistance * costPerKm) : 0;
  
  const pointsDiscount = formData.usePoints ? Math.min(50, Math.floor(subtotal * 0.05)) : 0;
  
  // New Total: Order Value + Delivery Fee + Service Fee
  const total = subtotal + deliveryFee + serviceFee - pointsDiscount;
  
  // Check minimum order amount for delivery
  const canDeliver = formData.deliveryMethod !== 'delivery' || subtotal >= minimumOrderAmount;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2" data-testid="checkout-title">
            إتمام الطلب
          </h1>
          <p className="text-gray-600">املأ البيانات التالية لإتمام طلبك</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    بيانات العميل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerName">الاسم *</Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => handleInputChange('customerName', e.target.value)}
                        placeholder="الاسم الكامل"
                        required
                        data-testid="customer-name-input"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerPhone">رقم الهاتف *</Label>
                      <Input
                        id="customerPhone"
                        value={formData.customerPhone}
                        onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                        placeholder="01XXXXXXXXX"
                        required
                        data-testid="customer-phone-input"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">البريد الإلكتروني (اختياري)</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                      placeholder="email@example.com"
                      data-testid="customer-email-input"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    طريقة الاستلام
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={formData.deliveryMethod}
                    onValueChange={(value) => handleInputChange('deliveryMethod', value)}
                    data-testid="delivery-method-group"
                  >
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="delivery" id="delivery" />
                      <Label htmlFor="delivery" className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        توصيل للمنزل
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="pickup" id="pickup" />
                      <Label htmlFor="pickup" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        استلام من الفرع
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Delivery Address - Only show if delivery is selected */}
              {formData.deliveryMethod === 'delivery' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      عنوان التوصيل
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="deliveryAddress">العنوان *</Label>
                      <Textarea
                        id="deliveryAddress"
                        value={formData.deliveryAddress}
                        onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                        placeholder="العنوان التفصيلي (الشارع، المنطقة، المحافظة)"
                        rows={3}
                        required={formData.deliveryMethod === 'delivery'}
                        data-testid="delivery-address-input"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="buildingNumber">رقم المبنى</Label>
                        <Input
                          id="buildingNumber"
                          value={formData.buildingNumber}
                          onChange={(e) => handleInputChange('buildingNumber', e.target.value)}
                          placeholder="رقم المبنى"
                          data-testid="building-number-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="floor">الطابق</Label>
                        <Input
                          id="floor"
                          value={formData.floor}
                          onChange={(e) => handleInputChange('floor', e.target.value)}
                          placeholder="الطابق"
                          data-testid="floor-input"
                        />
                      </div>
                      <div>
                        <Label htmlFor="apartment">الشقة</Label>
                        <Input
                          id="apartment"
                          value={formData.apartment}
                          onChange={(e) => handleInputChange('apartment', e.target.value)}
                          placeholder="رقم الشقة"
                          data-testid="apartment-input"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="landmarks">علامات مميزة</Label>
                      <Input
                        id="landmarks"
                        value={formData.landmarks}
                        onChange={(e) => handleInputChange('landmarks', e.target.value)}
                        placeholder="مثل: بجوار مسجد النور، أمام صيدلية الشفاء"
                        data-testid="landmarks-input"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Method - Temporary Notice */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    طريقة الدفع
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <Package className="h-6 w-6 text-yellow-600" />
                      <div>
                        <div className="font-medium text-yellow-900">الدفع عند الاستلام</div>
                        <div className="text-sm text-yellow-700">
                          سيتم التواصل معك لتأكيد الطلب وتحديد طريقة الدفع
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>ملاحظات إضافية</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="أي ملاحظات أو طلبات خاصة..."
                    rows={3}
                    data-testid="notes-input"
                  />
                </CardContent>
              </Card>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  ملخص الطلب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex gap-3 p-2 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Package className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{item.productName}</p>
                        <div className="flex items-center justify-between mt-1">
                          <Badge variant="secondary">{item.quantity}×</Badge>
                          <span className="text-sm font-bold text-green-600">
                            {(parseFloat(item.price) * item.quantity).toFixed(0)} جنيه
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Pricing Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>المجموع الفرعي</span>
                    <span data-testid="checkout-subtotal">{subtotal.toFixed(0)} جنيه</span>
                  </div>
                  {formData.deliveryMethod === 'delivery' && (
                    <div className="flex justify-between text-sm">
                      <span>رسوم التوصيل</span>
                      <span data-testid="checkout-delivery">
                        {deliveryFee.toFixed(0)} جنيه
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>رسوم الخدمة (5% + 5 ج.م)</span>
                    <span data-testid="service-fee">
                      {serviceFee.toFixed(0)} جنيه
                    </span>
                  </div>
                  <div className="bg-green-50 p-2 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <span>🇵🇸</span>
                      <span className="font-medium">بطلبك انت بتدعم فلسطين</span>
                    </div>
                  </div>
                  {pointsDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>خصم النقاط</span>
                      <span>-{pointsDiscount} جنيه</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>الإجمالي</span>
                    <span className="text-green-600" data-testid="checkout-total">
                      {total.toFixed(0)} جنيه
                    </span>
                  </div>
                </div>

                {/* Use Points Option */}
                <div className="flex items-center space-x-2 space-x-reverse p-3 bg-yellow-50 rounded-lg">
                  <Checkbox
                    id="usePoints"
                    checked={formData.usePoints}
                    onCheckedChange={(checked) => handleInputChange('usePoints', !!checked)}
                    data-testid="use-points-checkbox"
                  />
                  <Label htmlFor="usePoints" className="flex items-center gap-2 text-sm">
                    <Star className="h-4 w-4 text-yellow-500" />
                    استخدم النقاط المتاحة (خصم {pointsDiscount} جنيه)
                  </Label>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isCheckingOut}
                  className="w-full bg-green-600 hover:bg-green-700"
                  data-testid="submit-order-button"
                >
                  {isCheckingOut ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent ml-2" />
                      جاري إنشاء الطلب...
                    </>
                  ) : (
                    <>
                      <Gift className="h-4 w-4 ml-2" />
                      إتمام الطلب (مؤقت)
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  بتأكيد الطلب، توافق على شروط وأحكام الخدمة
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payment Methods Modal */}
        {showPaymentMethods && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">إتمام الدفع</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPaymentMethods(false)}
                    data-testid="close-payment-modal"
                  >
                    إلغاء
                  </Button>
                </div>

                <PaymentMethods
                  amount={total}
                  orderId={Date.now().toString()}
                  customerData={{
                    firstName: formData.customerName.split(' ')[0] || 'Customer',
                    lastName: formData.customerName.split(' ').slice(1).join(' ') || 'User',
                    email: formData.customerEmail || 'customer@example.com',
                    phone: formData.customerPhone,
                    address: formData.deliveryAddress,
                    building: formData.buildingNumber,
                    floor: formData.floor,
                    apartment: formData.apartment,
                    city: 'Cairo',
                    country: 'Egypt'
                  }}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}