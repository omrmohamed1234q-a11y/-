import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    imageUrl: string;
    filename: string;
  }>({ isOpen: false, imageUrl: '', filename: '' });
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

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


  // Helper function to get item price (already discounted from server)
  const getItemPrice = (item: any) => {
    // Price from server is already discounted for print jobs
    const price = parseFloat(item.price);
    console.log('🛒 CartDrawer getItemPrice:', item.productName, 'price:', item.price, 'parsed:', price);
    return price;
  };

  const calculateSubtotal = () => {
    if (!cart?.items) return 0;
    
    return cart.items.reduce((sum, item) => {
      const itemPrice = getItemPrice(item);
      return sum + (itemPrice * item.quantity);
    }, 0);
  };

  // Enhanced order summary calculations
  const calculateOrderStats = () => {
    if (!cart?.items) {
      return {
        totalItems: 0,
        totalPages: 0,
        colorPages: 0,
        bwPages: 0,
        paperTypes: {},
        printJobs: 0,
        regularProducts: 0
      };
    }

    let totalItems = 0;
    let totalPages = 0;
    let colorPages = 0;
    let bwPages = 0;
    let printJobs = 0;
    let regularProducts = 0;
    const paperTypes: Record<string, number> = {};

    cart.items.forEach(item => {
      totalItems += item.quantity;
      
      // Check if it's a print job
      const isPrintJob = (item.variant as any)?.isPrintJob || 
                        (item as any).productSource === 'print_service' || 
                        (item as any).printJobData;
      
      if (isPrintJob) {
        printJobs += item.quantity;
        
        // Extract print job details
        const printJobData = (item as any).printJobData || (item.variant as any)?.printJob || {};
        const pages = printJobData.pages || 1;
        const copies = printJobData.copies || item.quantity || 1;
        const colorMode = printJobData.colorMode || 'grayscale';
        const paperSize = printJobData.paperSize || 'A4';
        
        const totalPagesForItem = pages * copies;
        totalPages += totalPagesForItem;
        
        if (colorMode === 'color') {
          colorPages += totalPagesForItem;
        } else {
          bwPages += totalPagesForItem;
        }
        
        paperTypes[paperSize] = (paperTypes[paperSize] || 0) + totalPagesForItem;
      } else {
        regularProducts += item.quantity;
      }
    });

    return {
      totalItems,
      totalPages,
      colorPages,
      bwPages,
      paperTypes,
      printJobs,
      regularProducts
    };
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
    <>
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
                            {/* معاينة للملفات المرفوعة */}
                            {((item.variant as any)?.isPrintJob || (item as any).productSource === 'print_service' || (item as any).printJobData) && (item as any).previewUrl && !imageErrors.has(item.id) ? (
                              <img
                                src={(item as any).previewUrl}
                                alt={item.productName}
                                className="w-full h-full object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setPreviewModal({ isOpen: true, imageUrl: (item as any).previewUrl, filename: item.productName })}
                                data-testid={`file-preview-${item.id}`}
                                onError={() => {
                                  setImageErrors(prev => new Set(prev).add(item.id));
                                }}
                              />
                            ) : ((item.variant as any)?.isPrintJob || (item as any).productSource === 'print_service' || (item as any).printJobData) ? (
                              // أيقونة الملف للـ print jobs بدون معاينة أو عند فشل التحميل
                              <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {/* Enhanced Order Summary Footer */}
        {!showActiveOrders && cart?.items && cart.items.length > 0 && (() => {
          const stats = calculateOrderStats();
          return (
            <SheetFooter className="flex-shrink-0 border-t pt-4">
              <div className="w-full space-y-4">
                {/* Palestine Support Message */}
                <div className="bg-green-50 p-2 rounded-lg mb-2">
                  <div className="flex items-center gap-2 text-xs text-green-700">
                    <span>🇵🇸</span>
                    <span className="font-medium">بطلبك انت بتدعم فلسطين</span>
                  </div>
                </div>

                {/* Enhanced Order Summary Card */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                        📄 ملخص الطلب
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewModal({
                          isOpen: true,
                          imageUrl: '',
                          filename: 'ملخص الطلب'
                        })}
                        className="text-blue-600 border-blue-300 hover:bg-blue-100"
                        data-testid="preview-order-button"
                      >
                        👁️ معاينة تفصيلية
                      </Button>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {/* Order Statistics */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center justify-between bg-white/70 p-2 rounded-lg">
                          <span className="text-gray-600 flex items-center gap-1">
                            📦 إجمالي العناصر
                          </span>
                          <span className="font-bold text-blue-800">{stats.totalItems}</span>
                        </div>
                        
                        {stats.totalPages > 0 && (
                          <div className="flex items-center justify-between bg-white/70 p-2 rounded-lg">
                            <span className="text-gray-600 flex items-center gap-1">
                              📑 إجمالي الصفحات
                            </span>
                            <span className="font-bold text-blue-800">{stats.totalPages}</span>
                          </div>
                        )}
                      </div>

                      {/* Print Job Details */}
                      {stats.printJobs > 0 && (
                        <div className="bg-white/70 p-3 rounded-lg space-y-2">
                          <h4 className="font-semibold text-blue-800 flex items-center gap-1">
                            🖨️ تفاصيل الطباعة
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {stats.colorPages > 0 && (
                              <div className="flex justify-between">
                                <span>🎨 ملون:</span>
                                <span className="font-semibold">{stats.colorPages} صفحة</span>
                              </div>
                            )}
                            {stats.bwPages > 0 && (
                              <div className="flex justify-between">
                                <span>⚫ أبيض وأسود:</span>
                                <span className="font-semibold">{stats.bwPages} صفحة</span>
                              </div>
                            )}
                          </div>

                          {/* Paper Types */}
                          {Object.keys(stats.paperTypes).length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-semibold text-blue-700 mb-1">أنواع الورق:</div>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(stats.paperTypes).map(([type, count]) => (
                                  <Badge 
                                    key={type}
                                    variant="secondary" 
                                    className="text-xs bg-blue-100 text-blue-800"
                                  >
                                    {type}: {count}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Products Summary */}
                      {stats.regularProducts > 0 && (
                        <div className="bg-white/70 p-2 rounded-lg">
                          <div className="flex justify-between items-center text-xs">
                            <span className="flex items-center gap-1">
                              🛍️ منتجات أخرى:
                            </span>
                            <span className="font-semibold">{stats.regularProducts}</span>
                          </div>
                        </div>
                      )}

                      {/* Total Price */}
                      <div className="border-t border-blue-200 pt-2 mt-3">
                        <div className="flex justify-between font-bold text-lg">
                          <span className="text-blue-900">💰 المجموع الفرعي</span>
                          <span className="text-green-600" data-testid="cart-subtotal">
                            <span className="currency-display">
                              <span className="arabic-nums">{subtotal.toFixed(2)}</span> جنيه
                            </span>
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 text-center mt-1">
                          رسوم التوصيل والخدمة ستظهر عند إتمام الطلب
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={handleCheckout}
                    className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg font-semibold"
                    data-testid="checkout-button"
                  >
                    <Gift className="h-5 w-5 ml-2" />
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
          );
        })()}
      </SheetContent>
    </Sheet>

    {/* Enhanced Preview Modal */}
    <Dialog 
      open={previewModal.isOpen} 
      onOpenChange={(open) => setPreviewModal(prev => ({ ...prev, isOpen: open }))}
    >
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-right text-xl font-bold text-blue-900">
            {previewModal.filename === 'ملخص الطلب' ? '📋 معاينة تفصيلية للطلب' : `معاينة الملف: ${previewModal.filename}`}
          </DialogTitle>
        </DialogHeader>
        
        {previewModal.filename === 'ملخص الطلب' ? (
          // Order Summary Preview
          <div className="p-6 max-h-[80vh] overflow-auto bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
              {/* Header */}
              <div className="text-center border-b-2 border-blue-200 pb-4 mb-6">
                <h1 className="text-2xl font-bold text-blue-900 mb-2">🏪 اطبعلي</h1>
                <h2 className="text-lg font-semibold text-gray-700">فاتورة مبدئية - ملخص الطلب</h2>
                <p className="text-sm text-gray-500 mt-2">تاريخ الإنشاء: {new Date().toLocaleDateString('ar-EG')}</p>
              </div>

              {(() => {
                const stats = calculateOrderStats();
                const subtotal = calculateSubtotal();
                
                return (
                  <>
                    {/* Order Statistics */}
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                          📊 إحصائيات الطلب
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>📦 إجمالي العناصر:</span>
                            <span className="font-bold">{stats.totalItems}</span>
                          </div>
                          {stats.totalPages > 0 && (
                            <div className="flex justify-between">
                              <span>📑 إجمالي الصفحات:</span>
                              <span className="font-bold">{stats.totalPages}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>🖨️ مهام طباعة:</span>
                            <span className="font-bold">{stats.printJobs}</span>
                          </div>
                          {stats.regularProducts > 0 && (
                            <div className="flex justify-between">
                              <span>🛍️ منتجات أخرى:</span>
                              <span className="font-bold">{stats.regularProducts}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg">
                        <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                          💰 تفاصيل التكلفة
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>المجموع الفرعي:</span>
                            <span className="font-bold">{subtotal.toFixed(2)} جنيه</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>رسوم التوصيل:</span>
                            <span>محدد عند الدفع</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>رسوم الخدمة:</span>
                            <span>محدد عند الدفع</span>
                          </div>
                          <div className="border-t pt-2 border-green-200">
                            <div className="flex justify-between font-bold text-lg text-green-700">
                              <span>الإجمالي المتوقع:</span>
                              <span>{(subtotal + 10).toFixed(2)} جنيه*</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">* تقدير تقريبي شامل الرسوم</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Print Details */}
                    {stats.printJobs > 0 && (
                      <div className="bg-purple-50 p-4 rounded-lg mb-6">
                        <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                          🖨️ تفاصيل الطباعة
                        </h3>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                          {(stats.colorPages > 0 || stats.bwPages > 0) && (
                            <div>
                              <h4 className="font-semibold text-purple-700 mb-2">تصنيف الألوان:</h4>
                              <div className="space-y-1">
                                {stats.colorPages > 0 && (
                                  <div className="flex justify-between bg-white/70 p-2 rounded">
                                    <span className="flex items-center gap-1">🎨 طباعة ملونة:</span>
                                    <span className="font-bold">{stats.colorPages} صفحة</span>
                                  </div>
                                )}
                                {stats.bwPages > 0 && (
                                  <div className="flex justify-between bg-white/70 p-2 rounded">
                                    <span className="flex items-center gap-1">⚫ أبيض وأسود:</span>
                                    <span className="font-bold">{stats.bwPages} صفحة</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {Object.keys(stats.paperTypes).length > 0 && (
                            <div>
                              <h4 className="font-semibold text-purple-700 mb-2">أنواع الورق:</h4>
                              <div className="space-y-1">
                                {Object.entries(stats.paperTypes).map(([type, count]) => (
                                  <div key={type} className="flex justify-between bg-white/70 p-2 rounded">
                                    <span>📄 {type}:</span>
                                    <span className="font-bold">{count} صفحة</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Items List */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                        📋 تفاصيل العناصر
                      </h3>
                      <div className="space-y-2">
                        {cart?.items?.map((item, index) => (
                          <div key={item.id || index} className="bg-white p-3 rounded-lg shadow-sm border">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-800">{item.productName || item.title}</h4>
                                {((item.variant as any)?.isPrintJob || (item as any).productSource === 'print_service') && (
                                  <div className="text-xs text-blue-600 mt-1">
                                    🖨️ مهمة طباعة
                                  </div>
                                )}
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-green-600">{getItemPrice(item).toFixed(2)} جنيه</p>
                                <p className="text-sm text-gray-500">الكمية: {item.quantity}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center border-t-2 border-blue-200 pt-4">
                      <div className="bg-green-50 p-3 rounded-lg mb-4">
                        <p className="text-green-700 font-semibold flex items-center justify-center gap-2">
                          🇵🇸 بطلبك انت بتدعم فلسطين
                        </p>
                      </div>
                      <p className="text-sm text-gray-600">
                        📞 للاستفسار: اتصل بنا | 💬 خدمة العملاء متاحة 24/7
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        هذه فاتورة مبدئية - الفاتورة النهائية ستصدر بعد تأكيد الطلب
                      </p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        ) : (
          // File Preview (Original functionality)
          <div className="flex justify-center items-center p-4 bg-gray-50 rounded-lg min-h-[60vh] overflow-auto">
            {previewModal.imageUrl ? (
              <img
                src={previewModal.imageUrl}
                alt={previewModal.filename}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTkgMTJoNm0tNiA0aDZtMiA1SDdhMiAyIDAgMDEtMi0yVjVhMiAyIDAgMDEyLTJoNS41ODZhMSAxIDAgMDEuNzA3LjI5M2w1LjQxNCA1LjQxNGExIDEgMCAwMS4yOTMuNzA3VjE5YTIgMiAwIDAxLTIgMnoiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+";
                  (e.target as HTMLImageElement).alt = "لا يمكن تحميل المعاينة";
                }}
              />
            ) : (
              <div className="text-center text-gray-500">
                <svg className="h-24 w-24 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p>لا توجد معاينة متاحة لهذا الملف</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}