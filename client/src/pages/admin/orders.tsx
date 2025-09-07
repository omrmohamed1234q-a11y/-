import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Order } from '@shared/schema';
import { InvoicePrintable } from '@/components/InvoicePrintable';
import {
  Search,
  Filter,
  Eye,
  Edit,
  Truck,
  Package,
  CheckCircle2,
  X,
  Phone,
  MapPin,
  FileText,
  Download,
  Printer,
  Image,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';

interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export default function AdminOrders() {
  const [filters, setFilters] = useState<OrderFilters>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [invoicePrintOpen, setInvoicePrintOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ['/api/admin/orders', filters]
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, updates }: { orderId: string; updates: Partial<Order> }) => {
      await apiRequest('PATCH', `/api/admin/orders/${orderId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث الطلب بنجاح'
      });
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث الطلب',
        variant: 'destructive'
      });
    }
  });

  const statusColors = {
    pending: 'bg-yellow-500',
    processing: 'bg-blue-500',
    printing: 'bg-purple-500',
    out_for_delivery: 'bg-orange-500',
    delivered: 'bg-green-500',
    cancelled: 'bg-red-500'
  };

  const statusLabels = {
    pending: 'في الانتظار',
    processing: 'قيد المعالجة',
    printing: 'قيد الطباعة',
    out_for_delivery: 'في الطريق للتسليم',
    delivered: 'تم التسليم',
    cancelled: 'ملغي'
  };

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    updateOrderMutation.mutate({
      orderId,
      updates: { 
        status: newStatus,
        timeline: [
          ...(selectedOrder?.timeline as any[] || []),
          {
            event: newStatus,
            timestamp: new Date().toISOString(),
            note: `تم تحديث الحالة إلى ${statusLabels[newStatus as keyof typeof statusLabels]}`
          }
        ]
      }
    });
  };

  const handleCourierAssignment = (orderId: string, courierName: string, courierPhone: string, trackingNumber: string) => {
    updateOrderMutation.mutate({
      orderId,
      updates: {
        deliveryNotes: `مندوب: ${courierName} - ${courierPhone} - رقم التتبع: ${trackingNumber}`,
        status: 'out_for_delivery',
        trackingUrl: `https://track.example.com/${trackingNumber}`,
        timeline: [
          ...(selectedOrder?.timeline as any[] || []),
          {
            event: 'courier_assigned',
            timestamp: new Date().toISOString(),
            note: `تم تعيين المندوب: ${courierName} - ${courierPhone}`
          }
        ]
      }
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">إدارة الطلبات</h1>
        <Badge variant="outline">{orders?.length || 0} طلب</Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Filter className="w-5 h-5" />
            <span>تصفية الطلبات</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث برقم الطلب أو اسم العميل..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pr-10"
              />
            </div>
            
            <Select value={filters.status || ''} onValueChange={(value) => setFilters({ ...filters, status: value || undefined })}>
              <SelectTrigger>
                <SelectValue placeholder="حالة الطلب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">جميع الحالات</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.paymentStatus || ''} onValueChange={(value) => setFilters({ ...filters, paymentStatus: value || undefined })}>
              <SelectTrigger>
                <SelectValue placeholder="حالة الدفع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">جميع حالات الدفع</SelectItem>
                <SelectItem value="pending">في الانتظار</SelectItem>
                <SelectItem value="paid">مدفوع</SelectItem>
                <SelectItem value="failed">فشل</SelectItem>
                <SelectItem value="refunded">مسترد</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex space-x-2 space-x-reverse">
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                placeholder="من تاريخ"
              />
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                placeholder="إلى تاريخ"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-right">
                  <th className="p-4 font-medium">رقم الطلب</th>
                  <th className="p-4 font-medium">العميل</th>
                  <th className="p-4 font-medium">المبلغ</th>
                  <th className="p-4 font-medium">الحالة</th>
                  <th className="p-4 font-medium">الدفع</th>
                  <th className="p-4 font-medium">المنتجات المطلوبة</th>
                  <th className="p-4 font-medium">التاريخ</th>
                  <th className="p-4 font-medium">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {orders?.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-mono text-sm">#{order.id.slice(-8)}</td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium">عميل #{order.userId.slice(-6)}</div>
                        <div className="text-sm text-muted-foreground">
                          {(order.shippingAddress as any)?.name || 'غير محدد'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold arabic-nums">{order.totalAmount} جنيه</span>
                    </td>
                    <td className="p-4">
                      <Badge 
                        variant="outline" 
                        className={`${statusColors[order.status as keyof typeof statusColors]} text-white border-0`}
                      >
                        {statusLabels[order.status as keyof typeof statusLabels]}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                        {order.paymentStatus === 'paid' ? 'مدفوع' : 'في الانتظار'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {/* عرض جميع المنتجات في الطلب */}
                      <div className="space-y-2 max-w-sm">
                        {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                          <>
                            {order.items.map((item: any, index: number) => (
                              <div key={`${order.id}-item-${index}`} className="text-sm">
                                {/* إذا كان منتج طباعة - التحقق من كل الاحتمالات */}
                                {(item.productId === 'print-service' || item.filename || item.fileUrl || item.printJob) ? (
                                  <div className="border border-blue-200 rounded-lg p-2 bg-blue-50">
                                    <div className="flex items-start space-x-2 space-x-reverse">
                                      <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-blue-900 text-xs truncate">
                                          📄 {item.printJob?.originalFilename || item.filename || 'ملف للطباعة'}
                                        </div>
                                        <div className="text-xs text-blue-700 mt-1">
                                          {item.printJob?.settings || `عدد ${item.copies || 1} - ${item.paperSize || 'A4'} ${item.paperType || 'ورق عادي'} ${item.colorMode === 'color' ? 'ملون' : 'أبيض وأسود'}` || 'إعدادات الطباعة'}
                                        </div>
                                        {/* رابط Google Drive أو Cloudinary */}
                                        {(item.printJob?.googleDriveLink || item.googleDriveLink || item.fileUrl) && (
                                          <a
                                            href={item.printJob?.googleDriveLink || item.googleDriveLink || item.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center text-green-600 hover:text-green-800 text-xs mt-1 px-2 py-1 bg-green-100 rounded"
                                            title="فتح الملف"
                                          >
                                            <ExternalLink className="w-3 h-3 ml-1" />
                                            {item.fileUrl?.includes('drive.google.com') ? '📁 Google Drive' : '☁️ تحميل الملف'}
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  /* منتج عادي من المتجر */
                                  <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                      <div className="w-4 h-4 bg-gray-400 rounded flex-shrink-0"></div>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 text-xs truncate">
                                          {item.name || item.productName || `منتج #${item.productId}`}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          الكمية: {item.quantity || 1}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs">لا توجد منتجات</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-EG') : 'غير محدد'}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex space-x-1 space-x-reverse">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedOrder(order);
                              setDetailsOpen(true);
                            }}
                            title="عرض التفاصيل"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedOrder(order);
                              setInvoicePrintOpen(true);
                            }}
                            className="text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50 font-medium"
                            title="طباعة الفاتورة مع شعار اطبعلي"
                          >
                            <Printer className="w-4 h-4 ml-1" />
                            <span className="text-xs">فاتورة</span>
                          </Button>
                        </div>
                        
                        <Select
                          value={order.status}
                          onValueChange={(newStatus) => handleStatusUpdate(order.id, newStatus)}
                        >
                          <SelectTrigger className="w-full text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب #{selectedOrder?.id.slice(-8)}</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">معلومات الطلب</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>رقم الطلب:</span>
                      <span className="font-mono">#{selectedOrder.id.slice(-8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>المبلغ الإجمالي:</span>
                      <span className="font-bold arabic-nums">{selectedOrder.totalAmount} جنيه</span>
                    </div>
                    <div className="flex justify-between">
                      <span>نقاط المكافآت المستخدمة:</span>
                      <span className="arabic-nums">{selectedOrder.pointsUsed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>طريقة الدفع:</span>
                      <span>{selectedOrder.paymentMethod || 'غير محدد'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">عنوان التسليم</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedOrder.shippingAddress ? (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <MapPin className="w-4 h-4" />
                          <span>{(selectedOrder.shippingAddress as any).address}</span>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Phone className="w-4 h-4" />
                          <span>{(selectedOrder.shippingAddress as any).phone}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">لا يوجد عنوان تسليم</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Delivery Info */}
              {selectedOrder.deliveryNotes && selectedOrder.deliveryNotes.includes('مندوب:') && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">معلومات التسليم</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>اسم المندوب</Label>
                      <div className="font-medium">{selectedOrder.deliveryNotes?.split(' - ')[0]?.replace('مندوب: ', '') || 'غير محدد'}</div>
                    </div>
                    <div>
                      <Label>رقم الهاتف</Label>
                      <div className="font-medium">{selectedOrder.deliveryNotes?.split(' - ')[1] || 'غير محدد'}</div>
                    </div>
                    <div>
                      <Label>رقم التتبع</Label>
                      <div className="font-mono text-sm">{selectedOrder.deliveryNotes?.split('رقم التتبع: ')[1] || 'غير محدد'}</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Courier Assignment Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">تعيين مندوب التسليم</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    handleCourierAssignment(
                      selectedOrder.id,
                      formData.get('courierName') as string,
                      formData.get('courierPhone') as string,
                      formData.get('trackingNumber') as string
                    );
                  }} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="courierName">اسم المندوب</Label>
                      <Input name="courierName" defaultValue={selectedOrder.deliveryNotes?.split(' - ')[0]?.replace('مندوب: ', '') || ''} />
                    </div>
                    <div>
                      <Label htmlFor="courierPhone">رقم الهاتف</Label>
                      <Input name="courierPhone" defaultValue={selectedOrder.deliveryNotes?.split(' - ')[1] || ''} />
                    </div>
                    <div>
                      <Label htmlFor="trackingNumber">رقم التتبع</Label>
                      <Input name="trackingNumber" defaultValue={selectedOrder.deliveryNotes?.split('رقم التتبع: ')[1] || ''} />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" className="w-full">
                        <Truck className="w-4 h-4 ml-2" />
                        حفظ
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Order Items & Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2 space-x-reverse">
                    <ShoppingBag className="w-5 h-5" />
                    <span>المنتجات والملفات المرفوعة</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedOrder.items && Array.isArray(selectedOrder.items) ? 
                      selectedOrder.items.map((item: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-lg">{item.name || `منتج ${index + 1}`}</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">الكمية:</span>
                                  <span className="font-medium arabic-nums mr-2">{item.quantity || 1}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">السعر:</span>
                                  <span className="font-medium arabic-nums mr-2">{item.price || 0} جنيه</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">الإجمالي:</span>
                                  <span className="font-bold arabic-nums mr-2">
                                    {((item.price || 0) * (item.quantity || 1))} جنيه
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">النوع:</span>
                                  <span className="mr-2">{item.productType || 'منتج'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Uploaded Files Section */}
                          {item.uploadedFiles && item.uploadedFiles.length > 0 && (
                            <div className="border-t pt-3 mt-3">
                              <h5 className="font-medium mb-2 flex items-center space-x-2 space-x-reverse">
                                <FileText className="w-4 h-4" />
                                <span>الملفات المرفوعة ({item.uploadedFiles.length})</span>
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {item.uploadedFiles.map((file: any, fileIndex: number) => (
                                  <div key={fileIndex} className="border rounded-lg p-3 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2 space-x-reverse flex-1 min-w-0">
                                        {file.type?.startsWith('image/') ? (
                                          <Image className="w-4 h-4 text-blue-500" />
                                        ) : (
                                          <FileText className="w-4 h-4 text-green-500" />
                                        )}
                                        <span className="text-sm truncate" title={file.name}>
                                          {file.name || `ملف ${fileIndex + 1}`}
                                        </span>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => file.url && window.open(file.url, '_blank')}
                                        disabled={!file.url}
                                      >
                                        <Download className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {file.size ? `${Math.round(file.size / 1024)} كيلوبايت` : 'حجم غير معروف'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Product Details */}
                          {(item.description || item.specifications) && (
                            <div className="border-t pt-3 mt-3">
                              <h5 className="font-medium mb-2">تفاصيل المنتج</h5>
                              {item.description && (
                                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                              )}
                              {item.specifications && (
                                <div className="text-xs text-muted-foreground">
                                  <strong>المواصفات:</strong> {item.specifications}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>لا توجد معلومات المنتجات متاحة لهذا الطلب</p>
                        </div>
                      )
                    }
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">إجراءات الفاتورة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-3 space-x-reverse">
                    <Button 
                      onClick={() => setInvoicePrintOpen(true)}
                      className="flex items-center space-x-2 space-x-reverse"
                    >
                      <Printer className="w-4 h-4" />
                      <span>طباعة الفاتورة</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        // TODO: Implement PDF download
                        toast({
                          title: 'قريباً',
                          description: 'سيتم إضافة وظيفة تحميل الفاتورة PDF قريباً'
                        });
                      }}
                      className="flex items-center space-x-2 space-x-reverse"
                    >
                      <Download className="w-4 h-4" />
                      <span>تحميل PDF</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">تتبع الطلب</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(Array.isArray(selectedOrder.timeline) ? selectedOrder.timeline : []).map((event: any, index: number) => (
                      <div key={index} className="flex items-start space-x-3 space-x-reverse">
                        <div className="w-3 h-3 rounded-full bg-primary mt-2"></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{event.note}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(event.timestamp).toLocaleString('ar-EG')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {(!selectedOrder.timeline || !Array.isArray(selectedOrder.timeline) || selectedOrder.timeline.length === 0) && (
                      <p className="text-center text-muted-foreground">لا توجد أحداث في التتبع</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Order Items with Print Jobs */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2 space-x-reverse">
                    <FileText className="w-5 h-5" />
                    <span>عناصر الطلب والملفات المرفقة</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(selectedOrder.items as any[] || []).map((item, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium">منتج #{item.productId?.slice(-6) || 'غير محدد'}</h4>
                            <div className="flex space-x-4 space-x-reverse text-sm text-muted-foreground mt-1">
                              <span>الكمية: {item.quantity}</span>
                              <span>النوع: {item.productType || 'عادي'}</span>
                            </div>
                          </div>
                          <div className="text-left">
                            <div className="font-bold arabic-nums">{item.price} جنيه</div>
                          </div>
                        </div>

                        {/* Print Job Files */}
                        {item.printJob?.files && item.printJob.files.length > 0 && (
                          <div className="border-t pt-3 mt-3">
                            <h5 className="font-medium mb-2 flex items-center space-x-2 space-x-reverse text-sm">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span>الملفات المرفقة للطباعة ({item.printJob.files.length})</span>
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {item.printJob.files.map((file: any, fileIndex: number) => (
                                <div key={fileIndex} className="border rounded-lg p-3 bg-blue-50">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 space-x-reverse flex-1 min-w-0">
                                      <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                      <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium text-blue-900 truncate" title={file.displayName}>
                                          {file.displayName || `ملف ${fileIndex + 1}`}
                                        </div>
                                        <div className="text-xs text-blue-700 mt-1">
                                          {item.printJob?.settings || 'إعدادات الطباعة'}
                                        </div>
                                      </div>
                                    </div>
                                    {file.googleDriveLink && (
                                      <a
                                        href={file.googleDriveLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-green-600 hover:text-green-800 flex items-center px-2 py-1 bg-green-100 rounded text-xs flex-shrink-0"
                                        title="فتح في Google Drive"
                                      >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        عرض
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Additional Files (if any) */}
                        {item.googleDriveLink && !item.printJob?.files && (
                          <div className="border-t pt-3 mt-3">
                            <h5 className="font-medium mb-2 text-sm">ملف إضافي:</h5>
                            <a
                              href={item.googleDriveLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-2 bg-green-100 text-green-800 rounded text-sm hover:bg-green-200"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              فتح الملف في Google Drive
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Print Modal */}
      {invoicePrintOpen && selectedOrder && (
        <InvoicePrintable
          order={selectedOrder}
          onClose={() => setInvoicePrintOpen(false)}
        />
      )}
    </div>
  );
}