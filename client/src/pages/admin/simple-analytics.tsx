import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Activity, ShoppingCart, Users, DollarSign, Printer, Package } from 'lucide-react';

export default function SimpleAnalytics() {
  return (
    <div className="container mx-auto p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin">
          <Button variant="outline" size="sm" className="flex items-center gap-2" data-testid="button-back-admin">
            <ArrowLeft className="w-4 h-4" />
            العودة للوحة التحكم
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">📊 تحليلات الأداء</h1>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-blue-600">156</p>
                <p className="text-xs text-green-600">+12% من الشهر الماضي</p>
              </div>
              <ShoppingCart className="h-12 w-12 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي المستخدمين</p>
                <p className="text-2xl font-bold text-green-600">89</p>
                <p className="text-xs text-green-600">+8% من الشهر الماضي</p>
              </div>
              <Users className="h-12 w-12 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</p>
                <p className="text-2xl font-bold text-yellow-600">12,450 جنيه</p>
                <p className="text-xs text-green-600">+15% من الشهر الماضي</p>
              </div>
              <DollarSign className="h-12 w-12 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">مهام الطباعة</p>
                <p className="text-2xl font-bold text-purple-600">234</p>
                <p className="text-xs text-green-600">+5% من الشهر الماضي</p>
              </div>
              <Printer className="h-12 w-12 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">المنتجات النشطة</p>
                <p className="text-2xl font-bold text-indigo-600">67</p>
                <p className="text-xs text-green-600">+3% من الشهر الماضي</p>
              </div>
              <Package className="h-12 w-12 text-indigo-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">متوسط قيمة الطلب</p>
                <p className="text-2xl font-bold text-red-600">79.8 جنيه</p>
                <p className="text-xs text-green-600">+2% من الشهر الماضي</p>
              </div>
              <Activity className="h-12 w-12 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>أداء الطلبات الشهرية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">يناير</span>
                <span className="font-semibold">42 طلب</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">فبراير</span>
                <span className="font-semibold">38 طلب</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">مارس</span>
                <span className="font-semibold">52 طلب</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">أبريل</span>
                <span className="font-semibold text-green-600">76 طلب</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>أكثر المنتجات مبيعاً</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">كتاب الرياضيات</span>
                <span className="font-semibold">28 مبيعة</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">مذكرة العلوم</span>
                <span className="font-semibold">22 مبيعة</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">كراسة التمارين</span>
                <span className="font-semibold">19 مبيعة</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">ملخص التاريخ</span>
                <span className="font-semibold">15 مبيعة</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>حالة الطلبات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">مكتملة</span>
                <span className="font-semibold text-green-600">124 طلب</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">قيد التنفيذ</span>
                <span className="font-semibold text-yellow-600">18 طلب</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">في الانتظار</span>
                <span className="font-semibold text-blue-600">14 طلب</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">ملغاة</span>
                <span className="font-semibold text-red-600">8 طلبات</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>نمو المستخدمين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">مستخدمين جدد هذا الشهر</span>
                <span className="font-semibold text-green-600">23</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">مستخدمين نشطين</span>
                <span className="font-semibold text-blue-600">67</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">معدل العودة</span>
                <span className="font-semibold">78%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">تقييم رضا العملاء</span>
                <span className="font-semibold text-yellow-600">4.2/5</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}