import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  MapPin, Clock, CreditCard, Truck, Store, 
  Calendar, Phone, Home, Building, 
  ChevronRight, ShoppingCart, Package, Gift
} from 'lucide-react';

interface CheckoutStep {
  id: number;
  title: string;
  icon: any;
  completed: boolean;
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [orderData, setOrderData] = useState({
    addressId: '',
    newAddress: {
      street: '',
      building: '',
      floor: '',
      apartment: '',
      area: '',
      city: '',
      landmark: '',
      phone: '',
      label: 'منزل',
      instructions: ''
    },
    deliveryMethod: 'delivery',
    deliverySlot: 'asap',
    scheduledDate: '',
    scheduledTime: '',
    paymentMethod: 'cash',
    cardDetails: {
      number: '',
      name: '',
      expiry: '',
      cvv: ''
    },
    vodafoneCashNumber: '',
    notes: ''
  });

  const steps: CheckoutStep[] = [
    { id: 1, title: 'العنوان والتوصيل', icon: MapPin, completed: currentStep > 1 },
    { id: 2, title: 'طريقة الدفع', icon: CreditCard, completed: currentStep > 2 },
    { id: 3, title: 'مراجعة الطلب', icon: Package, completed: false }
  ];

  // Fetch cart data
  const { data: cartData } = useQuery({
    queryKey: ['/api/cart'],
  });

  // Fetch saved addresses
  const { data: savedAddresses } = useQuery({
    queryKey: ['/api/addresses'],
  });

  // Fetch delivery slots
  const { data: deliverySlots } = useQuery({
    queryKey: ['/api/delivery-slots'],
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/orders', data);
      return response.json();
    },
    onSuccess: async (data) => {
      // Create notification for new order
      try {
        await apiRequest('POST', '/api/notifications', {
          userId: data.userId || '48c03e72-d53b-4a3f-a729-c38276268315',
          type: 'order',
          message: `تم إنشاء طلبك الجديد رقم #${data.orderNumber || data.id} بنجاح. سيتم معالجته خلال دقائق.`,
          metadata: {
            orderId: data.id,
            orderTotal: data.totalAmount
          }
        });
      } catch (error) {
        console.error('Error creating notification:', error);
      }
      
      toast({
        title: 'تم إنشاء الطلب بنجاح',
        description: `رقم الطلب: ${data.orderNumber}`,
      });
      setLocation(`/orders/${data.id}`);
    },
    onError: () => {
      toast({
        title: 'خطأ في إنشاء الطلب',
        description: 'حدث خطأ أثناء إنشاء الطلب. حاول مرة أخرى.',
        variant: 'destructive',
      });
    },
  });

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCompleteOrder = () => {
    createOrderMutation.mutate(orderData);
  };

  const calculateTotal = () => {
    if (!cartData) return 0;
    const subtotal = cartData.subtotal || 0;
    const discount = cartData.discount || 0;
    const shipping = orderData.deliveryMethod === 'delivery' ? 15 : 0;
    const tax = subtotal * 0.15; // 15% VAT
    return subtotal - discount + shipping + tax;
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-6 h-6" />
            <h1 className="text-2xl font-bold">إتمام الطلب</h1>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
                  ${currentStep >= step.id ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-gray-300'}`}>
                  {step.completed ? '✓' : step.id}
                </div>
                <div className="flex-1 mx-2">
                  <div className={`h-1 ${currentStep > step.id ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                </div>
                <span className={`text-sm ${currentStep >= step.id ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Address & Delivery */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    العنوان والتوصيل
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Delivery Method */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">طريقة الاستلام</Label>
                    <RadioGroup
                      value={orderData.deliveryMethod}
                      onValueChange={(value) => setOrderData({...orderData, deliveryMethod: value})}
                    >
                      <div className="flex gap-4">
                        <div className={`flex-1 p-4 border rounded-lg cursor-pointer transition-all
                          ${orderData.deliveryMethod === 'delivery' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}
                          onClick={() => setOrderData({...orderData, deliveryMethod: 'delivery'})}>
                          <RadioGroupItem value="delivery" id="delivery" className="mb-2" />
                          <Label htmlFor="delivery" className="cursor-pointer">
                            <div className="flex items-center gap-2 mb-1">
                              <Truck className="w-4 h-4" />
                              <span className="font-semibold">توصيل للمنزل</span>
                            </div>
                            <p className="text-sm text-gray-600">توصيل خلال 30-45 دقيقة</p>
                            <p className="text-sm font-semibold text-green-600 mt-1">رسوم التوصيل: 15 جنيه</p>
                          </Label>
                        </div>

                        <div className={`flex-1 p-4 border rounded-lg cursor-pointer transition-all
                          ${orderData.deliveryMethod === 'pickup' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}
                          onClick={() => setOrderData({...orderData, deliveryMethod: 'pickup'})}>
                          <RadioGroupItem value="pickup" id="pickup" className="mb-2" />
                          <Label htmlFor="pickup" className="cursor-pointer">
                            <div className="flex items-center gap-2 mb-1">
                              <Store className="w-4 h-4" />
                              <span className="font-semibold">استلام من الفرع</span>
                            </div>
                            <p className="text-sm text-gray-600">جاهز خلال 15-20 دقيقة</p>
                            <p className="text-sm font-semibold text-green-600 mt-1">بدون رسوم توصيل</p>
                          </Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Address Selection (for delivery) */}
                  {orderData.deliveryMethod === 'delivery' && (
                    <div>
                      <Label className="text-base font-semibold mb-3 block">عنوان التوصيل</Label>
                      
                      {/* Saved Addresses */}
                      {savedAddresses?.length > 0 && (
                        <RadioGroup
                          value={orderData.addressId}
                          onValueChange={(value) => setOrderData({...orderData, addressId: value})}
                        >
                          <div className="space-y-2 mb-4">
                            {savedAddresses.map((address: any) => (
                              <div
                                key={address.id}
                                className={`p-3 border rounded-lg cursor-pointer transition-all
                                  ${orderData.addressId === address.id ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}
                                onClick={() => setOrderData({...orderData, addressId: address.id})}
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      {address.label === 'منزل' ? <Home className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                                      <span className="font-semibold">{address.label}</span>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                      {address.street}، {address.building}، {address.area}، {address.city}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                      <Phone className="w-3 h-3 inline ml-1" />
                                      {address.phone}
                                    </p>
                                  </div>
                                  <RadioGroupItem value={address.id} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                      )}

                      {/* Add New Address */}
                      <div
                        className={`p-3 border rounded-lg cursor-pointer transition-all mb-4
                          ${orderData.addressId === 'new' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}
                        onClick={() => setOrderData({...orderData, addressId: 'new'})}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center">
                            <span className="text-gray-400">+</span>
                          </div>
                          <span className="font-semibold">أضف عنواناً جديداً</span>
                        </div>
                      </div>

                      {/* New Address Form */}
                      {orderData.addressId === 'new' && (
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="street">الشارع</Label>
                              <Input
                                id="street"
                                value={orderData.newAddress.street}
                                onChange={(e) => setOrderData({
                                  ...orderData,
                                  newAddress: {...orderData.newAddress, street: e.target.value}
                                })}
                                placeholder="اسم الشارع"
                              />
                            </div>
                            <div>
                              <Label htmlFor="building">رقم المبنى</Label>
                              <Input
                                id="building"
                                value={orderData.newAddress.building}
                                onChange={(e) => setOrderData({
                                  ...orderData,
                                  newAddress: {...orderData.newAddress, building: e.target.value}
                                })}
                                placeholder="رقم المبنى"
                              />
                            </div>
                            <div>
                              <Label htmlFor="floor">الطابق</Label>
                              <Input
                                id="floor"
                                value={orderData.newAddress.floor}
                                onChange={(e) => setOrderData({
                                  ...orderData,
                                  newAddress: {...orderData.newAddress, floor: e.target.value}
                                })}
                                placeholder="رقم الطابق"
                              />
                            </div>
                            <div>
                              <Label htmlFor="apartment">الشقة</Label>
                              <Input
                                id="apartment"
                                value={orderData.newAddress.apartment}
                                onChange={(e) => setOrderData({
                                  ...orderData,
                                  newAddress: {...orderData.newAddress, apartment: e.target.value}
                                })}
                                placeholder="رقم الشقة"
                              />
                            </div>
                            <div>
                              <Label htmlFor="area">المنطقة</Label>
                              <Input
                                id="area"
                                value={orderData.newAddress.area}
                                onChange={(e) => setOrderData({
                                  ...orderData,
                                  newAddress: {...orderData.newAddress, area: e.target.value}
                                })}
                                placeholder="المنطقة"
                              />
                            </div>
                            <div>
                              <Label htmlFor="city">المدينة</Label>
                              <Input
                                id="city"
                                value={orderData.newAddress.city}
                                onChange={(e) => setOrderData({
                                  ...orderData,
                                  newAddress: {...orderData.newAddress, city: e.target.value}
                                })}
                                placeholder="المدينة"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label htmlFor="landmark">علامة مميزة</Label>
                              <Input
                                id="landmark"
                                value={orderData.newAddress.landmark}
                                onChange={(e) => setOrderData({
                                  ...orderData,
                                  newAddress: {...orderData.newAddress, landmark: e.target.value}
                                })}
                                placeholder="بجوار..."
                              />
                            </div>
                            <div className="col-span-2">
                              <Label htmlFor="phone">رقم الهاتف</Label>
                              <Input
                                id="phone"
                                value={orderData.newAddress.phone}
                                onChange={(e) => setOrderData({
                                  ...orderData,
                                  newAddress: {...orderData.newAddress, phone: e.target.value}
                                })}
                                placeholder="01XXXXXXXXX"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label htmlFor="instructions">ملاحظات للسائق</Label>
                              <Input
                                id="instructions"
                                value={orderData.newAddress.instructions}
                                onChange={(e) => setOrderData({
                                  ...orderData,
                                  newAddress: {...orderData.newAddress, instructions: e.target.value}
                                })}
                                placeholder="اتصل قبل الوصول، البوابة الثانية، إلخ..."
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delivery Time */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">موعد التوصيل</Label>
                    <RadioGroup
                      value={orderData.deliverySlot}
                      onValueChange={(value) => setOrderData({...orderData, deliverySlot: value})}
                    >
                      <div className="space-y-2">
                        <div className={`p-3 border rounded-lg cursor-pointer transition-all
                          ${orderData.deliverySlot === 'asap' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}
                          onClick={() => setOrderData({...orderData, deliverySlot: 'asap'})}>
                          <RadioGroupItem value="asap" id="asap" className="mb-1" />
                          <Label htmlFor="asap" className="cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span className="font-semibold">في أقرب وقت ممكن</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">توصيل خلال 30-45 دقيقة</p>
                          </Label>
                        </div>

                        <div className={`p-3 border rounded-lg cursor-pointer transition-all
                          ${orderData.deliverySlot === 'scheduled' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}
                          onClick={() => setOrderData({...orderData, deliverySlot: 'scheduled'})}>
                          <RadioGroupItem value="scheduled" id="scheduled" className="mb-1" />
                          <Label htmlFor="scheduled" className="cursor-pointer">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span className="font-semibold">جدولة التوصيل</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">اختر التاريخ والوقت المناسب</p>
                          </Label>
                        </div>

                        {orderData.deliverySlot === 'scheduled' && (
                          <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                            <div>
                              <Label htmlFor="date">التاريخ</Label>
                              <Input
                                id="date"
                                type="date"
                                value={orderData.scheduledDate}
                                onChange={(e) => setOrderData({...orderData, scheduledDate: e.target.value})}
                              />
                            </div>
                            <div>
                              <Label htmlFor="time">الوقت</Label>
                              <select
                                id="time"
                                className="w-full p-2 border rounded-md"
                                value={orderData.scheduledTime}
                                onChange={(e) => setOrderData({...orderData, scheduledTime: e.target.value})}
                              >
                                <option value="">اختر الوقت</option>
                                {deliverySlots?.map((slot: any) => (
                                  <option key={slot.id} value={slot.time}>
                                    {slot.label} ({slot.time})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setLocation('/cart')}>
                      العودة للسلة
                    </Button>
                    <Button onClick={handleNextStep} className="bg-green-600 hover:bg-green-700">
                      التالي: طريقة الدفع
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Payment */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    طريقة الدفع
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RadioGroup
                    value={orderData.paymentMethod}
                    onValueChange={(value) => setOrderData({...orderData, paymentMethod: value})}
                  >
                    <div className="space-y-3">
                      {/* Cash on Delivery */}
                      <div className={`p-4 border rounded-lg cursor-pointer transition-all
                        ${orderData.paymentMethod === 'cash' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}
                        onClick={() => setOrderData({...orderData, paymentMethod: 'cash'})}>
                        <RadioGroupItem value="cash" id="cash" className="mb-2" />
                        <Label htmlFor="cash" className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <img src="/icons/cash.svg" alt="Cash" className="w-6 h-6" />
                            <span className="font-semibold">الدفع عند الاستلام</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">ادفع نقداً عند استلام طلبك</p>
                        </Label>
                      </div>

                      {/* Credit/Debit Card */}
                      <div className={`p-4 border rounded-lg cursor-pointer transition-all
                        ${orderData.paymentMethod === 'card' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}
                        onClick={() => setOrderData({...orderData, paymentMethod: 'card'})}>
                        <RadioGroupItem value="card" id="card" className="mb-2" />
                        <Label htmlFor="card" className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <img src="/icons/visa-mastercard.svg" alt="Card" className="w-12 h-6" />
                            <span className="font-semibold">بطاقة ائتمان/خصم</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">Visa, Mastercard, Mada</p>
                        </Label>
                      </div>

                      {orderData.paymentMethod === 'card' && (
                        <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                          <div>
                            <Label htmlFor="cardNumber">رقم البطاقة</Label>
                            <Input
                              id="cardNumber"
                              placeholder="1234 5678 9012 3456"
                              value={orderData.cardDetails.number}
                              onChange={(e) => setOrderData({
                                ...orderData,
                                cardDetails: {...orderData.cardDetails, number: e.target.value}
                              })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="cardName">اسم حامل البطاقة</Label>
                            <Input
                              id="cardName"
                              placeholder="الاسم كما هو على البطاقة"
                              value={orderData.cardDetails.name}
                              onChange={(e) => setOrderData({
                                ...orderData,
                                cardDetails: {...orderData.cardDetails, name: e.target.value}
                              })}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="expiry">تاريخ الانتهاء</Label>
                              <Input
                                id="expiry"
                                placeholder="MM/YY"
                                value={orderData.cardDetails.expiry}
                                onChange={(e) => setOrderData({
                                  ...orderData,
                                  cardDetails: {...orderData.cardDetails, expiry: e.target.value}
                                })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="cvv">CVV</Label>
                              <Input
                                id="cvv"
                                placeholder="123"
                                value={orderData.cardDetails.cvv}
                                onChange={(e) => setOrderData({
                                  ...orderData,
                                  cardDetails: {...orderData.cardDetails, cvv: e.target.value}
                                })}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Vodafone Cash */}
                      <div className={`p-4 border rounded-lg cursor-pointer transition-all
                        ${orderData.paymentMethod === 'vodafone' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}
                        onClick={() => setOrderData({...orderData, paymentMethod: 'vodafone'})}>
                        <RadioGroupItem value="vodafone" id="vodafone" className="mb-2" />
                        <Label htmlFor="vodafone" className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <img src="/icons/vodafone-cash.svg" alt="Vodafone" className="w-6 h-6" />
                            <span className="font-semibold">فودافون كاش</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">ادفع من محفظة فودافون كاش</p>
                        </Label>
                      </div>

                      {orderData.paymentMethod === 'vodafone' && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <Label htmlFor="vodafoneNumber">رقم فودافون كاش</Label>
                          <Input
                            id="vodafoneNumber"
                            placeholder="010XXXXXXXX"
                            value={orderData.vodafoneCashNumber}
                            onChange={(e) => setOrderData({...orderData, vodafoneCashNumber: e.target.value})}
                          />
                        </div>
                      )}

                      {/* Fawry */}
                      <div className={`p-4 border rounded-lg cursor-pointer transition-all
                        ${orderData.paymentMethod === 'fawry' ? 'border-green-600 bg-green-50' : 'border-gray-200'}`}
                        onClick={() => setOrderData({...orderData, paymentMethod: 'fawry'})}>
                        <RadioGroupItem value="fawry" id="fawry" className="mb-2" />
                        <Label htmlFor="fawry" className="cursor-pointer">
                          <div className="flex items-center gap-2">
                            <img src="/icons/fawry.svg" alt="Fawry" className="w-6 h-6" />
                            <span className="font-semibold">فوري</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">ادفع من أقرب نقطة فوري</p>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handlePreviousStep}>
                      السابق
                    </Button>
                    <Button onClick={handleNextStep} className="bg-green-600 hover:bg-green-700">
                      التالي: مراجعة الطلب
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Order Review */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    مراجعة الطلب
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Order Items */}
                  <div>
                    <h3 className="font-semibold mb-3">المنتجات ({cartData?.items?.length})</h3>
                    <div className="space-y-2">
                      {cartData?.items?.map((item: any) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                          <img
                            src={item.productImage || 'https://via.placeholder.com/60'}
                            alt={item.productName}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.productName}</p>
                            <p className="text-xs text-gray-500">الكمية: {item.quantity}</p>
                          </div>
                          <span className="font-semibold">{item.price * item.quantity} جنيه</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Delivery Details */}
                  <div>
                    <h3 className="font-semibold mb-3">تفاصيل التوصيل</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">طريقة الاستلام:</span>
                        <span>{orderData.deliveryMethod === 'delivery' ? 'توصيل للمنزل' : 'استلام من الفرع'}</span>
                      </div>
                      {orderData.deliveryMethod === 'delivery' && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">العنوان:</span>
                          <span className="text-right max-w-xs">
                            {orderData.addressId === 'new' 
                              ? `${orderData.newAddress.street}, ${orderData.newAddress.area}`
                              : savedAddresses?.find((a: any) => a.id === orderData.addressId)?.street
                            }
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">موعد التوصيل:</span>
                        <span>
                          {orderData.deliverySlot === 'asap' 
                            ? 'في أقرب وقت ممكن'
                            : `${orderData.scheduledDate} ${orderData.scheduledTime}`
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Payment Details */}
                  <div>
                    <h3 className="font-semibold mb-3">طريقة الدفع</h3>
                    <div className="text-sm">
                      {orderData.paymentMethod === 'cash' && 'الدفع عند الاستلام'}
                      {orderData.paymentMethod === 'card' && `بطاقة تنتهي بـ ${orderData.cardDetails.number.slice(-4)}`}
                      {orderData.paymentMethod === 'vodafone' && 'فودافون كاش'}
                      {orderData.paymentMethod === 'fawry' && 'فوري'}
                    </div>
                  </div>

                  <Separator />

                  {/* Final Total */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>المجموع الفرعي</span>
                      <span>{cartData?.subtotal} جنيه</span>
                    </div>
                    {cartData?.discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>الخصم</span>
                        <span>-{cartData.discount} جنيه</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span>رسوم التوصيل</span>
                      <span>{orderData.deliveryMethod === 'delivery' ? '15' : '0'} جنيه</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>الضريبة (15%)</span>
                      <span>{(cartData?.subtotal * 0.15).toFixed(2)} جنيه</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>الإجمالي</span>
                      <span className="text-green-600">{calculateTotal()} جنيه</span>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={handlePreviousStep}>
                      السابق
                    </Button>
                    <Button 
                      onClick={handleCompleteOrder} 
                      className="bg-green-600 hover:bg-green-700"
                      disabled={createOrderMutation.isPending}
                    >
                      {createOrderMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          جاري الإرسال...
                        </div>
                      ) : (
                        'إتمام الطلب'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-base">ملخص الطلب</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>عدد المنتجات</span>
                    <span>{cartData?.items?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>المجموع الفرعي</span>
                    <span>{cartData?.subtotal || 0} جنيه</span>
                  </div>
                  {cartData?.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>الخصم</span>
                      <span>-{cartData.discount} جنيه</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>رسوم التوصيل</span>
                    <span>{orderData.deliveryMethod === 'delivery' ? '15' : '0'} جنيه</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>الضريبة (15%)</span>
                    <span>{((cartData?.subtotal || 0) * 0.15).toFixed(2)} جنيه</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>الإجمالي</span>
                    <span className="text-green-600">{calculateTotal()} جنيه</span>
                  </div>

                  {/* Promo Section */}
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-700">
                      <Gift className="w-4 h-4" />
                      <span className="text-sm font-semibold">احصل على 50 نقطة مكافآت</span>
                    </div>
                    <p className="text-xs text-yellow-600 mt-1">عند إتمام هذا الطلب</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}