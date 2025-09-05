import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  MoreVertical,
  Smartphone,
  Shield,
  Settings,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

interface AdminStats {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  avgBasket: number;
  conversionRate: number;
  onTimeDeliveryRate: number;
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  ordersByStatus: {
    pending: number;
    processing: number;
    printing: number;
    out_for_delivery: number;
    delivered: number;
    cancelled: number;
  };
  voucherUsage: {
    totalVouchers: number;
    usedVouchers: number;
    totalDiscount: number;
  };
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/dashboard/stats']
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

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

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">لوحة تحكم الإدارة</h1>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            آخر تحديث: {new Date().toLocaleDateString('ar-EG')}
          </Badge>
          
          {/* Three dots dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={() => window.location.href = '/admin/two-factor-settings'}
                className="cursor-pointer"
              >
                <Smartphone className="mr-2 h-4 w-4" />
                المصادقة الثنائية
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => window.location.href = '/admin/security-dashboard'}
                className="cursor-pointer"
              >
                <Shield className="mr-2 h-4 w-4" />
                لوحة الأمان
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => window.location.href = '/admin/settings'}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                الإعدادات
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الطلبات اليوم</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold arabic-nums">{stats?.todayOrders || 0}</div>
            <p className="text-xs text-muted-foreground">
              من إجمالي {stats?.totalOrders || 0} طلب
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold arabic-nums">{stats?.totalRevenue || 0} جنيه</div>
            <p className="text-xs text-muted-foreground">
              متوسط السلة: {stats?.avgBasket || 0} جنيه
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل التحويل</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold arabic-nums">{stats?.conversionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              من إجمالي الزوار
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">التسليم في الوقت</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold arabic-nums">{stats?.onTimeDeliveryRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              خلال آخر 30 يوم
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="orders">حالة الطلبات</TabsTrigger>
          <TabsTrigger value="products">المنتجات الأعلى مبيعاً</TabsTrigger>
          <TabsTrigger value="vouchers">استخدام الكوبونات</TabsTrigger>
          <TabsTrigger value="analytics">التحليلات</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>توزيع الطلبات حسب الحالة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(statusLabels).map(([status, label]) => (
                  <div key={status} className="flex items-center space-x-3 space-x-reverse">
                    <div className={`w-3 h-3 rounded-full ${statusColors[status as keyof typeof statusColors]}`}></div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{label}</span>
                        <span className="text-sm font-bold arabic-nums">
                          {stats?.ordersByStatus?.[status as keyof typeof stats.ordersByStatus] || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>المنتجات الأعلى مبيعاً</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.topProducts?.map((product, index) => (
                  <div key={product.id} className="flex items-center space-x-4 space-x-reverse">
                    <Badge variant="outline" className="arabic-nums">#{index + 1}</Badge>
                    <div className="flex-1">
                      <h4 className="font-medium">{product.name}</h4>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span className="arabic-nums">{product.sales} مبيعة</span>
                        <span className="arabic-nums">{product.revenue} جنيه</span>
                      </div>
                    </div>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground">لا توجد بيانات متاحة</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vouchers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>إحصائيات الكوبونات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold arabic-nums">{stats?.voucherUsage?.totalVouchers || 0}</div>
                  <p className="text-sm text-muted-foreground">إجمالي الكوبونات</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold arabic-nums">{stats?.voucherUsage?.usedVouchers || 0}</div>
                  <p className="text-sm text-muted-foreground">الكوبونات المستخدمة</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold arabic-nums">{stats?.voucherUsage?.totalDiscount || 0} جنيه</div>
                  <p className="text-sm text-muted-foreground">إجمالي الخصومات</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <BarChart3 className="w-5 h-5" />
                  <span>أداء التحويل</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>الزوار</span>
                    <span className="arabic-nums">1,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span>العربات المضافة</span>
                    <span className="arabic-nums">567</span>
                  </div>
                  <div className="flex justify-between">
                    <span>الطلبات المكتملة</span>
                    <span className="arabic-nums">{stats?.todayOrders || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 space-x-reverse">
                  <Star className="w-5 h-5" />
                  <span>متوسط التقييمات</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold arabic-nums">4.8</div>
                  <div className="flex justify-center mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    من 1,234 تقييم
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}