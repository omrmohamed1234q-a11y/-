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
        courierName,
        courierPhone,
        trackingNumber,
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
                    <td className="p-4 text-sm">
                      {new Date(order.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2 space-x-reverse">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrder(order);
                            setDetailsOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 ml-1" />
                          عرض
                        </Button>
                        
                        <Select
                          value={order.status}
                          onValueChange={(newStatus) => handleStatusUpdate(order.id, newStatus)}
                        >
                          <SelectTrigger className="w-32">
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
              {selectedOrder.courierName && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">معلومات التسليم</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>اسم المندوب</Label>
                      <div className="font-medium">{selectedOrder.courierName}</div>
                    </div>
                    <div>
                      <Label>رقم الهاتف</Label>
                      <div className="font-medium">{selectedOrder.courierPhone}</div>
                    </div>
                    <div>
                      <Label>رقم التتبع</Label>
                      <div className="font-mono text-sm">{selectedOrder.trackingNumber}</div>
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
                      <Input name="courierName" defaultValue={selectedOrder.courierName || ''} />
                    </div>
                    <div>
                      <Label htmlFor="courierPhone">رقم الهاتف</Label>
                      <Input name="courierPhone" defaultValue={selectedOrder.courierPhone || ''} />
                    </div>
                    <div>
                      <Label htmlFor="trackingNumber">رقم التتبع</Label>
                      <Input name="trackingNumber" defaultValue={selectedOrder.trackingNumber || ''} />
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

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">تتبع الطلب</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(selectedOrder.timeline as any[] || []).map((event, index) => (
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
                    
                    {(!selectedOrder.timeline || selectedOrder.timeline.length === 0) && (
                      <p className="text-center text-muted-foreground">لا توجد أحداث في التتبع</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">عناصر الطلب</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(selectedOrder.items as any[] || []).map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <h4 className="font-medium">منتج #{item.productId?.slice(-6) || 'غير محدد'}</h4>
                          <p className="text-sm text-muted-foreground">الكمية: {item.quantity}</p>
                        </div>
                        <div className="text-left">
                          <div className="font-bold arabic-nums">{item.price} جنيه</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}