import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
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
  Download
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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // جلب الطلبات من السيرفر
  const { data: orders = [], isLoading, error } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
    refetchInterval: 30000, // تحديث تلقائي كل 30 ثانية
    retry: 3
  });

  // تحديث حالة الطلب
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/orders/${orderId}/status`, { status });
      return response;
    },
    onSuccess: () => {
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
      {/* رأس الصفحة مع الإحصائيات */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة الطلبات</h1>
            <p className="text-gray-600 mt-2">
              إجمالي الطلبات: <span className="font-semibold">{orders.length}</span>
            </p>
          </div>
        </div>

        {/* عدادات سريعة للحالات */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = orders.filter(order => order.status === status).length;
            const Icon = config.icon;
            
            return (
              <div 
                key={status} 
                className={`${config.bg} ${config.text} p-4 rounded-lg text-center shadow-sm`}
              >
                <Icon className="w-6 h-6 mx-auto mb-2" />
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm">{config.label}</div>
              </div>
            );
          })}
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
            
            // استخراج ملفات الطباعة من العناصر
            const printFiles = order.items
              ?.filter(item => item.isPrintJob && item.printJobData)
              .map(item => item.printJobData) || [];
            
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

                              {/* تحديث الحالة */}
                              <div className="space-y-3">
                                <h3 className="font-semibold text-lg border-b pb-2">تحديث حالة الطلب</h3>
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
                                    <SelectItem value="pending">في انتظار المراجعة</SelectItem>
                                    <SelectItem value="processing">جاري المعالجة</SelectItem>
                                    <SelectItem value="printing">جاري الطباعة</SelectItem>
                                    <SelectItem value="ready">جاهز للاستلام</SelectItem>
                                    <SelectItem value="delivered">تم التسليم</SelectItem>
                                    <SelectItem value="cancelled">تم الإلغاء</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                {updateStatusMutation.isPending && (
                                  <p className="text-sm text-blue-600">جاري التحديث...</p>
                                )}
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