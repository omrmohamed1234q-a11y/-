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
  Package2,
  TrendingUp,
  BarChart3,
  History,
  Plus,
  Download,
  Edit,
  Trash2,
  AlertTriangle
} from "lucide-react";

export default function OrdersManagementEnhanced() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [updateStatus, setUpdateStatus] = useState("");
  const [staffNotes, setStaffNotes] = useState("");
  
  // Inventory states
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    currentStock: 0,
    minStockLevel: 10,
    price: 0,
    category: ''
  });
  const [products, setProducts] = useState<any[]>([]);
  const [inventoryStats, setInventoryStats] = useState<any>(null);
  
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
    refetchInterval: 30000 // Auto refresh every 30 seconds
  });

  // Fetch inventory data
  const { data: inventoryData, isLoading: inventoryLoading, refetch: refetchInventory } = useQuery({
    queryKey: ['/api/inventory/dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/inventory/dashboard');
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 30000
  });

  // Fetch products
  const { data: productsData, refetch: refetchProducts } = useQuery({
    queryKey: ['/api/inventory/products'],
    queryFn: async () => {
      const response = await fetch('/api/inventory/products');
      const result = await response.json();
      return result.data || [];
    }
  });

  // Update local states when data changes
  useEffect(() => {
    if (inventoryData) {
      setInventoryStats(inventoryData);
    }
  }, [inventoryData]);

  useEffect(() => {
    if (productsData) {
      setProducts(productsData);
    }
  }, [productsData]);

  // Update order status mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status, notes }: { orderId: string, status: string, notes?: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/orders/${orderId}/status`, {
        status,
        staffNotes: notes,
        staffId: 'admin-001', // Replace with actual staff ID
        staffName: 'الإدارة' // Replace with actual staff name
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
    },
    onError: (error: any) => {
      toast({
        title: "فشل في تحديث الطلب",
        description: error.message || "حدث خطأ أثناء تحديث الطلب",
        variant: "destructive",
      });
    }
  });

  const handleUpdateOrder = () => {
    if (!selectedOrder || !updateStatus) return;
    
    if (!canUpdateOrderStatus(selectedOrder.status, updateStatus)) {
      toast({
        title: "تحديث غير مسموح",
        description: "لا يمكن تغيير حالة الطلب إلى هذه الحالة",
        variant: "destructive",
      });
      return;
    }

    updateOrderMutation.mutate({
      orderId: selectedOrder.id,
      status: updateStatus,
      notes: staffNotes
    });
  };

  // Inventory functions
  const addProduct = async () => {
    try {
      const response = await fetch('/api/inventory/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      
      if (response.ok) {
        await refetchProducts();
        await refetchInventory();
        setNewProduct({ name: '', currentStock: 0, minStockLevel: 10, price: 0, category: '' });
        setShowAddDialog(false);
        toast({
          title: "تم إضافة المنتج",
          description: "تم إضافة المنتج بنجاح في المخزون"
        });
      } else {
        throw new Error('Failed to add product');
      }
    } catch (err) {
      toast({
        title: "خطأ",
        description: "فشل في إضافة المنتج",
        variant: "destructive"
      });
    }
  };

  const updateProductStock = async (productId: string, newStock: number) => {
    try {
      const response = await fetch(`/api/inventory/products/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStock: newStock })
      });
      
      if (response.ok) {
        await refetchProducts();
        await refetchInventory();
        toast({
          title: "تم التحديث",
          description: "تم تحديث مستوى المخزون بنجاح"
        });
      }
    } catch (err) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث المخزون",
        variant: "destructive"
      });
    }
  };

  const deleteProduct = async (productId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        const response = await fetch(`/api/inventory/products/${productId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          await refetchProducts();
          await refetchInventory();
          toast({
            title: "تم الحذف",
            description: "تم حذف المنتج بنجاح"
          });
        }
      } catch (err) {
        toast({
          title: "خطأ",
          description: "فشل في حذف المنتج",
          variant: "destructive"
        });
      }
    }
  };

  const createSampleData = async () => {
    try {
      const response = await fetch('/api/inventory/create-sample-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        await refetchInventory();
        await refetchProducts();
        toast({
          title: "تم إنشاء البيانات",
          description: "تم إنشاء البيانات التجريبية بنجاح"
        });
      }
    } catch (err) {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء البيانات التجريبية",
        variant: "destructive"
      });
    }
  };

  const filteredOrders = orders.filter((order: any) => {
    const matchesSearch = !searchQuery || 
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone?.toLowerCase().includes(searchQuery.toLowerCase());
      
    return matchesSearch;
  });

  const ordersByStatus = {
    new: filteredOrders.filter((order: any) => order.status === 'new').length,
    staff_received: filteredOrders.filter((order: any) => order.status === 'staff_received').length,
    printing: filteredOrders.filter((order: any) => order.status === 'printing').length,
    ready_pickup: filteredOrders.filter((order: any) => order.status === 'ready_pickup').length,
    ready_delivery: filteredOrders.filter((order: any) => order.status === 'ready_delivery').length,
    driver_assigned: filteredOrders.filter((order: any) => order.status === 'driver_assigned').length,
    out_for_delivery: filteredOrders.filter((order: any) => order.status === 'out_for_delivery').length,
  };

  // Filter functions for inventory
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(inventorySearchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(inventorySearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">إدارة الطلبات والمخزون</h1>
        <p className="text-muted-foreground">
          نظام إدارة متكامل للطلبات والمخزون مع ربط تلقائي
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            إدارة الطلبات
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package2 className="w-4 h-4" />
            إدارة المخزون
          </TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">

          {/* Orders Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">{ordersByStatus.new}</p>
                <p className="text-xs text-muted-foreground">مش مستلمة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{ordersByStatus.printing}</p>
                <p className="text-xs text-muted-foreground">جاري الطباعة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{ordersByStatus.ready_pickup + ordersByStatus.ready_delivery}</p>
                <p className="text-xs text-muted-foreground">جاهزة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-600">{ordersByStatus.driver_assigned + ordersByStatus.out_for_delivery}</p>
                <p className="text-xs text-muted-foreground">في التوصيل</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="ابحث برقم الطلب أو اسم العميل أو الجوال..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="فلتر حسب الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="new">مش مستلمة</SelectItem>
                <SelectItem value="staff_received">استلمها الموظف</SelectItem>
                <SelectItem value="printing">جاري الطباعة</SelectItem>
                <SelectItem value="ready_pickup">جاهزة في الفرع</SelectItem>
                <SelectItem value="ready_delivery">جاهزة للتوصيل</SelectItem>
                <SelectItem value="driver_assigned">راح للكابتن</SelectItem>
                <SelectItem value="out_for_delivery">في الطريق</SelectItem>
                <SelectItem value="delivered">تم التسليم</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => refetch()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>جاري تحميل الطلبات...</p>
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">مافيش طلبات</p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order: any) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getOrderStatusIcon(order.status)}</span>
                    <div>
                      <CardTitle className="text-lg">
                        طلب #{order.orderNumber}
                      </CardTitle>
                      <CardDescription>
                        {new Date(order.createdAt).toLocaleString('ar-EG')}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getOrderStatusColor(order.status)}>
                    {getOrderStatusText(order.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{order.customerName || 'عميل'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{order.customerPhone || 'لا يوجد'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{order.totalAmount} جنيه</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">طريقة التسليم:</p>
                    <p className="text-sm font-medium">
                      {DELIVERY_METHOD_TEXT[order.deliveryMethod as keyof typeof DELIVERY_METHOD_TEXT] || 'غير محدد'}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">طريقة الدفع:</p>
                    <p className="text-sm font-medium">
                      {PAYMENT_METHOD_TEXT[order.paymentMethod as keyof typeof PAYMENT_METHOD_TEXT] || 'غير محدد'}
                    </p>
                  </div>
                </div>

                {order.deliveryAddress && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-sm">{order.deliveryAddress}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>آخر تحديث: {new Date(order.updatedAt).toLocaleString('ar-EG')}</span>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedOrder(order)}
                      >
                        إدارة الطلب
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <span className="text-xl">{getOrderStatusIcon(order.status)}</span>
                          إدارة الطلب #{order.orderNumber}
                        </DialogTitle>
                        <DialogDescription>
                          تحديث حالة الطلب وإضافة ملاحظات
                        </DialogDescription>
                      </DialogHeader>

                      {selectedOrder && (
                        <div className="space-y-6">
                          {/* Current Status */}
                          <div>
                            <label className="text-sm font-medium">الحالة الحالية:</label>
                            <Badge className={`${getOrderStatusColor(selectedOrder.status)} mt-1`}>
                              {getOrderStatusText(selectedOrder.status)}
                            </Badge>
                          </div>

                          {/* Update Status */}
                          <div>
                            <label className="text-sm font-medium">تحديث الحالة:</label>
                            <Select value={updateStatus} onValueChange={setUpdateStatus}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="اختر الحالة الجديدة" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="staff_received">استلم الموظف الطلب</SelectItem>
                                <SelectItem value="printing">بدء الطباعة</SelectItem>
                                <SelectItem value="ready_pickup">جاهز للاستلام من الفرع</SelectItem>
                                <SelectItem value="ready_delivery">جاهز للتوصيل</SelectItem>
                                <SelectItem value="driver_assigned">تم إرساله للكابتن</SelectItem>
                                <SelectItem value="out_for_delivery">خرج للتوصيل</SelectItem>
                                <SelectItem value="delivered">تم التسليم</SelectItem>
                                <SelectItem value="cancelled">إلغاء الطلب</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Staff Notes */}
                          <div>
                            <label className="text-sm font-medium">ملاحظات الموظف:</label>
                            <Textarea
                              value={staffNotes}
                              onChange={(e) => setStaffNotes(e.target.value)}
                              placeholder="أضف أي ملاحظات مهمة هنا..."
                              className="mt-1"
                              rows={3}
                            />
                          </div>

                          {/* Order Timeline */}
                          <div>
                            <h4 className="text-sm font-medium mb-3">تاريخ الطلب:</h4>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {getOrderTimeline(selectedOrder).map((event, index) => (
                                <div key={index} className="flex items-start gap-3 text-sm">
                                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                                  <div>
                                    <p className="font-medium">{event.event}</p>
                                    <p className="text-muted-foreground text-xs">
                                      {event.timestamp.toLocaleString('ar-EG')}
                                    </p>
                                    {event.note && (
                                      <p className="text-xs text-blue-600 mt-1">{event.note}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                setSelectedOrder(null);
                                setUpdateStatus("");
                                setStaffNotes("");
                              }}
                            >
                              إلغاء
                            </Button>
                            <Button 
                              onClick={handleUpdateOrder}
                              disabled={!updateStatus || updateOrderMutation.isPending}
                            >
                              {updateOrderMutation.isPending ? "جاري التحديث..." : "حفظ التحديث"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          {/* Inventory Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">إجمالي المنتجات</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {inventoryStats?.totalProducts || 0}
                    </p>
                  </div>
                  <Package2 className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">متوفرة في المخزون</p>
                    <p className="text-2xl font-bold text-green-600">
                      {inventoryStats?.inStockProducts || 0}
                    </p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">مخزون منخفض</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {inventoryStats?.lowStockProducts || 0}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">نفد من المخزون</p>
                    <p className="text-2xl font-bold text-red-600">
                      {inventoryStats?.outOfStockProducts || 0}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="البحث في المنتجات..."
                value={inventorySearchTerm}
                onChange={(e) => setInventorySearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    إضافة منتج جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>إضافة منتج جديد</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="product-name">اسم المنتج</Label>
                      <Input
                        id="product-name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="اسم المنتج"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="product-category">الفئة</Label>
                      <Input
                        id="product-category"
                        value={newProduct.category}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="فئة المنتج"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="grid gap-2">
                        <Label htmlFor="product-stock">الكمية الحالية</Label>
                        <Input
                          id="product-stock"
                          type="number"
                          value={newProduct.currentStock}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, currentStock: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="product-min">الحد الأدنى</Label>
                        <Input
                          id="product-min"
                          type="number"
                          value={newProduct.minStockLevel}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, minStockLevel: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="product-price">السعر (جنيه)</Label>
                      <Input
                        id="product-price"
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={addProduct} disabled={!newProduct.name}>
                      إضافة المنتج
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" onClick={createSampleData}>
                <Plus className="w-4 h-4 mr-2" />
                بيانات تجريبية
              </Button>
              
              <Button variant="outline" onClick={() => refetchInventory()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                تحديث
              </Button>
            </div>
          </div>

          {/* Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>قائمة المنتجات ({filteredProducts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>اسم المنتج</TableHead>
                        <TableHead>الفئة</TableHead>
                        <TableHead>الكمية الحالية</TableHead>
                        <TableHead>الحد الأدنى</TableHead>
                        <TableHead>السعر</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={product.currentStock}
                              onChange={(e) => updateProductStock(product.id, parseInt(e.target.value) || 0)}
                              className="w-20"
                              min="0"
                            />
                          </TableCell>
                          <TableCell>{product.minStockLevel}</TableCell>
                          <TableCell>{product.price} جنيه</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                product.status === 'in_stock' ? 'default' :
                                product.status === 'low_stock' ? 'secondary' : 'destructive'
                              }
                            >
                              {product.status === 'in_stock' ? 'متوفر' :
                               product.status === 'low_stock' ? 'منخفض' : 'نفد'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => deleteProduct(product.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {inventorySearchTerm ? 'لا توجد منتجات تطابق البحث' : 'لا توجد منتجات بعد'}
                  </p>
                  {!inventorySearchTerm && (
                    <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      إضافة أول منتج
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Inventory Alerts */}
          {inventoryStats?.activeAlerts?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  تنبيهات المخزون ({inventoryStats.activeAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inventoryStats.activeAlerts.map((alert: any, index: number) => (
                    <div key={index} className="border border-orange-200 bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        <div>
                          <p className="font-semibold text-orange-800">تنبيه مخزون منخفض</p>
                          <p className="text-orange-600">المنتج: {alert.productId}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}