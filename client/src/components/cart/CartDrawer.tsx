import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { ShoppingCart, Plus, Minus, Trash2, Tag, Gift, Truck, X } from 'lucide-react';
import { useLocation } from 'wouter';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  variant?: {
    size?: string;
    color?: string;
  };
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [couponCode, setCouponCode] = useState('');
  const [usePoints, setUsePoints] = useState(false);
  const [orderNote, setOrderNote] = useState('');

  // Fetch cart items
  const { data: cartData, isLoading } = useQuery({
    queryKey: ['/api/cart'],
    enabled: isOpen,
  });

  // Fetch suggested products
  const { data: suggestedProducts } = useQuery({
    queryKey: ['/api/cart/suggestions'],
    enabled: isOpen,
  });

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const response = await apiRequest('PUT', `/api/cart/items/${itemId}`, { quantity });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest('DELETE', `/api/cart/items/${itemId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: 'تم الحذف',
        description: 'تم إزالة المنتج من السلة',
      });
    },
  });

  // Apply coupon mutation
  const applyCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest('POST', '/api/cart/apply-coupon', { code });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      toast({
        title: 'تم تطبيق الكوبون',
        description: `خصم ${data.discount}% على طلبك`,
      });
    },
    onError: () => {
      toast({
        title: 'كوبون غير صالح',
        description: 'الرجاء التحقق من الكود المدخل',
        variant: 'destructive',
      });
    },
  });

  const handleQuantityChange = (itemId: string, currentQty: number, change: number) => {
    const newQty = currentQty + change;
    if (newQty > 0) {
      updateQuantityMutation.mutate({ itemId, quantity: newQty });
    }
  };

  const handleCheckout = () => {
    onClose();
    setLocation('/checkout');
  };

  const handleContinueShopping = () => {
    onClose();
  };

  const calculateSubtotal = () => {
    if (!cartData?.items) return 0;
    return cartData.items.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = cartData?.discount || 0;
    const shipping = cartData?.shipping || 0;
    const pointsDiscount = usePoints ? (cartData?.availablePoints || 0) * 0.1 : 0;
    
    return subtotal - (subtotal * discount / 100) - pointsDiscount + shipping;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto" dir="rtl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            سلة التسوق ({cartData?.items?.length || 0} منتج)
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : cartData?.items?.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">سلتك فارغة</p>
              <Button onClick={handleContinueShopping}>
                تسوق الآن
              </Button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-4">
                {cartData?.items?.map((item: CartItem) => (
                  <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                    <img
                      src={item.productImage || 'https://via.placeholder.com/80'}
                      alt={item.productName}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{item.productName}</h4>
                      {item.variant && (
                        <div className="text-xs text-gray-500 mt-1">
                          {item.variant.size && <span>الحجم: {item.variant.size}</span>}
                          {item.variant.color && <span className="mr-2">اللون: {item.variant.color}</span>}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-green-600">
                          {item.price} ر.س
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                            disabled={updateQuantityMutation.isPending}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                            disabled={updateQuantityMutation.isPending}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500"
                            onClick={() => removeItemMutation.mutate(item.id)}
                            disabled={removeItemMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Suggested Products */}
              {suggestedProducts?.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-3 text-sm">اشترى المستخدمون أيضاً</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {suggestedProducts.map((product: any) => (
                      <div key={product.id} className="min-w-[120px] text-center">
                        <img
                          src={product.image || 'https://via.placeholder.com/120'}
                          alt={product.name}
                          className="w-full h-24 object-cover rounded-md mb-1"
                        />
                        <p className="text-xs line-clamp-2">{product.name}</p>
                        <p className="text-xs font-bold text-green-600">{product.price} ر.س</p>
                        <Button size="sm" variant="outline" className="mt-1 text-xs">
                          أضف للسلة
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Coupon & Points */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="كود الخصم"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => applyCouponMutation.mutate(couponCode)}
                    disabled={!couponCode || applyCouponMutation.isPending}
                  >
                    <Tag className="w-4 h-4 ml-1" />
                    تطبيق
                  </Button>
                </div>

                {cartData?.availablePoints > 0 && (
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">استخدم {cartData.availablePoints} نقطة</span>
                      <Badge className="bg-purple-600">خصم {cartData.availablePoints * 0.1} ر.س</Badge>
                    </div>
                    <input
                      type="checkbox"
                      checked={usePoints}
                      onChange={(e) => setUsePoints(e.target.checked)}
                      className="rounded"
                    />
                  </div>
                )}

                {/* Delivery Estimate */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">رسوم التوصيل المتوقعة</span>
                  </div>
                  <span className="font-semibold text-blue-600">15 ر.س</span>
                </div>

                {/* Order Note */}
                <Input
                  placeholder="ملاحظة للطلب (اختياري)"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                />
              </div>

              <Separator />

              {/* Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>المجموع الفرعي</span>
                  <span>{calculateSubtotal()} ر.س</span>
                </div>
                {cartData?.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>خصم الكوبون ({cartData.discount}%)</span>
                    <span>-{calculateSubtotal() * cartData.discount / 100} ر.س</span>
                  </div>
                )}
                {usePoints && (
                  <div className="flex justify-between text-sm text-purple-600">
                    <span>خصم النقاط</span>
                    <span>-{cartData?.availablePoints * 0.1} ر.س</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>رسوم التوصيل</span>
                  <span>15 ر.س</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>الإجمالي</span>
                  <span className="text-green-600">{calculateTotal()} ر.س</span>
                </div>
              </div>
            </>
          )}
        </div>

        {cartData?.items?.length > 0 && (
          <SheetFooter className="mt-6 gap-2">
            <Button variant="outline" onClick={handleContinueShopping} className="flex-1">
              متابعة التسوق
            </Button>
            <Button onClick={handleCheckout} className="flex-1 bg-green-600 hover:bg-green-700">
              تابع إلى الدفع
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}