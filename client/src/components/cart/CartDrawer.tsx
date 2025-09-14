import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart, Plus, Minus, Trash2, X, Package } from 'lucide-react';
import { useLocation } from 'wouter';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const [, setLocation] = useLocation();

  const { 
    cart, 
    isLoading, 
    updateQuantity, 
    removeItem,
    isUpdatingQuantity,
    isRemovingItem
  } = useCart();

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

  const calculateSubtotal = () => {
    if (!cart?.items) return 0;
    
    return cart.items.reduce((sum, item) => {
      const price = parseFloat(item.price);
      return sum + (price * item.quantity);
    }, 0);
  };

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
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 border rounded-lg">
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
                </div>
              ))}
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
                  <div key={item.id} className="p-3 border rounded-lg" data-testid={`cart-item-${item.id}`}>
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
                          </div>
                          <span className="font-bold text-green-600" data-testid={`item-price-${item.id}`}>
                            {(parseFloat(item.price) * item.quantity).toFixed(2)} جنيه
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </>
          )}
        </div>

        {/* Footer */}
        {cart?.items && cart.items.length > 0 && (
          <SheetFooter className="flex-shrink-0 border-t pt-4">
            <div className="w-full space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">المجموع الفرعي</span>
                <span className="text-lg font-bold text-green-600" data-testid="cart-subtotal">
                  {subtotal.toFixed(2)} جنيه
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleContinueShopping}
                  variant="outline"
                  className="flex-1"
                  data-testid="continue-shopping-footer-button"
                >
                  تصفح المنتجات
                </Button>
                <Button
                  onClick={handleCheckout}
                  className="flex-1"
                  data-testid="checkout-button"
                >
                  إتمام الطلب
                </Button>
              </div>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}