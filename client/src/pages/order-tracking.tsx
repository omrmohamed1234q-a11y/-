import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  Package, MapPin, Phone, MessageCircle, Clock, Truck,
  CheckCircle2, XCircle, AlertCircle, Star, FileText,
  Navigation, Shield, CreditCard, Gift, Copy, Share2,
  ChevronLeft, ChevronRight, User, Calendar, Download
} from 'lucide-react';

interface OrderStatus {
  status: string;
  timestamp: Date;
  message: string;
  icon: any;
  completed: boolean;
}

interface DeliveryDriver {
  id: string;
  name: string;
  photo: string;
  phone: string;
  rating: number;
  deliveries: number;
  vehicle: string;
  plateNumber: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
  statusText?: string;
  createdAt: Date;
  confirmedAt?: Date;
  preparingAt?: Date;
  readyAt?: Date;
  outForDeliveryAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  driverId?: string;
  deliveryAddress: string;
  deliverySlot: 'asap' | 'scheduled';
  scheduledDate?: string;
  scheduledTime?: string;
  paymentMethod: string;
  paymentMethodText?: string;
  deliveryNotes?: string;
  driverNotes?: string;
  estimatedDelivery?: number;
  rating?: number;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  pointsEarned: number;
}

export default function OrderTracking() {
  const [, params] = useRoute('/orders/:id');
  const orderId = params?.id;
  const { toast } = useToast();
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [driverNote, setDriverNote] = useState('');
  const [showDriverChat, setShowDriverChat] = useState(false);

  // Fetch order details
  const { data: order, refetch } = useQuery<Order>({
    queryKey: ['/api/orders', orderId],
    enabled: !!orderId,
    refetchInterval: 5000, // Poll every 5 seconds for live updates
  });

  // Fetch driver location for live tracking
  const { data: driverLocation } = useQuery({
    queryKey: ['/api/driver-location', order?.driverId],
    enabled: !!order?.driverId && order?.status === 'out_for_delivery',
    refetchInterval: 3000, // Poll every 3 seconds for location
  });

  // Submit rating mutation
  const submitRatingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', `/api/orders/${orderId}/rating`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'شكراً لتقييمك',
        description: 'تم حفظ تقييمك بنجاح',
      });
      setShowRating(false);
      queryClient.invalidateQueries({ queryKey: ['/api/orders', orderId] });
    },
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/orders/${orderId}/cancel`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'تم إلغاء الطلب',
        description: 'تم إلغاء طلبك بنجاح',
      });
      refetch();
    },
  });

  // Send driver message mutation
  const sendDriverMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', `/api/orders/${orderId}/driver-message`, { message });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'تم إرسال الرسالة',
        description: 'تم إرسال رسالتك للسائق',
      });
      setDriverNote('');
      setShowDriverChat(false);
    },
  });

  // Download invoice mutation
  const downloadInvoiceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', `/api/orders/${orderId}/invoice`);
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${order?.orderNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
  });

  const getOrderStatuses = (): OrderStatus[] => {
    if (!order) return [];

    const statuses: OrderStatus[] = [
      {
        status: 'pending',
        timestamp: order.createdAt,
        message: 'تم استلام طلبك',
        icon: CheckCircle2,
        completed: true,
      },
      {
        status: 'confirmed',
        timestamp: order.confirmedAt,
        message: 'تم تأكيد الطلب',
        icon: Package,
        completed: ['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'].includes(order.status),
      },
      {
        status: 'preparing',
        timestamp: order.preparingAt,
        message: 'جاري تجهيز الطلب',
        icon: Clock,
        completed: ['preparing', 'ready', 'out_for_delivery', 'delivered'].includes(order.status),
      },
      {
        status: 'ready',
        timestamp: order.readyAt,
        message: 'الطلب جاهز',
        icon: CheckCircle2,
        completed: ['ready', 'out_for_delivery', 'delivered'].includes(order.status),
      },
      {
        status: 'out_for_delivery',
        timestamp: order.outForDeliveryAt,
        message: 'في الطريق إليك',
        icon: Truck,
        completed: ['out_for_delivery', 'delivered'].includes(order.status),
      },
      {
        status: 'delivered',
        timestamp: order.deliveredAt,
        message: 'تم التوصيل',
        icon: CheckCircle2,
        completed: order.status === 'delivered',
      },
    ];

    if (order.status === 'cancelled') {
      return [{
        status: 'cancelled',
        timestamp: order.cancelledAt,
        message: 'تم إلغاء الطلب',
        icon: XCircle,
        completed: true,
      }];
    }

    return statuses;
  };

  const getProgressPercentage = () => {
    if (!order) return 0;
    const statusMap: Record<string, number> = {
      pending: 16,
      confirmed: 33,
      preparing: 50,
      ready: 66,
      out_for_delivery: 83,
      delivered: 100,
      cancelled: 0,
    };
    return statusMap[order.status] || 0;
  };

  const mockDriver: DeliveryDriver = {
    id: '1',
    name: 'أحمد محمد',
    photo: '/driver-avatar.jpg',
    phone: '01012345678',
    rating: 4.8,
    deliveries: 523,
    vehicle: 'دراجة نارية',
    plateNumber: 'ABC 123',
  };

  const formatDeliveryTime = () => {
    if (!order) return '';
    if (order.deliverySlot === 'asap') {
      return 'في أقرب وقت ممكن';
    }
    return `${order.scheduledDate} ${order.scheduledTime}`;
  };

  const canCancelOrder = () => {
    if (!order) return false;
    return ['pending', 'confirmed'].includes(order.status);
  };

  const shareOrder = () => {
    if (navigator.share) {
      navigator.share({
        title: `طلب رقم ${order?.orderNumber}`,
        text: `تتبع طلبي من اطبعلي`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'تم نسخ الرابط',
        description: 'تم نسخ رابط تتبع الطلب',
      });
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                <ChevronRight className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold">طلب #{order.orderNumber}</h1>
                <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={shareOrder}>
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => downloadInvoiceMutation.mutate()}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Map (when driver is on the way) */}
      {order.status === 'out_for_delivery' && driverLocation && (
        <div className="bg-white border-b">
          <div className="h-64 bg-gray-200 relative">
            {/* Map placeholder - integrate with Google Maps or Mapbox */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Navigation className="w-12 h-12 text-green-600 mx-auto mb-2 animate-pulse" />
                <p className="text-gray-600">السائق في الطريق إليك</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  {order.estimatedDelivery ? `${order.estimatedDelivery} دقيقة` : '30-45 دقيقة'}
                </p>
              </div>
            </div>
            
            {/* Driver marker */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={mockDriver.photo} />
                  <AvatarFallback>{mockDriver.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{mockDriver.name}</p>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-sm">{mockDriver.rating}</span>
                    <span className="text-sm text-gray-500">({mockDriver.deliveries} توصيلة)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Order Status Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>حالة الطلب</span>
              <Badge
                variant={
                  order.status === 'delivered' ? 'default' :
                  order.status === 'cancelled' ? 'destructive' :
                  'secondary'
                }
              >
                {order.statusText || order.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Progress Bar */}
            <Progress value={getProgressPercentage()} className="mb-6 h-2" />

            {/* Timeline */}
            <div className="space-y-4">
              {getOrderStatuses().map((status, index) => (
                <div key={status.status} className="flex gap-3">
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center
                      ${status.completed ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                      <status.icon className="w-5 h-5" />
                    </div>
                    {index < getOrderStatuses().length - 1 && (
                      <div className={`absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-12
                        ${status.completed ? 'bg-green-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className="flex-1 pt-2">
                    <p className={`font-semibold ${status.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                      {status.message}
                    </p>
                    {status.timestamp && (
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(status.timestamp).toLocaleTimeString('ar-EG')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              {canCancelOrder() && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => cancelOrderMutation.mutate()}
                  disabled={cancelOrderMutation.isPending}
                >
                  <XCircle className="w-4 h-4 ml-2" />
                  إلغاء الطلب
                </Button>
              )}
              
              {order.status === 'delivered' && !order.rating && (
                <Button
                  className="flex-1"
                  onClick={() => setShowRating(true)}
                >
                  <Star className="w-4 h-4 ml-2" />
                  تقييم الطلب
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Driver Info (when assigned) */}
        {order.driverId && ['out_for_delivery', 'delivered'].includes(order.status) && (
          <Card>
            <CardHeader>
              <CardTitle>معلومات السائق</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={mockDriver.photo} />
                    <AvatarFallback>{mockDriver.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{mockDriver.name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{mockDriver.vehicle}</span>
                      <span>•</span>
                      <span>{mockDriver.plateNumber}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-current" />
                      <span className="text-sm">{mockDriver.rating}</span>
                      <span className="text-sm text-gray-500">({mockDriver.deliveries} توصيلة)</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.location.href = `tel:${mockDriver.phone}`}
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowDriverChat(true)}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Driver Notes */}
              {order.driverNotes && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-1">ملاحظات السائق:</p>
                  <p className="text-sm text-blue-800">{order.driverNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>تفاصيل الطلب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Delivery Info */}
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="font-semibold">عنوان التوصيل</span>
                </div>
                <p className="text-sm mr-6">{order.deliveryAddress}</p>
              </div>

              <Separator />

              {/* Delivery Time */}
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-semibold">موعد التوصيل</span>
                </div>
                <p className="text-sm mr-6">{formatDeliveryTime()}</p>
              </div>

              <Separator />

              {/* Payment Method */}
              <div>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <CreditCard className="w-4 h-4" />
                  <span className="font-semibold">طريقة الدفع</span>
                </div>
                <p className="text-sm mr-6">{order.paymentMethodText || order.paymentMethod}</p>
              </div>

              {/* Special Instructions */}
              {order.deliveryNotes && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <FileText className="w-4 h-4" />
                      <span className="font-semibold">ملاحظات خاصة</span>
                    </div>
                    <p className="text-sm mr-6">{order.deliveryNotes}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle>المنتجات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.quantity} × {item.price} ر.س</p>
                    </div>
                  </div>
                  <p className="font-semibold">{item.quantity * item.price} ر.س</p>
                </div>
              ))}

              <Separator />

              {/* Order Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>المجموع الفرعي</span>
                  <span>{order.subtotal} ر.س</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>الخصم</span>
                    <span>-{order.discount} ر.س</span>
                  </div>
                )}
                {order.deliveryFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>رسوم التوصيل</span>
                    <span>{order.deliveryFee} ر.س</span>
                  </div>
                )}
                {order.tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>الضريبة (15%)</span>
                    <span>{order.tax} ر.س</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>الإجمالي</span>
                  <span className="text-green-600">{order.total} ر.س</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loyalty Points Earned */}
        {order.pointsEarned > 0 && (
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <Gift className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="font-semibold">نقاط الولاء المكتسبة</p>
                  <p className="text-sm text-gray-600">يمكنك استخدامها في طلبك القادم</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                +{order.pointsEarned}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rating Dialog */}
      <Dialog open={showRating} onOpenChange={setShowRating}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>تقييم الطلب</DialogTitle>
            <DialogDescription>
              شاركنا رأيك في تجربة الطلب
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Star Rating */}
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'text-yellow-500 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Review Text */}
            <div>
              <Label htmlFor="review">اكتب تعليقك (اختياري)</Label>
              <Textarea
                id="review"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="شاركنا تجربتك..."
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <Button
              className="w-full"
              onClick={() => submitRatingMutation.mutate({ rating, review })}
              disabled={rating === 0 || submitRatingMutation.isPending}
            >
              إرسال التقييم
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Driver Chat Dialog */}
      <Dialog open={showDriverChat} onOpenChange={setShowDriverChat}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إرسال رسالة للسائق</DialogTitle>
            <DialogDescription>
              اكتب رسالتك للسائق {mockDriver.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={driverNote}
              onChange={(e) => setDriverNote(e.target.value)}
              placeholder="مثال: أنا في البوابة الثانية، اتصل عند الوصول..."
              rows={4}
            />
            <Button
              className="w-full"
              onClick={() => sendDriverMessageMutation.mutate(driverNote)}
              disabled={!driverNote || sendDriverMessageMutation.isPending}
            >
              <MessageCircle className="w-4 h-4 ml-2" />
              إرسال الرسالة
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}