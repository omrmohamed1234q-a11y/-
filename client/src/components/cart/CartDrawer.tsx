import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart, Plus, Minus, Trash2, X, Package, FileText, Eye } from 'lucide-react';
import { useLocation } from 'wouter';
import { useState } from 'react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const [, setLocation] = useLocation();
  const [expandedPreview, setExpandedPreview] = useState<string | null>(null);

  const { 
    cart, 
    isLoading, 
    updateQuantity, 
    removeItem,
    isUpdatingQuantity,
    isRemovingItem
  } = useCart();

  // Helper functions for file preview and icons
  const getPreviewUrl = (item: any) => {
    return item.productImage || null;
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf': return '📄';
      case 'doc': case 'docx': return '📝';
      case 'xls': case 'xlsx': return '📊';
      case 'ppt': case 'pptx': return '📈';
      case 'jpg': case 'jpeg': case 'png': case 'gif': return '🖼️';
      default: return '📄';
    }
  };

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
    setLocation('/print');
  };

  const subtotal = cart?.subtotal || 0;

  const PreviewImage = ({ item }: { item: any }) => {
    const previewUrl = getPreviewUrl(item);
    const fileIcon = getFileTypeIcon(item.variant?.fileType || 'pdf');
    const isExpanded = expandedPreview === item.id;

    if (previewUrl) {
      return (
        <div className="relative w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
          <img
            src={previewUrl}
            alt={item.productName}
            className={`w-full h-full object-cover cursor-pointer transition-all duration-200 ${
              isExpanded ? 'scale-105' : 'hover:scale-105'
            }`}
            onClick={() => setExpandedPreview(isExpanded ? null : item.id)}
          />
          <div className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1 py-0.5 rounded">
            {fileIcon}
          </div>
          {isExpanded && (
            <div className="absolute inset-0 bg-blue-500/20 border-2 border-blue-500 rounded-lg"></div>
          )}
        </div>
      );
    }

    // Fallback when no preview available
    return (
      <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">{fileIcon}</div>
          <div className="text-xs text-gray-500 mt-1">
            {(item.variant?.fileType || 'PDF').toUpperCase()}
          </div>
        </div>
      </div>
    );
  };

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
              <span>سلة الطباعة</span>
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
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
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
              <p className="text-gray-500 mb-2">سلة الطباعة فارغة</p>
              <p className="text-sm text-gray-400 mb-4">أضف ملفاتك للطباعة هنا</p>
              <Button
                onClick={handleContinueShopping}
                variant="outline"
                data-testid="continue-shopping-button"
              >
                <FileText className="h-4 w-4 mr-2" />
                رفع ملفات للطباعة
              </Button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors" data-testid={`cart-item-${item.id}`}>
                    <div className="flex gap-3">
                      <PreviewImage item={item} />

                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-1" data-testid={`item-name-${item.id}`}>
                              {item.productName}
                            </h4>
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>📄 {item.variant?.pages || 1} صفحة • {item.variant?.paperSize || 'A4'}</div>
                              <div>🎨 {item.variant?.colorMode === 'color' ? 'ملون' : item.variant?.colorMode === 'grayscale' ? 'رمادي' : 'أبيض وأسود'}</div>
                              <div>📋 {item.variant?.paperType === 'plain' ? 'عادي' : item.variant?.paperType === 'photo' ? 'فوتو' : item.variant?.paperType}</div>
                              {item.variant?.doubleSided && <div>↔️ طباعة على الوجهين</div>}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            disabled={isRemovingItem}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                            data-testid={`remove-item-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                              disabled={isUpdatingQuantity || item.quantity <= 1}
                              className="h-8 w-8 p-0 hover:bg-white"
                              data-testid={`decrease-quantity-${item.id}`}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium min-w-[2rem] text-center" data-testid={`quantity-${item.id}`}>
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                              disabled={isUpdatingQuantity}
                              className="h-8 w-8 p-0 hover:bg-white"
                              data-testid={`increase-quantity-${item.id}`}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="text-left">
                            <div className="text-sm font-semibold" data-testid={`item-total-${item.id}`}>
                              {item.totalPrice?.toFixed(2) || '0.00'} جنيه
                            </div>
                            {item.quantity > 1 && (
                              <div className="text-xs text-gray-500">
                                {(item.totalPrice / item.quantity).toFixed(2)} × {item.quantity}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cart Summary */}
              <Separator className="my-4" />
              
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">المجموع الفرعي:</span>
                  <span className="font-medium" data-testid="cart-subtotal">
                    {subtotal?.toFixed(2) || '0.00'} جنيه
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">الشحن:</span>
                  <span className="text-green-600 text-sm font-medium">
                    مجاني
                  </span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>الإجمالي:</span>
                  <span data-testid="cart-total">
                    {subtotal?.toFixed(2) || '0.00'} جنيه
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Buttons */}
        {cart?.items && cart.items.length > 0 && (
          <SheetFooter className="flex-shrink-0 p-4 border-t">
            <div className="space-y-3 w-full">
              <Button
                onClick={handleCheckout}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-12 text-lg"
                data-testid="checkout-button"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                المتابعة للدفع ({cart.totalQuantity} عنصر)
              </Button>
              
              <Button
                onClick={handleContinueShopping}
                variant="outline"
                className="w-full"
                data-testid="continue-shopping-button"
              >
                متابعة التسوق
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}