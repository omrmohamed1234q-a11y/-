import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket, useWebSocketEvent } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
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

  // Real order data from API
  const [selectedOrderData, setSelectedOrderData] = useState<any>(null);
  
  // WebSocket for real-time updates
  const { state: wsState, subscribeToOrderUpdates } = useWebSocket();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch order data from API
  const { data: orderData, isLoading: orderLoading } = useQuery<any>({
    queryKey: ['/api/orders', selectedOrderId],
    enabled: !!selectedOrderId,
    refetchInterval: 5000 // تحديث كل 5 ثوان للحصول على التحديثات الفورية
  });
  
  // Helper function to get status text
  const getStatusText = (status: string) => {
    switch(status) {
      case 'reviewing':
      case 'pending':
        return 'جاري مراجعة الطلب';
      case 'preparing':
      case 'processing':
        return 'جاري تجهيز المطبوعات';
      case 'printing':
        return 'جاري الطباعة';
      case 'out_for_delivery':
      case 'delivering':
        return 'جاري التوصيل';
      case 'cancelled':
        return 'تم إلغاء الطلب';
      case 'completed':
      case 'delivered':
        return 'تم تسليم الطلب';
      default:
        return 'جاري مراجعة الطلب';
    }
  };
  
  // Fetch all orders for the user
  const { data: ordersArray = [], isLoading, refetch } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    refetchInterval: 10000 // تحديث كل 10 ثوان للحصول على طلبات جديدة
  });
  
  // Filter out cancelled orders - only show active orders
  const visibleOrders = useMemo(() => 
    ordersArray.filter(order => order.status !== 'cancelled'), 
    [ordersArray]
  );
  
  // Get the active order from visible orders only
  const activeOrder = visibleOrders.find((order: Order) => 
    ['out_for_delivery', 'ready', 'processing', 'confirmed', 'pending', 'preparing', 'printing', 'reviewing'].includes(order.status)
  ) || visibleOrders[0];

  // Get the selected order with real-time status updates (from visible orders only)
  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return activeOrder;
    
    // First try to get from visible orders list (excludes cancelled)
    const orderFromList = visibleOrders.find((o: Order) => o.id === selectedOrderId);
    
    // If we have real-time data and it's not cancelled, merge it
    if (orderData?.order && orderFromList && orderData.order.status !== 'cancelled') {
      return {
        ...orderFromList,
        ...orderData.order
      };
    }
    
    // If order became cancelled or not found, return activeOrder or null
    return orderFromList || activeOrder;
  }, [selectedOrderId, visibleOrders, orderData?.order, activeOrder]);

  // Determine order stage from selected order status (real-time)
  const orderStage = useMemo(() => {
    if (!selectedOrder) return 'reviewing';
    
    const status = selectedOrder.status;
    
    // Map backend status to frontend stages
    switch(status) {
      case 'reviewing':
      case 'pending':
        return 'reviewing';
      case 'preparing':
      case 'processing':
      case 'printing':
        return 'preparing';
      case 'out_for_delivery':
      case 'delivering':
        return 'delivering';
      case 'cancelled':
        return 'cancelled';
      case 'completed':
      case 'delivered':
        return 'delivered';
      default:
        return 'reviewing';
    }
  }, [selectedOrder?.status]);
  
  // Get order info from real data
  const getOrderInfo = () => {
    if (!orderData?.order) {
      return {
        status: 'reviewing',
        statusText: 'جاري مراجعة الطلب',
        stage: 'reviewing' as const
      };
    }
    
    const order = orderData.order;
    return {
      status: order.status,
      statusText: order.statusText || getStatusText(order.status),
      stage: orderStage
    };
  };

  const currentOrderInfo = getOrderInfo();

  // Set first order as selected by default
  useEffect(() => {
    if (activeOrder && !selectedOrderId) {
      setSelectedOrderId(activeOrder.id);
    }
  }, [activeOrder, selectedOrderId]);

  // Subscribe to real-time order updates via WebSocket
  useEffect(() => {
    if (selectedOrderId && wsState.isConnected) {
      subscribeToOrderUpdates(selectedOrderId);
    }
  }, [selectedOrderId, wsState.isConnected, subscribeToOrderUpdates]);
  
  // Listen for order status updates
  useWebSocketEvent('order_status_update', (data: any) => {
    console.log('📱 Real-time order status update received:', data);
    
    if (data.orderId === selectedOrderId || ordersArray.some(o => o.id === data.orderId)) {
      // If order became cancelled and it's currently selected, clear selection
      if (data.newStatus === 'cancelled' && data.orderId === selectedOrderId) {
        setSelectedOrderId(null);
      }
      
      // Invalidate and refetch order data
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      if (selectedOrderId) {
        queryClient.invalidateQueries({ queryKey: ['/api/orders', selectedOrderId] });
      }
      
      // Show toast notification
      toast({
        title: '📱 تحديث حالة الطلب',
        description: `تم تحديث حالة الطلب: ${data.statusText || data.status}`,
        duration: 5000
      });
    }
  });
  
  // Listen for delivery location updates
  useWebSocketEvent('driver_location_update', (data: any) => {
    console.log('🚚 Driver location update received:', data);
    
    if (data.orderId === selectedOrderId) {
      // This could trigger map updates in the future
      console.log('📍 Driver location for current order updated');
    }
  });
  

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

  if (!visibleOrders.length) {
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
                  {selectedOrder.statusText || getStatusText(selectedOrder.status)}
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
          
        </div>
      )}
      
      {/* Top Section: Animation or Map */}
      {selectedOrder && (
        <div className="relative h-[52vh] w-full bg-gradient-to-br from-gray-50 to-gray-100">
          {/* Animation for Reviewing Stage */}
          {orderStage === 'reviewing' && (
            <div className="flex items-center justify-center h-full">
              {/* Beautiful reviewing animation filling the whole space */}
              <div className="w-full h-full relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden">
                
                {/* Floating background particles */}
                <div className="absolute top-16 left-8 w-4 h-4 bg-blue-300/40 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
                <div className="absolute top-20 right-12 w-3 h-3 bg-purple-300/40 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
                <div className="absolute bottom-32 left-10 w-3 h-3 bg-pink-300/40 rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '3.5s' }}></div>
                <div className="absolute top-28 left-1/4 w-2 h-2 bg-yellow-300/40 rounded-full animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3.8s' }}></div>
                <div className="absolute bottom-20 right-16 w-3 h-3 bg-green-300/40 rounded-full animate-bounce" style={{ animationDelay: '2.2s', animationDuration: '3.2s' }}></div>
                
                {/* Central documents stack */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    {/* Bottom document */}
                    <div className="w-24 h-20 bg-white rounded-lg shadow-xl border border-gray-100"></div>
                    
                    {/* Middle document */}
                    <div className="absolute -top-3 left-3 w-24 h-20 bg-white rounded-lg shadow-xl border border-gray-100">
                      <div className="h-4 bg-gradient-to-r from-[--brand-400] to-[--brand-600] rounded-t-lg mx-1 mt-1"></div>
                      <div className="h-1 bg-gray-200 rounded mx-2 mt-2"></div>
                      <div className="h-1 bg-gray-200 rounded mx-2 mt-1"></div>
                      <div className="h-1 bg-gray-300 rounded mx-2 mt-1"></div>
                    </div>
                    
                    {/* Top document with animation */}
                    <div className="absolute -top-6 left-6 w-24 h-20 bg-white rounded-lg shadow-2xl border-2 border-[--brand-300] animate-pulse">
                      <div className="h-4 bg-gradient-to-r from-[--brand-500] to-[--brand-700] rounded-t-lg mx-1 mt-1"></div>
                      <div className="h-1 bg-gray-200 rounded mx-2 mt-2"></div>
                      <div className="h-1 bg-gray-200 rounded mx-2 mt-1"></div>
                      <div className="h-1 bg-gray-300 rounded mx-2 mt-1"></div>
                    </div>
                  </div>
                </div>
                
                {/* Magnifying glass animation */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 translate-x-12 translate-y-12">
                  <div className="relative animate-bounce" style={{ animationDuration: '2s' }}>
                    {/* Magnifying glass circle */}
                    <div className="w-20 h-20 border-4 border-blue-500 rounded-full bg-white/20 backdrop-blur-sm shadow-xl">
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-100/50 to-transparent"></div>
                    </div>
                    {/* Handle */}
                    <div className="absolute -bottom-4 -right-4 w-10 h-3 bg-blue-600 rounded-full rotate-45 shadow-lg"></div>
                  </div>
                </div>
                
                {/* Check marks appearing */}
                <div className="absolute top-24 left-16">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-ping" style={{ animationDelay: '1s' }}>
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                <div className="absolute top-32 right-20">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-ping" style={{ animationDelay: '2s' }}>
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                <div className="absolute bottom-16 left-20">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-ping" style={{ animationDelay: '3s' }}>
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                {/* Floating documents around */}
                <div className="absolute top-16 right-12">
                  <div className="w-16 h-10 bg-white rounded shadow-lg rotate-12 animate-bounce border-l-4 border-[--brand-400]" style={{ animationDelay: '0.5s', animationDuration: '3s' }}>
                    <div className="h-1.5 bg-gray-200 rounded mx-1 mt-1"></div>
                    <div className="h-0.5 bg-gray-300 rounded mx-1 mt-0.5"></div>
                    <div className="h-0.5 bg-gray-300 rounded mx-1 mt-0.5"></div>
                  </div>
                </div>
                
                <div className="absolute bottom-20 right-8">
                  <div className="w-14 h-16 bg-white rounded shadow-lg -rotate-6 animate-bounce border-l-4 border-purple-400" style={{ animationDelay: '1.5s', animationDuration: '2.5s' }}>
                    <div className="h-1.5 bg-gray-200 rounded mx-1 mt-1"></div>
                    <div className="h-0.5 bg-gray-300 rounded mx-1 mt-0.5"></div>
                    <div className="h-0.5 bg-gray-300 rounded mx-1 mt-0.5"></div>
                    <div className="h-0.5 bg-gray-300 rounded mx-1 mt-0.5"></div>
                  </div>
                </div>
                
                <div className="absolute bottom-8 left-12">
                  <div className="w-18 h-8 bg-white rounded shadow-lg rotate-6 animate-bounce border-l-4 border-blue-400" style={{ animationDelay: '2.5s', animationDuration: '2.8s' }}>
                    <div className="h-1.5 bg-gray-200 rounded mx-1 mt-1"></div>
                    <div className="h-0.5 bg-gray-300 rounded mx-1 mt-0.5"></div>
                  </div>
                </div>
                
                <div className="absolute top-40 left-8">
                  <div className="w-12 h-14 bg-white rounded shadow-lg -rotate-12 animate-bounce border-l-4 border-pink-400" style={{ animationDelay: '3.5s', animationDuration: '3.2s' }}>
                    <div className="h-1.5 bg-gray-200 rounded mx-1 mt-1"></div>
                    <div className="h-0.5 bg-gray-300 rounded mx-1 mt-0.5"></div>
                    <div className="h-0.5 bg-gray-300 rounded mx-1 mt-0.5"></div>
                  </div>
                </div>
                
                {/* Sparkle effects */}
                <div className="absolute top-20 left-24 w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-36 right-16 w-2 h-2 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-24 left-16 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute top-28 left-32 w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '2.8s' }}></div>
                <div className="absolute bottom-32 right-24 w-1 h-1 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '1.8s' }}></div>
                
              </div>
            </div>
          )}
          
          {/* Animation for Preparing Stage */}
          {orderStage === 'preparing' && (
            <div className="flex items-center justify-center h-full">
              {/* Beautiful preparing animation with animated background */}
              <div className="w-full h-full relative bg-gradient-to-br from-indigo-50 via-white to-purple-50 overflow-hidden">
                
                {/* Floating background particles */}
                <div className="absolute top-16 left-8 w-4 h-4 bg-blue-300/40 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
                <div className="absolute top-20 right-12 w-3 h-3 bg-purple-300/40 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
                <div className="absolute bottom-32 left-10 w-3 h-3 bg-pink-300/40 rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '3.5s' }}></div>
                <div className="absolute top-28 left-1/4 w-2 h-2 bg-yellow-300/40 rounded-full animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3.8s' }}></div>
                <div className="absolute bottom-20 right-16 w-3 h-3 bg-green-300/40 rounded-full animate-bounce" style={{ animationDelay: '2.2s', animationDuration: '3.2s' }}></div>
                
                {/* Central Printer Animation */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    {/* Printer body - bigger and black */}
                    <div className="w-48 h-32 bg-gray-900 border-4 border-gray-700 rounded-xl shadow-2xl">
                      <div className="w-full h-4 bg-gray-800 rounded-t-lg"></div>
                      <div className="flex items-center justify-center h-full">
                        <div className="w-8 h-8 bg-gray-600 rounded-full animate-spin"></div>
                      </div>
                      
                      {/* Printer details */}
                      <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                      <div className="absolute top-2 left-2 w-10 h-1.5 bg-gray-600 rounded"></div>
                    </div>
                    
                    {/* Paper coming out - bigger */}
                    <div className="absolute -bottom-6 left-6 right-6">
                      <div className="w-36 h-16 bg-white border-2 border-gray-300 rounded-b-lg animate-pulse shadow-xl">
                        <div className="h-3 bg-[--brand-600] rounded-full mx-2 mt-2"></div>
                        <div className="h-1 bg-gray-400 rounded-full mx-2 mt-2"></div>
                        <div className="h-1 bg-gray-400 rounded-full mx-2 mt-1"></div>
                        <div className="h-1 bg-gray-400 rounded-full mx-2 mt-1"></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Animated red dots showing printing progress */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 translate-y-20 flex space-x-3">
                  <div className="w-4 h-4 bg-[--brand-500] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-4 h-4 bg-[--brand-500] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-4 h-4 bg-[--brand-500] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                
                {/* Floating printed pages around */}
                <div className="absolute top-16 right-12">
                  <div className="w-16 h-12 bg-white rounded shadow-lg rotate-12 animate-bounce border-l-4 border-[--brand-400]" style={{ animationDelay: '0.5s', animationDuration: '3s' }}>
                    <div className="h-2 bg-[--brand-500] rounded-t mx-1 mt-1"></div>
                    <div className="h-0.5 bg-gray-300 rounded mx-1 mt-0.5"></div>
                    <div className="h-0.5 bg-gray-300 rounded mx-1 mt-0.5"></div>
                  </div>
                </div>
                
                <div className="absolute bottom-20 right-8">
                  <div className="w-14 h-18 bg-white rounded shadow-lg -rotate-6 animate-bounce border-l-4 border-purple-400" style={{ animationDelay: '1.5s', animationDuration: '2.5s' }}>
                    <div className="h-2 bg-purple-500 rounded-t mx-1 mt-1"></div>
                    <div className="h-0.5 bg-gray-300 rounded mx-1 mt-0.5"></div>
                    <div className="h-0.5 bg-gray-300 rounded mx-1 mt-0.5"></div>
                    <div className="h-0.5 bg-gray-300 rounded mx-1 mt-0.5"></div>
                  </div>
                </div>
                
                <div className="absolute bottom-8 left-12">
                  <div className="w-18 h-10 bg-white rounded shadow-lg rotate-6 animate-bounce border-l-4 border-blue-400" style={{ animationDelay: '2.5s', animationDuration: '2.8s' }}>
                    <div className="h-2 bg-blue-500 rounded-t mx-1 mt-1"></div>
                    <div className="h-0.5 bg-gray-300 rounded mx-1 mt-0.5"></div>
                  </div>
                </div>
                
                <div className="absolute top-40 left-8">
                  <div className="w-12 h-16 bg-white rounded shadow-lg -rotate-12 animate-bounce border-l-4 border-pink-400" style={{ animationDelay: '3.5s', animationDuration: '3.2s' }}>
                    <div className="h-2 bg-pink-500 rounded-t mx-1 mt-1"></div>
                    <div className="h-0.5 bg-gray-300 rounded mx-1 mt-0.5"></div>
                    <div className="h-0.5 bg-gray-300 rounded mx-1 mt-0.5"></div>
                  </div>
                </div>
                
                {/* Progress indicators - gear icons */}
                <div className="absolute top-20 left-20">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center animate-spin" style={{ animationDelay: '1s' }}>
                    <div className="w-4 h-4 border-2 border-white rounded-full"></div>
                  </div>
                </div>
                
                <div className="absolute top-28 right-20">
                  <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center animate-spin" style={{ animationDelay: '2s', animationDuration: '3s' }}>
                    <div className="w-3 h-3 border-2 border-white rounded-full"></div>
                  </div>
                </div>
                
                <div className="absolute bottom-16 left-16">
                  <div className="w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center animate-spin" style={{ animationDelay: '1.5s', animationDuration: '2.5s' }}>
                    <div className="w-3 h-3 border-2 border-white rounded-full"></div>
                  </div>
                </div>
                
                {/* Sparkle effects */}
                <div className="absolute top-20 left-24 w-2 h-2 bg-yellow-400 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-36 right-16 w-2 h-2 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-24 left-16 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute top-28 left-32 w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '2.8s' }}></div>
                <div className="absolute bottom-32 right-24 w-1 h-1 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '1.8s' }}></div>
                
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