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
  Calendar
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

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  status: string;
  statusText: string;
  createdAt: string;
  items: any[];
  printFiles: PrintFile[];
}

export default function AdminOrders() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // استعلام الطلبات
  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders'],
    refetchInterval: 30000 // تحديث كل 30 ثانية
  });

  // تحديث حالة الطلب
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      return await apiRequest('PATCH', `/api/admin/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      setDetailsOpen(false);
      toast({
        title: '✅ تم التحديث',
        description: 'تم تحديث حالة الطلب بنجاح'
      });
    },
    onError: () => {
      toast({
        title: '❌ خطأ',
        description: 'فشل في تحديث حالة الطلب',
        variant: 'destructive'
      });
    }
  });

  // ألوان الحالات
  const statusStyles = {
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
    processing: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Package },
    printing: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Printer },
    ready: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle2 },
    delivered: { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: CheckCircle2 },
    cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: CheckCircle2 }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* العنوان والإحصائيات */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة الطلبات</h1>
          <p className="text-gray-600 mt-1">
            إجمالي الطلبات: {orders?.length || 0}
          </p>
        </div>
        
        <div className="flex gap-4">
          {Object.entries(statusStyles).map(([status, style]) => {
            const count = orders?.filter(order => order.status === status).length || 0;
            const Icon = style.icon;
            return (
              <div key={status} className={`${style.bg} ${style.text} px-3 py-2 rounded-lg flex items-center gap-2`}>
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* قائمة الطلبات */}
      <div className="space-y-4">
        {orders?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">لا توجد طلبات حتى الآن</h3>
              <p className="text-gray-500">سيظهر هنا جميع الطلبات الواردة من العملاء</p>
            </CardContent>
          </Card>
        ) : (
          orders?.map(order => {
            const statusStyle = statusStyles[order.status as keyof typeof statusStyles] || statusStyles.pending;
            const StatusIcon = statusStyle.icon;
            
            return (
              <Card key={order.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold">#{order.orderNumber}</h3>
                        <Badge className={`${statusStyle.bg} ${statusStyle.text} hover:${statusStyle.bg}`}>
                          <StatusIcon className="w-3 h-3 ml-1" />
                          {order.statusText}
                        </Badge>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{order.customerName}</span>
                            <span className="text-gray-600">{order.customerPhone}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">
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
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-600">
                              {order.printFiles?.length || 0} ملف للطباعة
                            </span>
                          </div>
                          <div className="text-lg font-bold text-green-600">
                            {order.totalAmount} جنيه
                          </div>
                        </div>
                      </div>

                      {/* ملفات الطباعة مع روابط Google Drive */}
                      {order.printFiles && order.printFiles.length > 0 && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            ملفات الطباعة
                          </h4>
                          <div className="space-y-2">
                            {order.printFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{file.filename}</div>
                                  <div className="text-xs text-gray-600">
                                    {file.copies} نسخة • {file.paperSize} • {file.paperType} • {file.colorMode}
                                  </div>
                                </div>
                                {file.fileUrl && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => window.open(file.fileUrl, '_blank')}
                                    className="flex items-center gap-1"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    عرض
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Dialog open={detailsOpen && selectedOrder?.id === order.id} onOpenChange={setDetailsOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="w-4 h-4 ml-1" />
                            تفاصيل
                          </Button>
                        </DialogTrigger>
                        
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>تفاصيل الطلب #{selectedOrder?.orderNumber}</DialogTitle>
                          </DialogHeader>
                          
                          {selectedOrder && (
                            <div className="space-y-6">
                              {/* معلومات العميل */}
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <h3 className="font-semibold mb-2">معلومات العميل</h3>
                                  <div className="space-y-1 text-sm">
                                    <div><span className="font-medium">الاسم:</span> {selectedOrder.customerName}</div>
                                    <div><span className="font-medium">الهاتف:</span> {selectedOrder.customerPhone}</div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h3 className="font-semibold mb-2">تفاصيل الطلب</h3>
                                  <div className="space-y-1 text-sm">
                                    <div><span className="font-medium">المبلغ:</span> {selectedOrder.totalAmount} جنيه</div>
                                    <div><span className="font-medium">التاريخ:</span> {new Date(selectedOrder.createdAt).toLocaleDateString('ar-EG')}</div>
                                  </div>
                                </div>
                              </div>

                              {/* تحديث الحالة */}
                              <div>
                                <h3 className="font-semibold mb-2">تحديث حالة الطلب</h3>
                                <Select 
                                  value={selectedOrder.status} 
                                  onValueChange={(status) => updateStatusMutation.mutate({ orderId: selectedOrder.id, status })}
                                >
                                  <SelectTrigger>
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