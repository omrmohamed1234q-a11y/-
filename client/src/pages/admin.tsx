import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import {
  Users, Package, ShoppingCart, Star, Settings, BarChart3, 
  TrendingUp, Gift, Trophy, LogOut, Shield
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();

  // Check localStorage for admin user if auth hook hasn't loaded yet
  const [localUser, setLocalUser] = useState(null);
  
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setLocalUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
      }
    }
  }, []);

  const currentUser = user || localUser;
  const isMainAdmin = currentUser?.email === 'printformead1@gmail.com';
  const isAdmin = currentUser?.role === 'admin' || isMainAdmin;
  
  // Show loading if still checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل لوحة الإدارة...</p>
        </div>
      </div>
    );
  }
  
  if (!currentUser || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-600">غير مخول</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              ليس لديك صلاحية للوصول إلى لوحة الإدارة
            </p>
            <Button onClick={() => window.location.href = '/auth/login'}>
              تسجيل الدخول كمدير
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل الخروج بنجاح"
      });
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
      
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "خطأ في تسجيل الخروج",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Shield className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">لوحة الإدارة</h1>
                <p className="text-gray-600">مرحباً {currentUser.fullName || currentUser.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                مدير عام
              </Badge>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center space-x-2 space-x-reverse"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
                  <p className="text-3xl font-bold text-gray-900">247</p>
                </div>
                <Users className="w-10 h-10 text-blue-600" />
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500 text-sm mr-1">+12%</span>
                <span className="text-gray-600 text-sm">من الشهر الماضي</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي المنتجات</p>
                  <p className="text-3xl font-bold text-gray-900">89</p>
                </div>
                <Package className="w-10 h-10 text-purple-600" />
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500 text-sm mr-1">+5</span>
                <span className="text-gray-600 text-sm">هذا الأسبوع</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي الطلبات</p>
                  <p className="text-3xl font-bold text-gray-900">1,234</p>
                </div>
                <ShoppingCart className="w-10 h-10 text-green-600" />
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-500 text-sm mr-1">+23%</span>
                <span className="text-gray-600 text-sm">من الشهر الماضي</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">نقاط المكافآت</p>
                  <p className="text-3xl font-bold text-gray-900">15,670</p>
                </div>
                <Star className="w-10 h-10 text-yellow-600" />
              </div>
              <div className="mt-4 flex items-center">
                <Gift className="w-4 h-4 text-blue-500" />
                <span className="text-blue-500 text-sm mr-1">تم توزيعها</span>
                <span className="text-gray-600 text-sm">هذا الشهر</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="users">المستخدمين</TabsTrigger>
            <TabsTrigger value="products">المنتجات</TabsTrigger>
            <TabsTrigger value="orders">الطلبات</TabsTrigger>
            <TabsTrigger value="rewards">المكافآت</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 space-x-reverse">
                    <BarChart3 className="w-5 h-5" />
                    <span>إحصائيات الأداء</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">معدل نمو المستخدمين</span>
                      <span className="font-semibold text-green-600">+12.5%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">معدل إتمام الطلبات</span>
                      <span className="font-semibold text-blue-600">94.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">متوسط قيمة الطلب</span>
                      <span className="font-semibold text-purple-600">45.30 ر.س</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">رضا العملاء</span>
                      <span className="font-semibold text-yellow-600">4.8/5</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 space-x-reverse">
                    <Trophy className="w-5 h-5" />
                    <span>أحدث الأنشطة</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">تم إنشاء منتج جديد: "دفتر ملاحظات A4"</span>
                    </div>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">طلب جديد من أحمد محمد - 75.50 ر.س</span>
                    </div>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">تم تفعيل حساب مستخدم جديد</span>
                    </div>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">تم توزيع 500 نقطة مكافأة</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إدارة المستخدمين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">إدارة المستخدمين</h3>
                  <p className="text-gray-600 mb-4">يمكنك هنا إدارة جميع المستخدمين المسجلين في النظام</p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    عرض جميع المستخدمين
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إدارة المنتجات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">إدارة المنتجات</h3>
                  <p className="text-gray-600 mb-4">إضافة وتعديل وحذف المنتجات في المتجر</p>
                  <Button className="bg-green-600 hover:bg-green-700">
                    إضافة منتج جديد
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إدارة الطلبات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">إدارة الطلبات</h3>
                  <p className="text-gray-600 mb-4">متابعة وإدارة جميع طلبات العملاء</p>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    عرض جميع الطلبات
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rewards" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إدارة المكافآت والنقاط</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">نظام المكافآت</h3>
                  <p className="text-gray-600 mb-4">إدارة نقاط المكافآت والتحديات للمستخدمين</p>
                  <Button className="bg-yellow-600 hover:bg-yellow-700">
                    إدارة المكافآت
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات النظام</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">إعدادات النظام</h3>
                  <p className="text-gray-600 mb-4">تخصيص إعدادات المنصة والتحكم في الميزات</p>
                  <Button className="bg-gray-600 hover:bg-gray-700">
                    فتح الإعدادات
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}