import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  getOrderStatusText, 
  getOrderStatusColor, 
  getOrderStatusIcon,
  canUpdateOrderStatus,
  getOrderTimeline,
  DELIVERY_METHOD_TEXT,
  PAYMENT_METHOD_TEXT
} from "@/lib/order-utils";
import { 
  Package, 
  Search, 
  Filter, 
  Clock, 
  MapPin, 
  Phone,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Truck,
  User,
  Eye,
  Edit2,
  MoreHorizontal,
  TrendingUp,
  Activity,
  ShoppingCart,
  Calendar,
  Download,
  Plus,
  XCircle,
  ArrowUpDown
} from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  status: string;
  statusText: string;
  deliveryAddress: string;
  deliveryMethod: string;
  paymentMethod: string;
  createdAt: string;
  items: any[];
  driverName?: string;
  driverPhone?: string;
  estimatedDelivery?: string;
}

const QUICK_FILTERS = [
  { value: 'all', label: 'كل الطلبات', color: 'gray' },
  { value: 'pending', label: 'قيد المراجعة', color: 'yellow' },
  { value: 'confirmed', label: 'مؤكدة', color: 'blue' },
  { value: 'processing', label: 'قيد التنفيذ', color: 'purple' },
  { value: 'ready', label: 'جاهزة', color: 'green' },
  { value: 'out_for_delivery', label: 'في الطريق', color: 'orange' },
  { value: 'delivered', label: 'مكتملة', color: 'emerald' },
];

const STATUS_ACTIONS = {
  'pending': ['confirmed', 'cancelled'],
  'confirmed': ['processing', 'cancelled'],
  'processing': ['ready', 'cancelled'],
  'ready': ['out_for_delivery', 'delivered'],
  'out_for_delivery': ['delivered'],
  'delivered': [],
  'cancelled': []
};

export default function ModernOrdersManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("");
  const [staffNotes, setStaffNotes] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch orders
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/orders', statusFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await apiRequest('GET', `/api/admin/orders?${params.toString()}`);
      return response.json();
    },
    refetchInterval: 30000
  });

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status, notes }: { orderId: string, status: string, notes?: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/orders/${orderId}/status`, {
        status,
        staffNotes: notes,
        staffId: 'admin-001',
        staffName: 'الإدارة'
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم تحديث الطلب",
        description: `تم تغيير حالة الطلب إلى: ${getOrderStatusText(data.status)}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      setSelectedOrder(null);
      setShowOrderDetails(false);
      setUpdateStatus("");
      setStaffNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "فشل في تحديث الطلب",
        description: error.message || "حدث خطأ أثناء تحديث الطلب",
        variant: "destructive",
      });
    }
  });

  // Filter and sort orders
  const filteredOrders = orders
    .filter((order: Order) => {
      const matchesSearch = !searchQuery || 
        order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerPhone?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    })
    .sort((a: Order, b: Order) => {
      const aValue = a[sortField as keyof Order];
      const bValue = b[sortField as keyof Order];
      
      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Calculate statistics
  const stats = {
    total: orders.length,
    pending: orders.filter((o: Order) => o.status === 'pending').length,
    confirmed: orders.filter((o: Order) => o.status === 'confirmed').length,
    processing: orders.filter((o: Order) => o.status === 'processing').length,
    ready: orders.filter((o: Order) => o.status === 'ready').length,
    out_for_delivery: orders.filter((o: Order) => o.status === 'out_for_delivery').length,
    delivered: orders.filter((o: Order) => o.status === 'delivered').length,
    totalRevenue: orders.reduce((sum: number, order: Order) => sum + (order.totalAmount || 0), 0),
    averageOrder: orders.length > 0 ? orders.reduce((sum: number, order: Order) => sum + (order.totalAmount || 0), 0) / orders.length : 0
  };

  const handleQuickStatusUpdate = (order: Order, newStatus: string) => {
    if (!canUpdateOrderStatus(order.status, newStatus)) {
      toast({
        title: "تحديث غير مسموح",
        description: "لا يمكن تغيير حالة الطلب إلى هذه الحالة",
        variant: "destructive",
      });
      return;
    }

    updateOrderMutation.mutate({
      orderId: order.id,
      status: newStatus,
      notes: `تحديث سريع من ${getOrderStatusText(order.status)} إلى ${getOrderStatusText(newStatus)}`
    });
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
    setUpdateStatus("");
    setStaffNotes("");
  };

  const handleUpdateOrder = () => {
    if (!selectedOrder || !updateStatus) return;
    
    updateOrderMutation.mutate({
      orderId: selectedOrder.id,
      status: updateStatus,
      notes: staffNotes
    });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('ج.م.', 'جنيه');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">إدارة الطلبات</h1>
              <p className="text-gray-600 mt-1">متابعة وإدارة جميع الطلبات في النظام</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 ml-2" />
                تحديث
              </Button>
              <Button>
                <Download className="h-4 w-4 ml-2" />
                تصدير
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي الطلبات</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">قيد التنفيذ</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pending + stats.confirmed + stats.processing}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Activity className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">مكتملة اليوم</p>
                  <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي المبيعات</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {QUICK_FILTERS.map((filter) => (
                <Button
                  key={filter.value}
                  variant={statusFilter === filter.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(filter.value)}
                  className="h-8"
                >
                  {filter.label}
                  <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                    {filter.value === 'all' ? stats.total : 
                     filter.value === 'pending' ? stats.pending :
                     filter.value === 'confirmed' ? stats.confirmed :
                     filter.value === 'processing' ? stats.processing :
                     filter.value === 'ready' ? stats.ready :
                     filter.value === 'out_for_delivery' ? stats.out_for_delivery :
                     filter.value === 'delivered' ? stats.delivered : 0}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="البحث برقم الطلب، اسم العميل، أو رقم الهاتف..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={sortField} onValueChange={setSortField}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="ترتيب حسب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt">تاريخ الإنشاء</SelectItem>
                    <SelectItem value="totalAmount">المبلغ</SelectItem>
                    <SelectItem value="customerName">اسم العميل</SelectItem>
                    <SelectItem value="status">الحالة</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              قائمة الطلبات
              <Badge variant="outline">{filteredOrders.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">جاري تحميل الطلبات...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">لا توجد طلبات تطابق معايير البحث</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الطلب</TableHead>
                      <TableHead>العميل</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>طريقة التوصيل</TableHead>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order: Order) => (
                      <TableRow key={order.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            {order.orderNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customerName}</p>
                            <p className="text-sm text-gray-600">{order.customerPhone}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCurrency(order.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getOrderStatusColor(order.status)}>
                            {getOrderStatusText(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            {order.deliveryMethod === 'delivery' ? (
                              <>
                                <Truck className="h-3 w-3" />
                                توصيل
                              </>
                            ) : (
                              <>
                                <Package className="h-3 w-3" />
                                استلام
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewOrder(order)}
                            >
                              <Eye className="h-3 w-3 ml-1" />
                              عرض
                            </Button>
                            
                            {/* Quick Status Actions */}
                            {STATUS_ACTIONS[order.status as keyof typeof STATUS_ACTIONS]?.length > 0 && (
                              <Select onValueChange={(value) => handleQuickStatusUpdate(order, value)}>
                                <SelectTrigger className="w-auto h-8">
                                  <Edit2 className="h-3 w-3" />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_ACTIONS[order.status as keyof typeof STATUS_ACTIONS].map((status) => (
                                    <SelectItem key={status} value={status}>
                                      {getOrderStatusText(status)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                تفاصيل الطلب #{selectedOrder?.orderNumber}
              </DialogTitle>
              <DialogDescription>
                مراجعة وتحديث تفاصيل الطلب
              </DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">معلومات العميل</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{selectedOrder.customerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{selectedOrder.customerPhone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedOrder.deliveryAddress}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">تفاصيل الطلب</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">الحالة:</span>
                        <Badge className={getOrderStatusColor(selectedOrder.status)}>
                          {getOrderStatusText(selectedOrder.status)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">المبلغ الإجمالي:</span>
                        <span className="font-bold text-green-600">{formatCurrency(selectedOrder.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">طريقة الدفع:</span>
                        <span>{PAYMENT_METHOD_TEXT[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">تاريخ الإنشاء:</span>
                        <span>{formatDate(selectedOrder.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">المنتجات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedOrder.items?.map((item: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Package className="h-8 w-8 text-gray-400" />
                            <div>
                              <p className="font-medium">{item.productName || item.name}</p>
                              <p className="text-sm text-gray-600">الكمية: {item.quantity}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatCurrency(parseFloat(item.price) * item.quantity)}</p>
                            <p className="text-sm text-gray-600">{formatCurrency(parseFloat(item.price))} × {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Status Update */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">تحديث حالة الطلب</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status">الحالة الجديدة</Label>
                        <Select value={updateStatus} onValueChange={setUpdateStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الحالة الجديدة" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">قيد المراجعة</SelectItem>
                            <SelectItem value="confirmed">مؤكد</SelectItem>
                            <SelectItem value="processing">قيد التنفيذ</SelectItem>
                            <SelectItem value="ready">جاهز</SelectItem>
                            <SelectItem value="out_for_delivery">في الطريق</SelectItem>
                            <SelectItem value="delivered">مكتمل</SelectItem>
                            <SelectItem value="cancelled">ملغي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="notes">ملاحظات الموظف</Label>
                      <Textarea
                        id="notes"
                        value={staffNotes}
                        onChange={(e) => setStaffNotes(e.target.value)}
                        placeholder="أضف ملاحظات حول سبب التحديث..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleUpdateOrder}
                        disabled={!updateStatus || updateOrderMutation.isPending}
                        className="flex-1"
                      >
                        {updateOrderMutation.isPending ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                            جاري التحديث...
                          </>
                        ) : (
                          'تحديث الطلب'
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
                        إلغاء
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}