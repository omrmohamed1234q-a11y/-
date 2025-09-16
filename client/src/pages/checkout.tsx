import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/use-auth';
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
import { ShoppingBag, MapPin, CreditCard, Truck, Gift, Star, Package, Tag, ShoppingCart, Calculator, Info, Heart, Settings, Ticket } from 'lucide-react';
import PaymentMethods from '@/components/PaymentMethods';
import DeliveryLocationSelector from '@/components/DeliveryLocationSelector';
import PhoneVerificationModal from '@/components/PhoneVerificationModal';
import type { LocationData, DeliveryValidation } from '@/utils/locationUtils';
import type { SelectedDeliveryLocation } from '@/components/DeliveryLocationSelector';
import { formatPrice, parsePrice } from '@/lib/utils';

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const { cart, isLoading, checkout, isCheckingOut } = useCart();
  const { user } = useAuth();
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

  // Location-based delivery states
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [locationValidation, setLocationValidation] = useState<DeliveryValidation | null>(null);

  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);

  // Phone verification states
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState<string | null>(null);

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

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

  // Coupon revalidation when cart changes (security feature)
  useEffect(() => {
    if (appliedCoupon && cart?.subtotal !== undefined) {
      // If cart subtotal has changed since coupon was applied, revalidate
      const currentSubtotal = cart.subtotal || 0;
      
      if (appliedCoupon.originalSubtotal && appliedCoupon.originalSubtotal !== currentSubtotal) {
        console.log('🔄 Cart changed, revalidating coupon...');
        
        // Automatically revalidate the coupon with new cart total
        const revalidateCoupon = async () => {
          try {
            const response = await fetch('/api/coupons/validate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                code: appliedCoupon.code,
                orderTotal: currentSubtotal,
                userId: user?.id || '',
              }),
            });

            if (response.ok) {
              const couponData = await response.json();
              // Update coupon with new discount amount for new cart total
              setAppliedCoupon({
                ...couponData,
                originalSubtotal: currentSubtotal
              });
              setCouponDiscount(couponData.discountAmount);
              toast({
                title: "تم تحديث الكوبون",
                description: `تم إعادة حساب الخصم: ${couponData.discountAmount} جنيه`,
              });
            } else {
              // Coupon no longer valid for new cart total
              setAppliedCoupon(null);
              setCouponDiscount(0);
              setCouponCode('');
              toast({
                title: "انتهت صلاحية الكوبون",
                description: "الكوبون لم يعد صالحاً بعد تعديل السلة",
                variant: "destructive",
              });
            }
          } catch (error) {
            console.error('Error revalidating coupon:', error);
            // Clear coupon on error to be safe
            setAppliedCoupon(null);
            setCouponDiscount(0);
            setCouponCode('');
            toast({
              title: "خطأ في التحقق من الكوبون",
              description: "تم إلغاء الكوبون احتياطياً",
              variant: "destructive",
            });
          }
        };

        revalidateCoupon();
      }
    }
  }, [cart?.subtotal, appliedCoupon, user?.id, toast]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle enhanced location selection from DeliveryLocationSelector
  const handleLocationSelect = (selection: SelectedDeliveryLocation) => {
    setSelectedLocation(selection.location);
    setLocationValidation(selection.validation);
    
    // Auto-fill delivery address with smart display name
    const displayAddress = selection.displayName || selection.location.address;
    if (displayAddress && selection.validation.isValid) {
      handleInputChange('deliveryAddress', displayAddress);
    }
  };

  // Handle location clear
  const handleLocationClear = () => {
    setSelectedLocation(null);
    setLocationValidation(null);
    handleInputChange('deliveryAddress', '');
  };

  // Coupon handling functions
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال كود الخصم",
        variant: "destructive",
      });
      return;
    }

    setIsApplyingCoupon(true);
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponCode,
          orderTotal: subtotal,
          userId: user?.id || '', // Real authenticated user ID
        }),
      });

      if (response.ok) {
        const couponData = await response.json();
        setAppliedCoupon({
          ...couponData,
          originalSubtotal: subtotal // Store original subtotal for revalidation
        });
        setCouponDiscount(couponData.discountAmount);
        toast({
          title: "تم تطبيق الكوبون",
          description: `تم خصم ${couponData.discountAmount} جنيه`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "كوبون غير صالح",
          description: error.message || "كود الخصم غير صحيح أو منتهي الصلاحية",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تطبيق الكوبون",
        variant: "destructive",
      });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponDiscount(0);
    toast({
      title: "تم إلغاء الكوبون",
      description: "تم إلغاء كود الخصم",
    });
  };

  // Phone verification handlers
  const handlePhoneVerificationSuccess = (phoneNumber: string, user: any) => {
    setIsPhoneVerified(true);
    setVerifiedPhoneNumber(phoneNumber);
    setShowPhoneVerification(false);
    
    toast({
      title: "تم التحقق من الهاتف",
      description: "تم التحقق من رقم هاتفك بنجاح",
    });

    // Continue with checkout after verification
    proceedWithCheckout();
  };

  const handlePhoneVerificationClose = () => {
    setShowPhoneVerification(false);
  };

  // Proceed with actual checkout
  const proceedWithCheckout = () => {
    // Format address
    const fullAddress = formData.deliveryMethod === 'delivery' 
      ? `${formData.deliveryAddress}${formData.buildingNumber ? `, مبنى رقم ${formData.buildingNumber}` : ''}${formData.floor ? `, الطابق ${formData.floor}` : ''}${formData.apartment ? `, شقة ${formData.apartment}` : ''}${formData.landmarks ? `. علامات مميزة: ${formData.landmarks}` : ''}`
      : 'استلام من الفرع';

    const checkoutData = {
      ...formData,
      customerPhone: verifiedPhoneNumber || formData.customerPhone,
      deliveryAddress: fullAddress,
      phoneVerified: isPhoneVerified,
      appliedCoupon: appliedCoupon ? {
        code: appliedCoupon.code,
        discountAmount: appliedCoupon.discountAmount,
        type: appliedCoupon.type || 'fixed'
      } : null,
    };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Show order summary with fees first
    if (!showOrderSummary) {
      setShowOrderSummary(true);
      return;
    }
    
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

    // Check minimum order amount for delivery
    if (formData.deliveryMethod === 'delivery' && subtotal < minimumOrderAmount) {
      toast({
        title: "خطأ",
        description: `الحد الأدنى للطلب بالتوصيل ${minimumOrderAmount} جنيه (السويس فقط)`,
        variant: "destructive",
      });
      return;
    }

    // Check location validity for delivery
    if (formData.deliveryMethod === 'delivery' && (!locationValidation || !locationValidation.isValid)) {
      toast({
        title: "خطأ",
        description: "يرجى تحديد موقع توصيل صالح في نطاق السويس",
        variant: "destructive",
      });
      return;
    }

    // Check if phone is already verified
    if (isPhoneVerified) {
      // Phone already verified, proceed with checkout
      proceedWithCheckout();
      return;
    }

    // Show phone verification modal
    setShowPhoneVerification(true);
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
  const minimumOrderAmount = 45; // Minimum order amount for delivery
  
  // Service Fee: (Order Value × 5%) + Fixed Fee
  const serviceFee = (subtotal * 0.05) + baseFare;
  
  // Dynamic Delivery Fee based on actual location
  const deliveryFee = formData.deliveryMethod === 'delivery' 
    ? (locationValidation && locationValidation.isValid 
        ? locationValidation.deliveryFee 
        : baseFare + (5 * 1.5)) // Default fallback: 5km × 1.5 + 5 base
    : 0;
  
  const pointsDiscount = formData.usePoints ? Math.min(50, Math.floor(subtotal * 0.05)) : 0;
  
  // New Total: Order Value + Delivery Fee + Service Fee - Discounts
  const total = subtotal + deliveryFee + serviceFee - pointsDiscount - couponDiscount;
  
  // Check minimum order amount and location validity for delivery
  const canDeliver = formData.deliveryMethod !== 'delivery' || 
    (subtotal >= minimumOrderAmount && (!selectedLocation || (locationValidation && locationValidation.isValid)));

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

              {/* Enhanced Delivery Location Selector - Only show if delivery is selected */}
              {formData.deliveryMethod === 'delivery' && (
                <DeliveryLocationSelector
                  onLocationSelect={handleLocationSelect}
                  onLocationClear={handleLocationClear}
                  currentSelection={selectedLocation ? {
                    type: 'gps',
                    location: selectedLocation,
                    validation: locationValidation || { isValid: false, distance: 0, deliveryFee: 0, message: '' },
                    displayName: selectedLocation.address || 'موقع محدد'
                  } : undefined}
                  className="mb-6"
                />
              )}

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
                {/* Cart Items with Enhanced Preview */}
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {cart.items.map((item) => {
                    const isPrintJob = (item.variant as any)?.isPrintJob || 
                                      (item as any).productSource === 'print_service' || 
                                      (item as any).printJobData;
                    const previewUrl = (item as any).previewUrl;
                    const printJobData = (item as any).printJobData || (item.variant as any)?.printJob || {};
                    
                    return (
                      <div key={item.id} className="p-3 border rounded-lg bg-white hover:shadow-sm transition-shadow" data-testid={`checkout-item-${item.id}`}>
                        <div className="flex gap-3">
                          {/* Enhanced Preview Section */}
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {isPrintJob && previewUrl ? (
                              <a
                                href={previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full h-full"
                                data-testid={`link-preview-${item.id}`}
                              >
                                <img
                                  src={previewUrl}
                                  alt={item.productName}
                                  className="w-full h-full object-cover rounded-lg hover:opacity-80 transition-opacity"
                                />
                              </a>
                            ) : isPrintJob ? (
                              <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                              </svg>
                            ) : item.productImage ? (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium line-clamp-2 mb-1">{item.productName}</p>
                                
                                {/* Print Job Details */}
                                {isPrintJob && (
                                  <div className="text-xs text-gray-600 space-y-1 mb-2">
                                    {/* Filename */}
                                    {printJobData.filename && (
                                      <div className="flex items-center gap-1">
                                        <span className="font-medium text-gray-700">📁 {printJobData.filename}</span>
                                      </div>
                                    )}
                                    
                                    <div className="grid grid-cols-1 gap-1 mt-1">
                                      {/* Pages and Copies */}
                                      {printJobData.pages && (
                                        <div className="flex items-center gap-1">
                                          <span>📄 {printJobData.pages} صفحة</span>
                                          {printJobData.copies > 1 && <span>× {printJobData.copies} نسخة</span>}
                                        </div>
                                      )}
                                      
                                      {/* Paper Size */}
                                      {printJobData.paperSize && (
                                        <div className="flex items-center gap-1">
                                          <span>📏 ورق {printJobData.paperSize}</span>
                                        </div>
                                      )}
                                      
                                      {/* Color Mode */}
                                      {printJobData.colorMode && (
                                        <div className="flex items-center gap-1">
                                          <span className={printJobData.colorMode === 'color' ? 'text-blue-600' : 'text-gray-600'}>
                                            {printJobData.colorMode === 'color' ? '🎨 طباعة ملونة' : '⚫ أبيض وأسود'}
                                          </span>
                                        </div>
                                      )}
                                      
                                      {/* Single/Double Sided */}
                                      <div className="flex items-center gap-1">
                                        <span>
                                          {printJobData.doubleSided || printJobData.double_sided ? 
                                            '🔄 وش وضهر' : '📄 وش فقط'
                                          }
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex items-center justify-between">
                                  <Badge variant="secondary" className="text-xs">{item.quantity}×</Badge>
                                  <span className="text-sm font-bold text-green-600">
                                    {formatPrice(parsePrice(item.price) * item.quantity)} جنيه
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator />

                {/* Coupon Code Section */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-orange-800">كوبون الخصم</span>
                  </div>
                  
                  {!appliedCoupon ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="أدخل كود الخصم"
                        className="flex-1 px-3 py-2 border border-orange-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        data-testid="coupon-input"
                        onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={applyCoupon}
                        disabled={isApplyingCoupon || !couponCode.trim()}
                        className="border-orange-300 text-orange-700 hover:bg-orange-100 disabled:opacity-50"
                        data-testid="apply-coupon-button"
                      >
                        {isApplyingCoupon ? 'جاري التطبيق...' : 'تطبيق'}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-green-100 border border-green-300 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-green-700 font-medium">✅ {appliedCoupon.code}</span>
                        <span className="text-green-600 text-sm">
                          خصم {couponDiscount} جنيه
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeCoupon}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid="remove-coupon-button"
                      >
                        إلغاء
                      </Button>
                    </div>
                  )}
                  
                  <div className="text-xs text-orange-600 mt-2">
                    💡 احصل على خصم إضافي باستخدام كود الخصم
                  </div>
                </div>

                {/* Enhanced Pricing Summary */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <ShoppingCart className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">ملخص الطلب</h3>
                        <p className="text-blue-100 text-sm">مراجعة التكلفة النهائية</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {!showOrderSummary ? (
                      /* Initial view - Professional subtotal card */
                      <>
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-xl border-2 border-dashed border-gray-300">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-100 p-2 rounded-lg">
                                <Calculator className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <span className="text-gray-700 font-semibold text-lg">المجموع الفرعي</span>
                                <p className="text-gray-500 text-xs">قيمة المنتجات</p>
                              </div>
                            </div>
                            <div className="text-left">
                              <span className="text-2xl font-bold text-gray-900" data-testid="checkout-subtotal">
                                <span className="currency-display">
                                  <span className="arabic-nums">{formatPrice(subtotal)}</span>
                                </span>
                              </span>
                              <span className="text-lg font-medium text-gray-600 mr-2">جنيه</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-2 text-blue-700">
                            <div className="bg-blue-100 p-1 rounded">
                              <Info className="h-4 w-4" />
                            </div>
                            <span className="font-medium text-sm">معلومة هامة</span>
                          </div>
                          <p className="text-blue-600 text-xs mt-2 leading-relaxed">
                            رسوم التوصيل والخدمة ستحسب تلقائياً حسب العنوان المختار عند إتمام الطلب
                          </p>
                        </div>
                      </>
                    ) : (
                      /* Detailed pricing breakdown */
                      <>
                        {/* Subtotal Section */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="bg-gray-200 p-1.5 rounded">
                                <Package className="h-4 w-4 text-gray-600" />
                              </div>
                              <span className="text-gray-700 font-medium">المجموع الفرعي</span>
                            </div>
                            <span className="font-semibold text-gray-900" data-testid="checkout-subtotal">
                              <span className="currency-display">
                                <span className="arabic-nums">{formatPrice(subtotal)}</span> جنيه
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Fees Section */}
                        <div className="space-y-3">
                          {formData.deliveryMethod === 'delivery' && (
                            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className="bg-amber-100 p-1.5 rounded">
                                    <Truck className="h-4 w-4 text-amber-600" />
                                  </div>
                                  <span className="text-amber-800 font-medium text-sm">رسوم التوصيل</span>
                                </div>
                                <span className="font-semibold text-amber-900" data-testid="checkout-delivery">
                                  {formatPrice(deliveryFee)} جنيه
                                </span>
                              </div>
                            </div>
                          )}
                          
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div className="bg-blue-100 p-1.5 rounded">
                                  <Settings className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                  <span className="text-blue-800 font-medium text-sm">رسوم الخدمة</span>
                                  <p className="text-blue-600 text-xs">(5% + 5 ج.م)</p>
                                </div>
                              </div>
                              <span className="font-semibold text-blue-900" data-testid="service-fee">
                                {formatPrice(serviceFee)} جنيه
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Discounts Section */}
                        {(pointsDiscount > 0 || couponDiscount > 0) && (
                          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="bg-green-100 p-1.5 rounded">
                                <Tag className="h-4 w-4 text-green-600" />
                              </div>
                              <span className="text-green-800 font-semibold">الخصومات المطبقة</span>
                            </div>
                            
                            <div className="space-y-2">
                              {pointsDiscount > 0 && (
                                <div className="flex justify-between items-center p-2 bg-green-100 rounded">
                                  <div className="flex items-center gap-2">
                                    <Star className="h-4 w-4 text-yellow-500" />
                                    <span className="text-green-700 text-sm">خصم النقاط</span>
                                  </div>
                                  <span className="font-semibold text-green-800">-{pointsDiscount} جنيه</span>
                                </div>
                              )}
                              
                              {couponDiscount > 0 && (
                                <div className="flex justify-between items-center p-2 bg-orange-100 rounded">
                                  <div className="flex items-center gap-2">
                                    <Ticket className="h-4 w-4 text-orange-500" />
                                    <div>
                                      <span className="text-orange-700 text-sm">كوبون الخصم</span>
                                      <p className="text-orange-600 text-xs">({appliedCoupon?.code})</p>
                                    </div>
                                  </div>
                                  <span className="font-semibold text-orange-800">-{couponDiscount} جنيه</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Total Section */}
                        <div className="bg-gradient-to-r from-green-500 to-green-600 p-5 rounded-xl text-white">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="bg-white/20 p-2 rounded-lg">
                                <CreditCard className="h-6 w-6" />
                              </div>
                              <div>
                                <h4 className="font-bold text-xl">إجمالي المبلغ</h4>
                                <p className="text-green-100 text-sm">المبلغ النهائي المطلوب دفعه</p>
                              </div>
                            </div>
                            <div className="text-left">
                              <span className="text-3xl font-bold" data-testid="checkout-total">
                                {formatPrice(total)}
                              </span>
                              <span className="text-xl font-medium mr-2">جنيه</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Palestine Support Section */}
                    <div className="bg-gradient-to-r from-green-50 via-white to-red-50 p-4 rounded-lg border-2 border-green-200">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="bg-green-100 p-2 rounded-full">
                          <Heart className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-bold text-green-800 flex items-center gap-2">
                            <span>🇵🇸</span>
                            بطلبك أنت بتدعم فلسطين
                          </h4>
                          <p className="text-green-600 text-xs">
                            جزء من أرباحنا يذهب لدعم الشعب الفلسطيني الصامد
                          </p>
                        </div>
                      </div>
                    </div>
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
                  disabled={isCheckingOut || (!showOrderSummary && !canDeliver)}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
                  data-testid="submit-order-button"
                >
                  {isCheckingOut ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent ml-2" />
                      جاري إنشاء الطلب...
                    </>
                  ) : !showOrderSummary ? (
                    <>
                      <Gift className="h-4 w-4 ml-2" />
                      إتمام الطلب
                    </>
                  ) : (
                    <>
                      <Gift className="h-4 w-4 ml-2" />
                      تأكيد الطلب ومتابعة الدفع
                    </>
                  )}
                </Button>

                {/* Validation Messages */}
                {formData.deliveryMethod === 'delivery' && subtotal < minimumOrderAmount && (
                  <div className="text-center p-2 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-600">
                      الحد الأدنى للطلب بالتوصيل: {minimumOrderAmount} جنيه (السويس فقط)
                    </p>
                  </div>
                )}
                
                {formData.deliveryMethod === 'delivery' && (!locationValidation || !locationValidation.isValid) && (
                  <div className="text-center p-2 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-600">
                      يرجى تحديد موقع توصيل صالح في نطاق السويس
                    </p>
                  </div>
                )}

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

        {/* Phone Verification Modal */}
        {showPhoneVerification && (
          <PhoneVerificationModal
            isOpen={showPhoneVerification}
            onClose={handlePhoneVerificationClose}
            onVerificationSuccess={handlePhoneVerificationSuccess}
            phoneNumber={formData.customerPhone}
          />
        )}
      </div>
    </div>
  );
}