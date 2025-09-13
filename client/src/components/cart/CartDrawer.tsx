import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Plus, Minus, Trash2, Tag, Gift, Truck, X, Package, Star } from 'lucide-react';
import { useLocation } from 'wouter';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState('');
  const [usePoints, setUsePoints] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [showActiveOrders, setShowActiveOrders] = useState(false);

  const { 
    cart, 
    isLoading, 
    updateQuantity, 
    removeItem,
    clearCart,
    isUpdatingQuantity,
    isRemovingItem,
    isClearingCart 
  } = useCart();

  // Fetch suggested products
  const { data: suggestedProducts } = useQuery({
    queryKey: ['/api/cart/suggestions'],
    enabled: isOpen,
  });

  // Fetch active orders
  const { data: activeOrders } = useQuery({
    queryKey: ['/api/orders/active'],
    enabled: isOpen && showActiveOrders,
  });

  const handleQuantityChange = (itemId: string, currentQty: number, change: number) => {
    const newQty = currentQty + change;
    if (newQty > 0) {
      updateQuantity({ itemId, quantity: newQty });
    } else {
      removeItem(itemId);
    }
  };

  const handleCheckout = () => {
    onClose();
    setLocation('/checkout');
  };

  const handleContinueShopping = () => {
    onClose();
  };


  // Helper function to calculate item price with discount
  const getItemPrice = (item: any) => {
    let itemPrice = parseFloat(item.price);
    
    // Apply 10% discount for black and white printing
    if ((item.variant as any)?.printJob?.colorType === 'black_white' || 
        (item.variant as any)?.printJob?.colorType === 'grayscale' ||
        ((item as any).printJobData && ((item as any).printJobData.colorType === 'black_white' || (item as any).printJobData.colorType === 'grayscale'))) {
      itemPrice = itemPrice * 0.9; // 10% discount
    }
    
    return itemPrice;
  };

  const calculateSubtotal = () => {
    if (!cart?.items) return 0;
    
    return cart.items.reduce((sum, item) => {
      const itemPrice = getItemPrice(item);
      return sum + (itemPrice * item.quantity);
    }, 0);
  };

  // Skeleton loader for cart items
  const CartItemSkeleton = () => (
    <Card className="p-3">
      <div className="flex gap-3">
        <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse flex-shrink-0"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-8 h-6 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
          </div>
        </div>
      </div>
    </Card>
  );

  const subtotal = calculateSubtotal();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        className="w-full sm:max-w-md flex flex-col h-full" 
        data-testid="cart-drawer"
      >
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              <span>سلة التسوق</span>
              {cart?.totalQuantity && cart.totalQuantity > 0 && (
                <Badge variant="secondary" data-testid="cart-item-count">
                  {cart.totalQuantity}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="close-cart-button"
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetTitle>

          {/* Toggle Active Orders */}
          <div className="flex gap-2">
            <Button
              variant={!showActiveOrders ? "default" : "outline"}
              size="sm"
              onClick={() => setShowActiveOrders(false)}
              data-testid="toggle-cart-view"
            >
              <Package className="h-4 w-4 ml-1" />
              السلة
            </Button>
            <Button
              variant={showActiveOrders ? "default" : "outline"}
              size="sm"
              onClick={() => setShowActiveOrders(true)}
              data-testid="toggle-active-orders-view"
            >
              <Truck className="h-4 w-4 ml-1" />
              الطلبات النشطة
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {!showActiveOrders ? (
            // Cart View
            <>
              {isLoading ? (
                // Loading skeleton
                <div className="space-y-4">
                  <CartItemSkeleton />
                  <CartItemSkeleton />
                  <CartItemSkeleton />
                </div>
              ) : !cart?.items || cart.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-4">سلة التسوق فارغة</p>
                  <Button
                    onClick={handleContinueShopping}
                    variant="outline"
                    data-testid="continue-shopping-button"
                  >
                    تصفح المنتجات
                  </Button>
                </div>
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="space-y-4">
                    {cart.items.map((item) => (
                      <Card key={item.id} className="p-3" data-testid={`cart-item-${item.id}`}>
                        <div className="flex gap-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                            {item.productImage ? (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="h-8 w-8 text-gray-400" />
                            )}
                          </div>

                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between">
                              <h4 className="font-medium text-sm" data-testid={`item-name-${item.id}`}>
                                {item.productName}
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                                disabled={isRemovingItem}
                                data-testid={`remove-item-${item.id}`}
                              >
                                {isRemovingItem ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                ) : (
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                )}
                              </Button>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {/* Check if this is a print job - disable quantity controls for print jobs */}
                                {((item.variant as any)?.isPrintJob || (item as any).productSource === 'print_service' || (item as any).printJobData) ? (
                                  // For print jobs - show quantity but disable controls
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={true}
                                      data-testid={`decrease-quantity-${item.id}`}
                                      className="opacity-50 cursor-not-allowed"
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center" data-testid={`quantity-${item.id}`}>
                                      {item.quantity}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={true}
                                      data-testid={`increase-quantity-${item.id}`}
                                      className="opacity-50 cursor-not-allowed"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                  </>
                                ) : (
                                  // For regular store products - enable controls as normal
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                                      disabled={isUpdatingQuantity}
                                      data-testid={`decrease-quantity-${item.id}`}
                                    >
                                      {isUpdatingQuantity ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                                      ) : (
                                        <Minus className="h-3 w-3" />
                                      )}
                                    </Button>
                                    <span className="w-8 text-center" data-testid={`quantity-${item.id}`}>
                                      {item.quantity}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                                      disabled={isUpdatingQuantity}
                                      data-testid={`increase-quantity-${item.id}`}
                                    >
                                      {isUpdatingQuantity ? (
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                                      ) : (
                                        <Plus className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </>
                                )}
                              </div>

                              <div className="text-left">
                                <div className="font-bold text-green-600" data-testid={`item-total-${item.id}`}>
                                  <span className="currency-display">
                                    <span className="arabic-nums">{(getItemPrice(item) * item.quantity).toFixed(2)}</span> جنيه
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  <span className="currency-display">
                                    <span className="arabic-nums">{getItemPrice(item).toFixed(2)}</span> جنيه للقطعة
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Coupon Section */}
                  <Card className="p-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="كود الخصم"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        data-testid="coupon-input"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid="apply-coupon-button"
                      >
                        <Tag className="h-4 w-4 ml-1" />
                        تطبيق
                      </Button>
                    </div>
                  </Card>

                  {/* Suggested Products */}
                  {suggestedProducts && Array.isArray(suggestedProducts) && suggestedProducts.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-3">
                        <h4 className="font-medium">منتجات مقترحة</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {Array.isArray(suggestedProducts) ? suggestedProducts.slice(0, 2).map((product: any) => (
                            <Card key={product.id} className="p-2">
                              <div className="aspect-square bg-gray-100 rounded mb-2 flex items-center justify-center">
                                {product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover rounded"
                                  />
                                ) : (
                                  <Package className="h-8 w-8 text-gray-400" />
                                )}
                              </div>
                              <p className="text-xs font-medium mb-1 line-clamp-2">
                                {product.name}
                              </p>
                              <p className="text-sm font-bold text-green-600">
                                {parseFloat(product.price).toFixed(0)} جنيه
                              </p>
                            </Card>
                          )) : null}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            // Active Orders View
            <>
              {!activeOrders || !Array.isArray(activeOrders) || activeOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Truck className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-2">لا توجد طلبات نشطة</p>
                  <p className="text-sm text-gray-400">طلباتك قيد التنفيذ ستظهر هنا</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(activeOrders) ? activeOrders.map((order: any) => (
                    <Card key={order.id} className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">{order.orderNumber}</p>
                          <p className="text-xs text-gray-500">{order.createdAt}</p>
                        </div>
                        <Badge 
                          variant={order.status === 'delivered' ? 'default' : 'secondary'}
                        >
                          {order.status}
                        </Badge>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>{order.totalAmount} جنيه</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            onClose();
                            setLocation(`/orders/${order.id}`);
                          }}
                        >
                          تتبع الطلب
                        </Button>
                      </div>
                    </Card>
                  )) : null}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer - Only show for cart view with items */}
        {!showActiveOrders && cart?.items && cart.items.length > 0 && (
          <SheetFooter className="flex-shrink-0 border-t pt-4">
            <div className="w-full space-y-4">
              {/* Order Summary - Only Subtotal */}
              <div className="space-y-2">
                <div className="bg-green-50 p-2 rounded-lg mb-2">
                  <div className="flex items-center gap-2 text-xs text-green-700">
                    <span>🇵🇸</span>
                    <span className="font-medium">بطلبك انت بتدعم فلسطين</span>
                  </div>
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>المجموع الفرعي</span>
                  <span className="text-green-600" data-testid="cart-subtotal">
                    <span className="currency-display">
                      <span className="arabic-nums">{subtotal.toFixed(2)}</span> جنيه
                    </span>
                  </span>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  رسوم التوصيل والخدمة ستظهر عند إتمام الطلب
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-green-600 hover:bg-green-700"
                  data-testid="checkout-button"
                >
                  <Gift className="h-4 w-4 ml-1" />
                  إتمام الطلب
                </Button>
              </div>

              {/* Clear Cart Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearCart()}
                disabled={isClearingCart}
                className="w-full text-red-600 hover:text-red-700"
                data-testid="clear-cart-button"
              >
                {isClearingCart ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500 ml-1"></div>
                ) : (
                  <Trash2 className="h-4 w-4 ml-1" />
                )}
                {isClearingCart ? 'جاري التفريغ...' : 'تفريغ السلة'}
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}