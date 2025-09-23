import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { InvoicePrintable } from '@/components/InvoicePrintable';
import { 
  Eye, 
  ExternalLink, 
  FileText, 
  Package,
  Printer,
  CheckCircle2,
  Clock,
  Truck,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  Download,
  Search,
  Filter,
  RefreshCw,
  ArrowUpDown,
  Users,
  TrendingUp,
  Activity,
  Receipt,
  Send,
  UserCheck,
  Timer
} from 'lucide-react';

interface PrintFile {
  filename: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  copies: number;
  paperSize: string;
  paperType: string;
  colorMode: string;
}

interface OrderItem {
  id: string;
  isPrintJob: boolean;
  printJobData?: PrintFile;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  status: string;
  statusText: string;
  createdAt: string;
  items: OrderItem[];
  printFiles?: PrintFile[];
}

export default function AdminOrders() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [invoicePrintOpen, setInvoicePrintOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب الطلبات من السيرفر
  const { data: allOrders = [], isLoading, error } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
    refetchInterval: 10000, // تحديث تلقائي كل 10 ثواني
    retry: 3
  });

  // فلترة وترتيب الطلبات
  const orders = allOrders
    .filter(order => {
      // فلترة حسب النص
      const matchesSearch = !searchTerm || 
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerPhone?.includes(searchTerm) ||
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // فلترة حسب الحالة
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'amount-high':
          return b.totalAmount - a.totalAmount;
        case 'amount-low':
          return a.totalAmount - b.totalAmount;
        case 'customer':
          return (a.customerName || '').localeCompare(b.customerName || '');
        default:
          return 0;
      }
    });

  // إشعار صوتي للطلبات الجديدة
  useEffect(() => {
    if (allOrders.length > lastOrderCount && lastOrderCount > 0) {
      // طلب جديد وصل!
      toast({
        title: '🔔 طلب جديد!',
        description: `تم استلام ${allOrders.length - lastOrderCount} طلب جديد`,
        duration: 5000
      });
      
      // صوت إشعار (متاح في المتصفحات الحديثة)
      if ('Audio' in window) {
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj');
          audio.play().catch(() => {}); // إذا فشل الصوت لا نعمل شيء
        } catch {}
      }
    }
    setLastOrderCount(allOrders.length);
  }, [allOrders.length, lastOrderCount, toast]);

  // حساب الإحصائيات المحسنة
  const stats = {
    total: allOrders.length,
    pending: allOrders.filter(o => o.status === 'pending').length,
    processing: allOrders.filter(o => o.status === 'processing').length,
    printing: allOrders.filter(o => o.status === 'printing').length,
    ready: allOrders.filter(o => o.status === 'ready').length,
    delivered: allOrders.filter(o => o.status === 'delivered').length,
    cancelled: allOrders.filter(o => o.status === 'cancelled').length,
    totalRevenue: allOrders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.totalAmount, 0),
    todayOrders: allOrders.filter(o => {
      const today = new Date().toDateString();
      return new Date(o.createdAt).toDateString() === today;
    }).length
  };

  // إرسال الطلب للسائقين
  const assignToCaptainsMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest('POST', `/api/admin/orders/${orderId}/assign-to-captains`, {});
      return response;
    },
    onSuccess: () => {
      toast({
        title: '🚛 تم الإرسال بنجاح',
        description: 'تم إرسال الطلب للكباتن المتاحين'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
    },
    onError: (error: any) => {
      toast({
        title: '❌ خطأ في الإرسال',
        description: 'فشل في إرسال الطلب للكباتن',
        variant: 'destructive'
      });
    }
  });

  // تحديث حالة الطلب
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/orders/${orderId}/status`, { status });
      return response;
    },
    onSuccess: (data) => {
      // تحديث البيانات المحلية فوراً
      queryClient.setQueryData(['/api/admin/orders'], (oldOrders: Order[] | undefined) => {
        if (!oldOrders) return oldOrders;
        return oldOrders.map(order => 
          order.id === selectedOrder?.id 
            ? { ...order, status: (data as any)?.status || selectedOrder?.status }
            : order
        );
      });
      
      // إعادة جلب البيانات للتأكد
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      setDetailsOpen(false);
      
      toast({
        title: '✅ تم التحديث بنجاح',
        description: 'تم تحديث حالة الطلب بنجاح'
      });
    },
    onError: (error: any) => {
      toast({
        title: '❌ خطأ في التحديث',
        description: 'فشل في تحديث حالة الطلب',
        variant: 'destructive'
      });
    }
  });

  // تعريف ألوان وأيقونات الحالات
  const statusConfig = {
    pending: { 
      bg: 'bg-yellow-100', 
      text: 'text-yellow-800', 
      icon: Clock,
      label: 'في الانتظار' 
    },
    processing: { 
      bg: 'bg-blue-100', 
      text: 'text-blue-800', 
      icon: Package,
      label: 'جاري المعالجة' 
    },
    printing: { 
      bg: 'bg-purple-100', 
      text: 'text-purple-800', 
      icon: Printer,
      label: 'جاري الطباعة' 
    },
    ready: { 
      bg: 'bg-green-100', 
      text: 'text-green-800', 
      icon: CheckCircle2,
      label: 'جاهز للاستلام' 
    },
    delivered: { 
      bg: 'bg-emerald-100', 
      text: 'text-emerald-800', 
      icon: CheckCircle2,
      label: 'تم التسليم' 
    },
    cancelled: { 
      bg: 'bg-red-100', 
      text: 'text-red-800', 
      icon: AlertCircle,
      label: 'ملغي' 
    }
  };

  // عرض شاشة التحميل
  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">إدارة الطلبات</h1>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // عرض رسالة الخطأ
  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">إدارة الطلبات</h1>
        <Card className="border-red-200">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-700 mb-2">خطأ في تحميل الطلبات</h3>
            <p className="text-red-600 mb-4">لم نتمكن من تحميل الطلبات. يرجى المحاولة مرة أخرى.</p>
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] })}
              variant="outline"
            >
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* رأس الصفحة مع الإحصائيات المتقدمة */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              📋 إدارة الطلبات المتقدمة
              <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-purple-50">
                {stats.total} طلب
              </Badge>
            </h1>
            <p className="text-gray-600 mt-2 flex items-center gap-4">
              <span>📅 طلبات اليوم: <span className="font-semibold text-blue-600">{stats.todayOrders}</span></span>
              <span>💰 إجمالي الإيرادات: <span className="font-semibold text-green-600">{stats.totalRevenue} جنيه</span></span>
            </p>
          </div>
          
          {/* أزرار التحكم السريع */}
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] })}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const csvContent = orders.map(order => 
                  `${order.orderNumber},${order.customerName},${order.customerPhone},${order.totalAmount},${order.status},${order.createdAt}`
                ).join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              تصدير
            </Button>
          </div>
        </div>

        {/* شريط البحث والفلاتر */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="البحث في الطلبات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <SelectValue placeholder="فلترة حسب الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="pending">في الانتظار</SelectItem>
              <SelectItem value="processing">جاري المعالجة</SelectItem>
              <SelectItem value="printing">جاري الطباعة</SelectItem>
              <SelectItem value="ready">جاهز للاستلام</SelectItem>
              <SelectItem value="delivered">تم التسليم</SelectItem>
              <SelectItem value="cancelled">ملغي</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" />
              <SelectValue placeholder="ترتيب حسب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">الأحدث أولاً</SelectItem>
              <SelectItem value="oldest">الأقدم أولاً</SelectItem>
              <SelectItem value="amount-high">المبلغ (من الأعلى)</SelectItem>
              <SelectItem value="amount-low">المبلغ (من الأقل)</SelectItem>
              <SelectItem value="customer">اسم العميل</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center justify-center bg-white rounded-md border px-3 py-2">
            <span className="text-sm text-gray-600 flex items-center gap-2">
              <Package className="w-4 h-4" />
              {orders.length} من {stats.total} طلب
            </span>
          </div>
        </div>

        {/* عدادات محسنة مع نسب مئوية */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = stats[status as keyof typeof stats] as number;
            const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            const Icon = config.icon;
            
            return (
              <Card 
                key={status} 
                className={`${config.bg} ${config.text} border-none shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer`}
                onClick={() => setStatusFilter(status)}
              >
                <CardContent className="p-4 text-center">
                  <Icon className="w-8 h-8 mx-auto mb-3" />
                  <div className="text-3xl font-bold mb-1">{count}</div>
                  <div className="text-sm font-medium mb-1">{config.label}</div>
                  <div className="text-xs opacity-75">{percentage}%</div>
                  <div className="mt-2 w-full bg-white/30 rounded-full h-1">
                    <div 
                      className="bg-current h-1 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* إحصائيات سريعة إضافية */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-500 text-white rounded-full">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-800">{stats.todayOrders}</div>
                <div className="text-sm text-blue-600">طلبات اليوم</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-green-500 text-white rounded-full">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-800">{stats.totalRevenue} جنيه</div>
                <div className="text-sm text-green-600">إجمالي الإيرادات</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-purple-500 text-white rounded-full">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-800">
                  {new Set(allOrders.map(o => o.customerName)).size}
                </div>
                <div className="text-sm text-purple-600">عملاء مختلفين</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* قائمة الطلبات */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">لا توجد طلبات حتى الآن</h3>
              <p className="text-gray-500">سيظهر هنا جميع الطلبات الواردة من العملاء</p>
            </CardContent>
          </Card>
        ) : (
          orders.map(order => {
            const statusStyle = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending;
            const StatusIcon = statusStyle.icon;
            
            // استخراج ملفات الطباعة من الطلب
            const printFiles = order.printFiles || [];
            
            return (
              <Card key={order.id} className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* رأس الطلب */}
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">
                          #{order.orderNumber || order.id}
                        </h3>
                        <Badge className={`${statusStyle.bg} ${statusStyle.text} hover:${statusStyle.bg} px-3 py-1`}>
                          <StatusIcon className="w-4 h-4 ml-2" />
                          {order.statusText || statusStyle.label}
                        </Badge>
                      </div>
                      
                      {/* معلومات العميل والطلب */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Phone className="w-5 h-5 text-gray-500" />
                            <div>
                              <span className="font-medium text-gray-900">{order.customerName || 'عميل غير محدد'}</span>
                              <div className="text-sm text-gray-600">{order.customerPhone || 'رقم غير متوفر'}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Calendar className="w-5 h-5 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString('ar-EG', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Package className="w-5 h-5 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              {printFiles.length} ملف للطباعة
                            </span>
                          </div>
                          
                          <div className="text-xl font-bold text-green-600">
                            {order.totalAmount} جنيه
                          </div>
                        </div>
                      </div>

                      {/* ملفات الطباعة مع روابط Google Drive */}
                      {printFiles.length > 0 && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                          <h4 className="font-medium mb-3 flex items-center gap-2 text-gray-900">
                            <FileText className="w-5 h-5" />
                            ملفات الطباعة ({printFiles.length})
                          </h4>
                          <div className="space-y-3">
                            {printFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-white rounded border shadow-sm">
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-900">{file?.filename || 'ملف غير محدد'}</div>
                                  <div className="text-xs text-gray-600 mt-1">
                                    {file?.copies || 1} نسخة • {file?.paperSize || 'A4'} • {file?.paperType || 'عادي'} • {file?.colorMode || 'أبيض وأسود'}
                                  </div>
                                </div>
                                {file?.fileUrl && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => window.open(file.fileUrl, '_blank')}
                                    className="flex items-center gap-2 ml-3"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    فتح في Google Drive
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* أزرار التحكم */}
                    <div className="flex flex-col gap-2 ml-6">
                      {/* زر إرسال للكباتن */}
                      {(order.status === 'ready' || order.status === 'processing' || order.status === 'printing') && (
                        <Button 
                          size="sm"
                          onClick={() => assignToCaptainsMutation.mutate(order.id)}
                          disabled={assignToCaptainsMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                        >
                          {assignToCaptainsMutation.isPending ? (
                            <Clock className="w-4 h-4 animate-spin" />
                          ) : (
                            <Truck className="w-4 h-4" />
                          )}
                          إرسال للكباتن
                        </Button>
                      )}

                      {/* زر فتح Google Drive */}
                      {printFiles.length > 0 && (
                        <Button 
                          size="sm"
                          onClick={() => {
                            // فتح كل الملفات في تابات منفصلة
                            printFiles.forEach(file => {
                              if (file.fileUrl) {
                                window.open(file.fileUrl, '_blank');
                              }
                            });
                          }}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <ExternalLink className="w-4 h-4" />
                          فتح Google Drive ({printFiles.length})
                        </Button>
                      )}

                      {/* زر طباعة الفاتورة */}
                      <Dialog open={invoicePrintOpen && selectedOrder?.id === order.id} onOpenChange={setInvoicePrintOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Receipt className="w-4 h-4" />
                            طباعة الفاتورة
                          </Button>
                        </DialogTrigger>
                        
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-xl">
                              فاتورة الطلب #{selectedOrder?.orderNumber}
                            </DialogTitle>
                          </DialogHeader>
                          
                          {selectedOrder && (
                            <InvoicePrintable order={selectedOrder} />
                          )}
                        </DialogContent>
                      </Dialog>

                      <Dialog open={detailsOpen && selectedOrder?.id === order.id} onOpenChange={setDetailsOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            تفاصيل وتحديث
                          </Button>
                        </DialogTrigger>
                        
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-xl">
                              تفاصيل الطلب #{selectedOrder?.orderNumber || selectedOrder?.id}
                            </DialogTitle>
                          </DialogHeader>
                          
                          {selectedOrder && (
                            <div className="space-y-6">
                              {/* معلومات العميل */}
                              <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                  <h3 className="font-semibold text-lg border-b pb-2">معلومات العميل</h3>
                                  <div className="space-y-2">
                                    <div><span className="font-medium">الاسم:</span> {selectedOrder.customerName}</div>
                                    <div><span className="font-medium">الهاتف:</span> {selectedOrder.customerPhone}</div>
                                  </div>
                                </div>
                                
                                <div className="space-y-3">
                                  <h3 className="font-semibold text-lg border-b pb-2">تفاصيل الطلب</h3>
                                  <div className="space-y-2">
                                    <div><span className="font-medium">المبلغ:</span> {selectedOrder.totalAmount} جنيه</div>
                                    <div><span className="font-medium">التاريخ:</span> {new Date(selectedOrder.createdAt).toLocaleDateString('ar-EG')}</div>
                                    <div><span className="font-medium">عدد الملفات:</span> {printFiles.length} ملف</div>
                                  </div>
                                </div>
                              </div>

                              {/* تحديث الحالة - حسب الأدوار */}
                              <div className="space-y-3">
                                <h3 className="font-semibold text-lg border-b pb-2 flex items-center gap-2">
                                  🎯 تحديث حالة الطلب (الأدمن فقط)
                                </h3>
                                <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                                  <p className="text-sm text-blue-800 mb-3">
                                    <strong>الأدمن يتحكم في:</strong> مراجعة، تجهيز، إلغاء
                                    <br />
                                    <strong>الكابتن يتحكم في:</strong> بدء التوصيل
                                  </p>
                                </div>
                                <Select 
                                  value={selectedOrder.status} 
                                  onValueChange={(status) => {
                                    updateStatusMutation.mutate({ 
                                      orderId: selectedOrder.id, 
                                      status 
                                    });
                                  }}
                                  disabled={updateStatusMutation.isPending}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="reviewing">
                                      🔍 مراجعة - جاري مراجعة تفاصيل الطلب
                                    </SelectItem>
                                    <SelectItem value="preparing">
                                      🖨️ تجهيز - جاري تجهيز وطباعة المستندات
                                    </SelectItem>
                                    <SelectItem value="cancelled">
                                      ❌ ملغي - تم إلغاء الطلب
                                    </SelectItem>
                                    {/* حالات أخرى للعرض فقط */}
                                    {selectedOrder.status === 'out_for_delivery' && (
                                      <SelectItem value="out_for_delivery" disabled>
                                        🚚 جاري التوصيل (يتحكم فيها الكابتن)
                                      </SelectItem>
                                    )}
                                    {selectedOrder.status === 'delivered' && (
                                      <SelectItem value="delivered" disabled>
                                        ✅ تم التسليم (مكتمل)
                                      </SelectItem>
                                    )}
                                  </SelectContent>
                                </Select>
                                
                                {updateStatusMutation.isPending && (
                                  <div className="flex items-center gap-2 text-blue-600">
                                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-sm">جاري التحديث...</p>
                                  </div>
                                )}
                                
                                {/* رسالة نجاح التحديث */}
                                <div className="text-sm text-green-600 bg-green-50 p-2 rounded border-l-4 border-green-400">
                                  <strong>ملاحظة:</strong> التحديثات ستظهر فوراً في صفحة الطلبات للعميل (/orders)
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}