import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '@/lib/queryClient';
import {
  ShoppingCart,
  Clock,
  DollarSign,
  FileText,
  User,
  Phone,
  MapPin,
  Calendar,
  Printer,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit,
  Calculator,
  Package,
  Truck,
  Star,
  MessageCircle,
  Download,
  Upload,
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  ArrowRight,
  ArrowLeft,
  Trash2
} from 'lucide-react';

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'pricing' | 'confirmed' | 'printing' | 'ready' | 'delivered' | 'cancelled';
  orderDate: string;
  deliveryAddress: string;
  notes: string;
  adminNotes: string;
  estimatedCost: number;
  finalPrice: number;
  paymentMethod: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

interface OrderItem {
  id: string;
  type: 'document' | 'book' | 'custom';
  name: string;
  description: string;
  quantity: number;
  pages: number;
  color: boolean;
  paperSize: string;
  binding: string;
  fileUrl?: string;
  estimatedPrice: number;
  finalPrice: number;
}

interface Driver {
  id: string;
  name: string;
  username: string;
  driverCode: string;
  phone: string;
  email: string;
  vehicleType: string;
  vehiclePlate: string;
  status: 'online' | 'offline' | 'busy';
  isAvailable: boolean;
  currentOrders: number;
  rating: number;
  deliveryCount: number;
}

export default function OrdersManagement() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPricingDialog, setShowPricingDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDriverDialog, setShowDriverDialog] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [orderToAssign, setOrderToAssign] = useState<Order | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [pricingData, setPricingData] = useState<any>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders']
  });

  // Fetch available drivers
  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ['/api/admin/drivers'],
    retry: false
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (data: { orderId: string; updates: Partial<Order> }) => {
      return apiRequest('PUT', `/api/admin/orders/${data.orderId}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث الطلب بنجاح",
      });
    }
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      return apiRequest('DELETE', `/api/admin/orders/${orderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      setShowDeleteDialog(false);
      setOrderToDelete(null);
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف الطلب بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف الطلب",
        variant: "destructive",
      });
    }
  });

  // Assign driver mutation
  const assignDriverMutation = useMutation({
    mutationFn: async (data: { orderId: string; driverId: string }) => {
      return apiRequest('POST', `/api/admin/orders/${data.orderId}/assign-driver`, {
        driverId: data.driverId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      setShowDriverDialog(false);
      setOrderToAssign(null);
      setSelectedDriverId('');
      toast({
        title: "تم تعيين السائق",
        description: "تم تعيين السائق للطلب بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التعيين",
        description: error.message || "حدث خطأ أثناء تعيين السائق",
        variant: "destructive",
      });
    }
  });

  const statusColors = {
    pending: 'bg-red-100 text-red-800 border-red-200',
    pricing: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    printing: 'bg-purple-100 text-purple-800 border-purple-200',
    ready: 'bg-green-100 text-green-800 border-green-200',
    delivered: 'bg-gray-100 text-gray-800 border-gray-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200'
  };

  const statusLabels = {
    pending: 'في الانتظار',
    pricing: 'قيد التسعير',
    confirmed: 'مؤكد',
    printing: 'قيد الطباعة',
    ready: 'جاهز للاستلام',
    delivered: 'تم التسليم',
    cancelled: 'ملغي'
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-600',
    high: 'bg-orange-100 text-orange-600',
    urgent: 'bg-red-100 text-red-600'
  };

  const priorityLabels = {
    low: 'عادي',
    medium: 'متوسط',
    high: 'عالي',
    urgent: 'عاجل'
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerPhone.includes(searchTerm) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateOrderMutation.mutate({
      orderId,
      updates: { status: newStatus as any }
    });
  };

  const handlePricing = (order: Order) => {
    setSelectedOrder(order);
    setPricingData({
      orderId: order.id,
      items: order.items.map(item => ({
        ...item,
        estimatedPrice: item.estimatedPrice || 0,
        finalPrice: item.finalPrice || 0
      })),
      totalEstimated: 0,
      totalFinal: 0,
      notes: ''
    });
    setShowPricingDialog(true);
  };

  const handleDeleteOrder = (order: Order) => {
    setOrderToDelete(order);
    setShowDeleteDialog(true);
  };

  const confirmDeleteOrder = () => {
    if (orderToDelete) {
      deleteOrderMutation.mutate(orderToDelete.id);
    }
  };

  const handleAssignDriver = (order: Order) => {
    setOrderToAssign(order);
    setShowDriverDialog(true);
  };

  const confirmAssignDriver = () => {
    if (orderToAssign && selectedDriverId) {
      assignDriverMutation.mutate({
        orderId: orderToAssign.id,
        driverId: selectedDriverId
      });
    }
  };

  const calculateItemPrice = (item: OrderItem) => {
    // Base pricing logic
    let basePrice = 0;
    const paperCost = item.paperSize === 'A4' ? 0.5 : item.paperSize === 'A3' ? 1 : 0.3;
    const colorMultiplier = item.color ? 2 : 1;
    const bindingCost = item.binding === 'spiral' ? 5 : item.binding === 'hardcover' ? 15 : 0;
    
    basePrice = (item.pages * paperCost * colorMultiplier + bindingCost) * item.quantity;
    
    return Math.ceil(basePrice);
  };

  const savePricing = () => {
    const totalFinal = pricingData.items.reduce((sum: number, item: any) => sum + (item.finalPrice || 0), 0);
    
    updateOrderMutation.mutate({
      orderId: pricingData.orderId,
      updates: {
        items: pricingData.items,
        finalPrice: totalFinal,
        status: 'confirmed',
        adminNotes: pricingData.notes
      }
    });
    
    setShowPricingDialog(false);
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الطلبات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Top Header with Back Button */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-gray-100">
                <ArrowLeft className="w-4 h-4" />
                <span>العودة للوحة التحكم</span>
              </Button>
            </Link>
            
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-gray-800">إدارة الطلبات</span>
            </div>
            
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الطلبات الجديدة</h1>
          <p className="text-gray-600 mt-2">معالجة وتسعير الطلبات الواردة</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-lg px-4 py-2">
            {filteredOrders.length} طلب
          </Badge>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            إضافة طلب يدوي
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث بالاسم، الهاتف، أو رقم الطلب..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="تصفية حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الطلبات</SelectItem>
                <SelectItem value="pending">في الانتظار</SelectItem>
                <SelectItem value="pricing">قيد التسعير</SelectItem>
                <SelectItem value="confirmed">مؤكد</SelectItem>
                <SelectItem value="printing">قيد الطباعة</SelectItem>
                <SelectItem value="ready">جاهز للاستلام</SelectItem>
                <SelectItem value="delivered">تم التسليم</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Grid */}
      <div className="grid gap-6">
        <AnimatePresence>
          {filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">طلب #{order.id}</CardTitle>
                        <Badge className={`${statusColors[order.status]} border`}>
                          {statusLabels[order.status]}
                        </Badge>
                        <Badge className={`${priorityColors[order.priority]}`}>
                          {priorityLabels[order.priority]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(order.orderDate).toLocaleDateString('ar-EG')}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {order.customerName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {order.customerPhone}
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-2xl font-bold text-green-600">
                        {order.finalPrice || order.estimatedCost || '---'} جنيه
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.items.length} عنصر
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Order Items */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      عناصر الطلب
                    </h4>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white rounded p-3">
                          <div className="flex-1">
                            <div className="font-medium">{item.name}</div>
                            <div className="text-sm text-gray-600">
                              {item.pages} صفحة • {item.color ? 'ملون' : 'أبيض وأسود'} • {item.paperSize}
                              {item.binding && ` • ${item.binding}`}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-500">الكمية</div>
                            <div className="font-bold">{item.quantity}</div>
                          </div>
                          <div className="text-left">
                            <div className="text-sm text-gray-500">السعر</div>
                            <div className="font-bold text-green-600">
                              {item.finalPrice || item.estimatedPrice || '---'} جنيه
                            </div>
                          </div>
                          {item.fileUrl && (
                            <Button variant="outline" size="sm" className="mr-2">
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Info */}
                  {order.deliveryAddress && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span className="text-gray-600">{order.deliveryAddress}</span>
                    </div>
                  )}

                  {order.notes && (
                    <div className="flex items-start gap-2 text-sm">
                      <MessageCircle className="w-4 h-4 text-gray-400 mt-0.5" />
                      <span className="text-gray-600">{order.notes}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                      {order.status === 'pending' && (
                        <Button
                          onClick={() => handlePricing(order)}
                          className="gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                          <Calculator className="w-4 h-4" />
                          بدء التسعير
                        </Button>
                      )}
                      
                      {order.status === 'confirmed' && (
                        <Button
                          onClick={() => handleStatusUpdate(order.id, 'printing')}
                          className="gap-2 bg-purple-600 hover:bg-purple-700"
                        >
                          <Printer className="w-4 h-4" />
                          بدء الطباعة
                        </Button>
                      )}

                      {order.status === 'printing' && (
                        <Button
                          onClick={() => handleStatusUpdate(order.id, 'ready')}
                          className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          جاهز للاستلام
                        </Button>
                      )}

                      {order.status === 'ready' && (
                        <>
                          <Button
                            onClick={() => handleAssignDriver(order)}
                            className="gap-2 bg-cyan-600 hover:bg-cyan-700"
                          >
                            <Truck className="w-4 h-4" />
                            تعيين سائق
                          </Button>
                          <Button
                            onClick={() => handleStatusUpdate(order.id, 'delivered')}
                            className="gap-2 bg-gray-600 hover:bg-gray-700"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            تم التسليم
                          </Button>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteOrder(order)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`button-delete-order-${order.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pricing Dialog */}
      <Dialog open={showPricingDialog} onOpenChange={setShowPricingDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl">تسعير الطلب #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">معلومات العميل</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>الاسم: {selectedOrder?.customerName}</div>
                <div>الهاتف: {selectedOrder?.customerPhone}</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">عناصر الطلب والتسعير</h3>
              {pricingData.items?.map((item: any, idx: number) => (
                <Card key={idx}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <h4 className="font-medium mb-2">{item.name}</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>عدد الصفحات: {item.pages}</div>
                          <div>الكمية: {item.quantity}</div>
                          <div>النوع: {item.color ? 'ملون' : 'أبيض وأسود'}</div>
                          <div>حجم الورق: {item.paperSize}</div>
                          {item.binding && <div>التجليد: {item.binding}</div>}
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">السعر المقدر</label>
                          <Input
                            type="number"
                            value={item.estimatedPrice || calculateItemPrice(item)}
                            onChange={(e) => {
                              const newItems = [...pricingData.items];
                              newItems[idx].estimatedPrice = Number(e.target.value);
                              setPricingData({...pricingData, items: newItems});
                            }}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">السعر النهائي</label>
                          <Input
                            type="number"
                            value={item.finalPrice || ''}
                            onChange={(e) => {
                              const newItems = [...pricingData.items];
                              newItems[idx].finalPrice = Number(e.target.value);
                              setPricingData({...pricingData, items: newItems});
                            }}
                            className="mt-1"
                            placeholder="أدخل السعر النهائي"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">إجمالي السعر النهائي:</span>
                <span className="text-2xl font-bold text-green-600">
                  {pricingData.items?.reduce((sum: number, item: any) => sum + (item.finalPrice || 0), 0)} جنيه
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">ملاحظات إدارية</label>
              <Textarea
                value={pricingData.notes || ''}
                onChange={(e) => setPricingData({...pricingData, notes: e.target.value})}
                placeholder="أضف ملاحظات حول التسعير أو التنفيذ..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={savePricing} className="flex-1">
                تأكيد التسعير وتحديث الطلب
              </Button>
              <Button variant="outline" onClick={() => setShowPricingDialog(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl text-red-600">تأكيد حذف الطلب</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">تحذير</span>
              </div>
              <p className="text-red-700 text-sm">
                هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>

            {orderToDelete && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="font-medium">تفاصيل الطلب:</div>
                <div className="text-sm space-y-1">
                  <div>رقم الطلب: <span className="font-semibold">{orderToDelete.id}</span></div>
                  <div>العميل: <span className="font-semibold">{orderToDelete.customerName}</span></div>
                  <div>القيمة: <span className="font-semibold">{orderToDelete.totalAmount} جنيه</span></div>
                  <div>الحالة: <span className="font-semibold">{statusLabels[orderToDelete.status as keyof typeof statusLabels]}</span></div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                variant="destructive" 
                onClick={confirmDeleteOrder}
                disabled={deleteOrderMutation.isPending}
                className="flex-1"
                data-testid="button-confirm-delete"
              >
                {deleteOrderMutation.isPending ? 'جاري الحذف...' : 'حذف الطلب'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleteOrderMutation.isPending}
                data-testid="button-cancel-delete"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Driver Dialog */}
      <Dialog open={showDriverDialog} onOpenChange={setShowDriverDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl">تعيين سائق للطلب</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {orderToAssign && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="font-medium">تفاصيل الطلب:</div>
                <div className="text-sm space-y-1">
                  <div>رقم الطلب: <span className="font-semibold">{orderToAssign.id}</span></div>
                  <div>العميل: <span className="font-semibold">{orderToAssign.customerName}</span></div>
                  <div>العنوان: <span className="font-semibold">{orderToAssign.deliveryAddress}</span></div>
                  <div>القيمة: <span className="font-semibold">{orderToAssign.totalAmount} جنيه</span></div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="driver-select">اختيار السائق</Label>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر سائق متاح" />
                </SelectTrigger>
                <SelectContent>
                  {drivers
                    .filter((driver) => driver.isAvailable && driver.status === 'online')
                    .map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4" />
                          <span>{driver.name}</span>
                          <span className="text-sm text-gray-500">({driver.driverCode})</span>
                        </div>
                      </SelectItem>
                    ))}
                  {drivers.filter((driver) => driver.isAvailable && driver.status === 'online').length === 0 && (
                    <SelectItem value="" disabled>
                      لا توجد سائقين متاحين حالياً
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={confirmAssignDriver}
                disabled={!selectedDriverId || assignDriverMutation.isPending}
                className="flex-1"
              >
                {assignDriverMutation.isPending ? 'جاري التعيين...' : 'تعيين السائق'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDriverDialog(false);
                  setSelectedDriverId('');
                }}
                disabled={assignDriverMutation.isPending}
              >
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}