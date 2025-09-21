import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import GoogleMap from "@/components/GoogleMap";
import { 
  X, 
  MessageCircle, 
  Phone,
  Home,
  Calendar,
  Truck,
  Package,
  CreditCard,
  HeadphonesIcon,
  Clock,
  Star,
  ArrowLeft,
  ArrowRight
} from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  statusText?: string;
  totalAmount: number;
  deliveryAddress: string;
  estimatedDelivery?: string;
  driverName?: string;
  driverPhone?: string;
  restaurantName?: string;
  restaurantLogo?: string;
  items?: OrderItem[];
  createdAt: string;
}

interface OrderItem {
  id: string;
  name: string;
  productName?: string;
  quantity: number;
  price: number;
}

// Calculate ETA in minutes from estimatedDelivery
function calculateETA(estimatedDelivery?: string): string {
  if (!estimatedDelivery) return "within 15 minutes";
  
  try {
    const deliveryTime = new Date(estimatedDelivery);
    const now = new Date();
    const diffMs = deliveryTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins <= 0) return "arriving now";
    if (diffMins <= 5) return "within 5 minutes";
    if (diffMins <= 15) return "within 15 minutes";
    if (diffMins <= 30) return "within 30 minutes";
    return `within ${diffMins} minutes`;
  } catch {
    return "within 15 minutes";
  }
}

// Format date for delivery
function formatDeliveryDate(dateStr: string): string {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  };
  return date.toLocaleDateString('ar-EG', options);
}

export default function Orders() {
  const { user } = useAuth();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Mock order data for testing the 3 stages - will fix API later
  const [orderStage, setOrderStage] = useState<'reviewing' | 'preparing' | 'delivering'>('reviewing');
  
  const getOrderInfo = (stage: string) => {
    switch(stage) {
      case 'reviewing':
        return {
          status: 'reviewing',
          statusText: 'جاري مراجعة الطلب',
          stage: 'reviewing' as const
        };
      case 'preparing':
        return {
          status: 'preparing',
          statusText: 'جاري تجهيز المطبوعات',
          stage: 'preparing' as const
        };
      case 'delivering':
        return {
          status: 'out_for_delivery',
          statusText: 'جاري التوصيل',
          stage: 'delivering' as const
        };
      default:
        return {
          status: 'reviewing',
          statusText: 'جاري مراجعة الطلب',
          stage: 'reviewing' as const
        };
    }
  };

  const currentOrderInfo = getOrderInfo(orderStage);
  
  const mockOrder: Order = {
    id: 'order-1758465101672',
    orderNumber: 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    status: currentOrderInfo.status,
    statusText: currentOrderInfo.statusText,
    totalAmount: 360,
    deliveryAddress: '123 شارع الجامعة، الدقي، الجيزة',
    estimatedDelivery: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
    driverName: orderStage === 'delivering' ? 'محمد أحمد' : undefined,
    driverPhone: orderStage === 'delivering' ? '+201234567890' : undefined,
    restaurantName: 'اطبعلي للطباعة',
    restaurantLogo: null,
    createdAt: new Date().toISOString(),
    items: [
      {
        id: '1',
        name: 'طباعة ملف PDF',
        productName: 'Omar Aloush_merged.pdf',
        quantity: 6,
        price: 30
      }
    ]
  };

  const ordersArray = [mockOrder];
  const isLoading = false;
  const refetch = () => Promise.resolve();
  
  // Get the active order (first order that's being delivered or processed)
  const activeOrder = ordersArray.find((order: Order) => 
    ['out_for_delivery', 'ready', 'processing', 'confirmed', 'pending'].includes(order.status)
  ) || ordersArray[0];

  // Set first order as selected by default
  useEffect(() => {
    if (activeOrder && !selectedOrderId) {
      setSelectedOrderId(activeOrder.id);
    }
  }, [activeOrder, selectedOrderId]);

  const selectedOrder = selectedOrderId 
    ? ordersArray.find((o: Order) => o.id === selectedOrderId) 
    : activeOrder;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[--brand-500] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل طلباتك...</p>
        </div>
      </div>
    );
  }

  if (!ordersArray.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="p-8">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">لا توجد طلبات</h2>
            <p className="text-gray-600 mb-6">ابدأ التسوق الآن لترى طلباتك هنا</p>
            <Button 
              className="bg-[--brand-500] hover:bg-[--brand-600]"
              onClick={() => window.location.href = '/'}
            >
              ابدأ التسوق الآن
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Order Status Header */}
      {selectedOrder && (
        <div className="bg-white shadow-sm sticky top-0 z-40 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-[--brand-500] rounded-full animate-pulse"></div>
              <div>
                <span className="font-bold text-[--brand-600] text-lg">
                  {selectedOrder.statusText || 'قيد التجهيز'}
                </span>
                <p className="text-xs text-gray-600">
                  طلب رقم {selectedOrder.orderNumber}
                </p>
              </div>
            </div>
            <Badge className="bg-[--brand-100] text-[--brand-700] border-[--brand-300] px-3 py-1">
              <Clock className="h-3 w-3 mr-1" />
              {orderStage === 'delivering' ? calculateETA(selectedOrder.estimatedDelivery) : 'قريباً'}
            </Badge>
          </div>
          
          {/* Testing Stage Controls - Remove in production */}
          <div className="flex gap-2 mt-3 pt-2 border-t border-gray-200">
            <button 
              onClick={() => setOrderStage('reviewing')}
              className={`px-3 py-1 text-xs rounded-full ${orderStage === 'reviewing' ? 'bg-[--brand-500] text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              مراجعة
            </button>
            <button 
              onClick={() => setOrderStage('preparing')}
              className={`px-3 py-1 text-xs rounded-full ${orderStage === 'preparing' ? 'bg-[--brand-500] text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              تجهيز
            </button>
            <button 
              onClick={() => setOrderStage('delivering')}
              className={`px-3 py-1 text-xs rounded-full ${orderStage === 'delivering' ? 'bg-[--brand-500] text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              توصيل
            </button>
          </div>
        </div>
      )}
      
      {/* Top Section: Animation or Map */}
      {selectedOrder && (
        <div className="relative h-[52vh] w-full bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Animation for Reviewing Stage */}
          {orderStage === 'reviewing' && (
            <div className="flex items-center justify-center h-full px-4">
              <div className="text-center max-w-md mx-auto">
                {/* Reviewing Animation */}
                <div className="w-64 h-64 mx-auto mb-4 relative">
                  {/* Person silhouette - improved and black */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-32 h-32 text-gray-900" viewBox="0 0 100 100" fill="currentColor">
                      {/* Person head */}
                      <circle cx="50" cy="20" r="10" />
                      {/* Person body */}
                      <rect x="44" y="28" width="12" height="25" rx="6" />
                      {/* Left arm holding paper */}
                      <rect x="32" y="32" width="14" height="6" rx="3" />
                      {/* Right arm holding paper */}
                      <rect x="54" y="32" width="14" height="6" rx="3" />
                      {/* Person legs */}
                      <rect x="46" y="52" width="8" height="20" rx="4" />
                    </svg>
                  </div>
                  
                  {/* Documents arranged nicely around the person */}
                  {/* Document in left hand */}
                  <div className="absolute top-16 left-12">
                    <div className="w-12 h-8 bg-white border-2 border-[--brand-400] rounded shadow-lg rotate-12 animate-pulse" 
                         style={{ animationDelay: '0s', animationDuration: '3s' }}>
                      <div className="h-1 bg-[--brand-500] rounded-full mx-1 mt-1"></div>
                      <div className="h-0.5 bg-gray-400 rounded-full mx-1 mt-0.5"></div>
                      <div className="h-0.5 bg-gray-400 rounded-full mx-1 mt-0.5"></div>
                    </div>
                  </div>
                  
                  {/* Document in right hand */}
                  <div className="absolute top-16 right-12">
                    <div className="w-12 h-8 bg-white border-2 border-[--brand-400] rounded shadow-lg -rotate-12 animate-pulse"
                         style={{ animationDelay: '1s', animationDuration: '3s' }}>
                      <div className="h-1 bg-[--brand-500] rounded-full mx-1 mt-1"></div>
                      <div className="h-0.5 bg-gray-400 rounded-full mx-1 mt-0.5"></div>
                      <div className="h-0.5 bg-gray-400 rounded-full mx-1 mt-0.5"></div>
                    </div>
                  </div>
                  
                  {/* Document on desk/table left */}
                  <div className="absolute bottom-8 left-8">
                    <div className="w-10 h-12 bg-white border-2 border-[--brand-300] rounded shadow-lg animate-bounce"
                         style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}>
                      <div className="h-1.5 bg-[--brand-500] rounded-full mx-1 mt-1"></div>
                      <div className="h-0.5 bg-gray-300 rounded-full mx-1 mt-1"></div>
                      <div className="h-0.5 bg-gray-300 rounded-full mx-1 mt-0.5"></div>
                      <div className="h-0.5 bg-gray-300 rounded-full mx-1 mt-0.5"></div>
                    </div>
                  </div>
                  
                  {/* Document on desk/table right */}
                  <div className="absolute bottom-8 right-8">
                    <div className="w-10 h-12 bg-white border-2 border-[--brand-300] rounded shadow-lg animate-bounce"
                         style={{ animationDelay: '1.5s', animationDuration: '2.5s' }}>
                      <div className="h-1.5 bg-[--brand-500] rounded-full mx-1 mt-1"></div>
                      <div className="h-0.5 bg-gray-300 rounded-full mx-1 mt-1"></div>
                      <div className="h-0.5 bg-gray-300 rounded-full mx-1 mt-0.5"></div>
                      <div className="h-0.5 bg-gray-300 rounded-full mx-1 mt-0.5"></div>
                    </div>
                  </div>
                  
                  {/* Desk surface indication */}
                  <div className="absolute bottom-2 left-4 right-4 h-2 bg-gray-200 rounded-full opacity-30"></div>
                </div>
                
                <div className="px-2">
                  <h3 className="text-lg font-bold text-[--brand-600] mb-1">جاري مراجعة طلبك</h3>
                  <p className="text-sm text-gray-600">فريقنا يراجع تفاصيل طلبك بعناية</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Animation for Preparing Stage */}
          {orderStage === 'preparing' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                {/* Printing Animation */}
                <div className="w-80 h-80 mx-auto mb-6 relative">
                  {/* Printer */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      {/* Printer body - bigger and black */}
                      <div className="w-40 h-28 bg-gray-900 border-4 border-gray-700 rounded-xl shadow-2xl">
                        <div className="w-full h-4 bg-gray-800 rounded-t-lg"></div>
                        <div className="flex items-center justify-center h-full">
                          <div className="w-6 h-6 bg-gray-600 rounded-full animate-spin"></div>
                        </div>
                        
                        {/* Printer details */}
                        <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <div className="absolute top-2 left-2 w-8 h-1 bg-gray-600 rounded"></div>
                      </div>
                      
                      {/* Paper coming out - bigger */}
                      <div className="absolute -bottom-4 left-4 right-4">
                        <div className="w-32 h-12 bg-white border-2 border-gray-300 rounded-b-lg animate-pulse shadow-xl">
                          <div className="h-2 bg-gray-800 rounded-full mx-2 mt-2"></div>
                          <div className="h-1 bg-gray-400 rounded-full mx-2 mt-1"></div>
                          <div className="h-1 bg-gray-400 rounded-full mx-2 mt-1"></div>
                          <div className="h-1 bg-gray-400 rounded-full mx-2 mt-1"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Animated red dots showing printing - keeping red */}
                  <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    <div className="w-3 h-3 bg-[--brand-500] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-3 h-3 bg-[--brand-500] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-3 h-3 bg-[--brand-500] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-[--brand-600] mb-2">جاري تجهيز المطبوعات</h3>
                <p className="text-gray-600">نطبع مستنداتك بأفضل جودة</p>
              </div>
            </div>
          )}

          {/* Google Map for Delivering Stage */}
          {orderStage === 'delivering' && (
            <>
              <div className="absolute inset-0">
                <GoogleMap
                  height="52vh"
                  showRoute={true}
                  driverLocation={selectedOrder.driverName ? { lat: 30.0444, lng: 31.2357, timestamp: Date.now() } : undefined}
                  orderDestination={selectedOrder.deliveryAddress ? { lat: 30.0644, lng: 31.2157 } : undefined}
                  customerLocation={{ lat: 30.0344, lng: 31.2457 }}
                  className="w-full h-full rounded-none"
                />
              </div>

              {/* Map Overlays */}
              {/* Close Button */}
              <button 
                className="absolute top-4 left-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg z-20"
                onClick={() => window.history.back()}
                data-testid="button-close-tracking"
              >
                <X className="h-5 w-5 text-gray-700" />
              </button>

              {/* Location Badge */}
              <div 
                className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg z-20 flex items-center gap-2"
                data-testid="pill-location"
              >
                <Home className="h-4 w-4" />
                <span className="text-sm font-medium">منزل</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Bottom Section: Scrollable Content */}
      <div className="bg-white">
        {/* Restaurant Status Card */}
        {selectedOrder && (
          <div className="px-6 py-4 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  {selectedOrder.restaurantLogo ? (
                    <img 
                      src={selectedOrder.restaurantLogo} 
                      alt="Restaurant"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-gray-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-lg truncate">
                    {selectedOrder.restaurantName || 'اطبعلي للطباعة'}
                  </h3>
                  <p className="text-sm text-gray-600">خدمات الطباعة والتصوير</p>
                </div>
              </div>
              <Badge className="bg-gray-900 text-white border-0 px-3 py-1 text-sm font-bold flex-shrink-0">
                قيد التوصيل
              </Badge>
            </div>

            {/* ETA Section */}
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">الوصول المتوقع</span>
                <span className="text-2xl font-bold text-gray-900" data-testid="text-eta">
                  {calculateETA(selectedOrder.estimatedDelivery)}
                </span>
              </div>
            </div>

            {/* Status Alert */}
            <div className="bg-[--brand-50] border border-[--brand-200] rounded-xl p-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[--brand-500] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <p className="text-sm text-[--brand-700] font-medium">
                  طلبك في الطريق! سنخبرك عند اقتراب {selectedOrder.driverName || 'الكابتن'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Driver Card */}
        {selectedOrder?.driverName && (
          <div className="px-6 py-5 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[--brand-500] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-xl">
                  {selectedOrder.driverName.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-xl mb-1">
                  {selectedOrder.driverName}
                </h3>
                <p className="text-gray-600">
                  كابتن التوصيل المختص بطلبك اليوم
                </p>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <button 
                  className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  onClick={() => window.location.href = `/chat?order=${selectedOrder.id}`}
                  data-testid="button-chat"
                  title="محادثة"
                >
                  <MessageCircle className="h-6 w-6 text-gray-700" />
                </button>
                {selectedOrder.driverPhone && (
                  <button 
                    className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors"
                    onClick={() => window.open(`tel:${selectedOrder.driverPhone}`)}
                    data-testid="button-call"
                    title="اتصال"
                  >
                    <Phone className="h-6 w-6 text-green-600" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}


        {/* Order Details */}
        {selectedOrder && (
          <div className="p-4 space-y-6">
            {/* Delivering To */}
            <div data-testid="section-delivery">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Home className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">توصيل إلى</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDeliveryDate(selectedOrder.createdAt)}</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 mr-11">{selectedOrder.deliveryAddress}</p>
            </div>

            <Separator />

            {/* Your Order From */}
            <div data-testid="section-restaurant">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">طلبك من</h3>
                  <h4 className="text-lg font-bold text-gray-900">
                    {selectedOrder.restaurantName || 'اطبعلي للطباعة'}
                  </h4>
                  <p className="text-sm text-gray-600">خدمات الطباعة والتصوير</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                  {selectedOrder.restaurantLogo ? (
                    <img 
                      src={selectedOrder.restaurantLogo} 
                      alt="Restaurant"
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Package className="h-6 w-6 text-gray-600" />
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Order Items */}
            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div data-testid="section-items">
                <h3 className="font-bold text-gray-900 mb-4">المنتجات</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item: OrderItem, index: number) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-gray-100 rounded text-sm flex items-center justify-center font-medium">
                        {item.quantity}
                      </span>
                      <span className="flex-1 text-gray-900">
                        {item.productName || item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Payment Details */}
            <div data-testid="section-payment">
              <h3 className="font-bold text-gray-900 mb-4">تفاصيل الدفع</h3>
              <div className="flex items-center justify-between">
                <span className="text-gray-900 font-medium">الإجمالي</span>
                <span className="text-lg font-bold text-gray-900">
                  {selectedOrder.totalAmount} جنيه
                </span>
              </div>
            </div>

            <Separator />

            {/* Support */}
            <div data-testid="section-support">
              <h3 className="font-bold text-gray-900 mb-3">الدعم</h3>
              <p className="text-sm text-gray-600">
                طلب #{selectedOrder.orderNumber}
              </p>
              
              <Button 
                variant="outline" 
                className="w-full mt-4 border-2 h-12"
                onClick={() => window.location.href = `/support?order=${selectedOrder.orderNumber}`}
              >
                <HeadphonesIcon className="h-5 w-5 ml-2" />
                تواصل مع الدعم
              </Button>
            </div>

            {/* Back to Orders Button */}
            <Button 
              variant="outline" 
              className="w-full border-2 h-12 mt-6"
              onClick={() => window.location.href = '/orders-list'}
            >
              <ArrowLeft className="h-5 w-5 ml-2" />
              العودة لقائمة الطلبات
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}