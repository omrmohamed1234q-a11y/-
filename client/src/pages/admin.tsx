import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Users, Package, ShoppingCart, Star, Settings, BarChart3, 
  TrendingUp, Gift, Trophy, LogOut, Shield, Plus, Edit, Trash2, 
  Eye, Save, X, BookOpen, GraduationCap, FileText, Calendar
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Fetch admin data
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/stats']
  });

  const { data: products } = useQuery({
    queryKey: ['/api/admin/products']
  });

  const { data: orders } = useQuery({
    queryKey: ['/api/admin/orders']
  });

  const { data: teacherPlans } = useQuery({
    queryKey: ['/api/admin/teacher-plans']
  });

  const { data: teacherSubscriptions } = useQuery({
    queryKey: ['/api/admin/teacher-subscriptions']
  });

  // Fetch admin settings for UI configuration
  const { data: adminSettings } = useQuery({
    queryKey: ['/api/admin/settings']
  });

  // Fetch uploaded files
  const { data: adminFiles } = useQuery({
    queryKey: ['/api/admin/files']
  });

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
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="ui-config">واجهة التطبيق</TabsTrigger>
            <TabsTrigger value="files">إدارة الملفات</TabsTrigger>
            <TabsTrigger value="orders">تتبع الطلبات</TabsTrigger>
            <TabsTrigger value="users">المستخدمين</TabsTrigger>
            <TabsTrigger value="products">المنتجات</TabsTrigger>
            <TabsTrigger value="teachers">المعلمين</TabsTrigger>
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
            <UsersManagement />
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <ProductsManagement />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <OrdersManagement />
          </TabsContent>

          <TabsContent value="teachers" className="space-y-6">
            <TeachersManagement />
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

  // Products Management Component
  function ProductsManagement() {
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [newProduct, setNewProduct] = useState({
      name: '', nameEn: '', description: '', descriptionEn: '', 
      price: '', category: '', imageUrl: '', stock: '0', isDigital: false
    });

    const addProductMutation = useMutation({
      mutationFn: (product: any) => apiRequest('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify(product)
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
        setNewProduct({
          name: '', nameEn: '', description: '', descriptionEn: '', 
          price: '', category: '', imageUrl: '', stock: '0', isDigital: false
        });
        toast({ title: "تم إضافة المنتج بنجاح" });
      }
    });

    const updateProductMutation = useMutation({
      mutationFn: (product: any) => apiRequest(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify(product)
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
        setEditingProduct(null);
        toast({ title: "تم تحديث المنتج بنجاح" });
      }
    });

    const deleteProductMutation = useMutation({
      mutationFn: (id: string) => apiRequest(`/api/admin/products/${id}`, {
        method: 'DELETE'
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
        toast({ title: "تم حذف المنتج بنجاح" });
      }
    });

    return (
      <div className="space-y-6">
        {/* Add New Product */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Plus className="w-5 h-5" />
              <span>إضافة منتج جديد</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>اسم المنتج (عربي)</Label>
                <Input
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="اسم المنتج بالعربية"
                  data-testid="input-product-name"
                />
              </div>
              <div>
                <Label>اسم المنتج (إنجليزي)</Label>
                <Input
                  value={newProduct.nameEn}
                  onChange={(e) => setNewProduct({...newProduct, nameEn: e.target.value})}
                  placeholder="Product Name in English"
                  data-testid="input-product-name-en"
                />
              </div>
              <div>
                <Label>السعر</Label>
                <Input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  placeholder="0.00"
                  data-testid="input-product-price"
                />
              </div>
              <div>
                <Label>الفئة</Label>
                <Select onValueChange={(value) => setNewProduct({...newProduct, category: value})}>
                  <SelectTrigger data-testid="select-product-category">
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="books">كتب</SelectItem>
                    <SelectItem value="stationery">قرطاسية</SelectItem>
                    <SelectItem value="electronics">إلكترونيات</SelectItem>
                    <SelectItem value="educational">تعليمية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>الوصف (عربي)</Label>
                <Textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="وصف المنتج بالعربية"
                  data-testid="input-product-description"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button 
                onClick={() => addProductMutation.mutate(newProduct)}
                disabled={addProductMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-add-product"
              >
                <Plus className="w-4 h-4 mr-2" />
                إضافة المنتج
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة المنتجات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products?.map((product: any) => (
                <Card key={product.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <Badge variant="secondary">{product.category}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                    <p className="text-lg font-bold text-green-600 mb-3">{product.price} ر.س</p>
                    <div className="flex space-x-2 space-x-reverse">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingProduct(product)}
                        data-testid={`button-edit-product-${product.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteProductMutation.mutate(product.id)}
                        data-testid={`button-delete-product-${product.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Orders Management Component
  function OrdersManagement() {
    const updateOrderMutation = useMutation({
      mutationFn: ({ orderId, status }: { orderId: string; status: string }) => 
        apiRequest(`/api/admin/orders/${orderId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status })
        }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
        toast({ title: "تم تحديث حالة الطلب بنجاح" });
      }
    });

    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    const statusLabels = {
      pending: 'في الانتظار',
      confirmed: 'مؤكد',
      shipped: 'تم الشحن',
      delivered: 'تم التسليم',
      cancelled: 'ملغي'
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <ShoppingCart className="w-5 h-5" />
            <span>إدارة الطلبات</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders?.map((order: any) => (
              <Card key={order.id} className="border">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">طلب #{order.id.slice(-8)}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                      {statusLabels[order.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label className="text-sm text-gray-600">إجمالي المبلغ</Label>
                      <p className="font-semibold">{order.totalAmount} ر.س</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">عدد المنتجات</Label>
                      <p className="font-semibold">{order.items?.length || 0}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">طريقة الدفع</Label>
                      <p className="font-semibold">{order.paymentMethod || 'غير محدد'}</p>
                    </div>
                  </div>

                  <div className="flex space-x-2 space-x-reverse">
                    <Select onValueChange={(status) => updateOrderMutation.mutate({ orderId: order.id, status })}>
                      <SelectTrigger className="w-48" data-testid={`select-order-status-${order.id}`}>
                        <SelectValue placeholder="تحديث الحالة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">في الانتظار</SelectItem>
                        <SelectItem value="confirmed">مؤكد</SelectItem>
                        <SelectItem value="shipped">تم الشحن</SelectItem>
                        <SelectItem value="delivered">تم التسليم</SelectItem>
                        <SelectItem value="cancelled">ملغي</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid={`button-view-order-${order.id}`}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      عرض التفاصيل
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Teachers Management Component
  function TeachersManagement() {
    const [newPlan, setNewPlan] = useState({
      name: '', nameEn: '', description: '', descriptionEn: '', 
      price: '', duration: '30', maxStudents: '30', maxMaterials: '100'
    });

    const addPlanMutation = useMutation({
      mutationFn: (plan: any) => apiRequest('/api/admin/teacher-plans', {
        method: 'POST',
        body: JSON.stringify(plan)
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/teacher-plans'] });
        setNewPlan({
          name: '', nameEn: '', description: '', descriptionEn: '', 
          price: '', duration: '30', maxStudents: '30', maxMaterials: '100'
        });
        toast({ title: "تم إضافة خطة المعلم بنجاح" });
      }
    });

    return (
      <div className="space-y-6">
        {/* Add Teacher Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <GraduationCap className="w-5 h-5" />
              <span>إضافة خطة اشتراك للمعلمين</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>اسم الخطة (عربي)</Label>
                <Input
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                  placeholder="خطة المعلم الأساسية"
                  data-testid="input-plan-name"
                />
              </div>
              <div>
                <Label>اسم الخطة (إنجليزي)</Label>
                <Input
                  value={newPlan.nameEn}
                  onChange={(e) => setNewPlan({...newPlan, nameEn: e.target.value})}
                  placeholder="Basic Teacher Plan"
                  data-testid="input-plan-name-en"
                />
              </div>
              <div>
                <Label>السعر الشهري</Label>
                <Input
                  type="number"
                  value={newPlan.price}
                  onChange={(e) => setNewPlan({...newPlan, price: e.target.value})}
                  placeholder="99.00"
                  data-testid="input-plan-price"
                />
              </div>
              <div>
                <Label>مدة الاشتراك (أيام)</Label>
                <Input
                  type="number"
                  value={newPlan.duration}
                  onChange={(e) => setNewPlan({...newPlan, duration: e.target.value})}
                  placeholder="30"
                  data-testid="input-plan-duration"
                />
              </div>
              <div className="md:col-span-2">
                <Label>وصف الخطة</Label>
                <Textarea
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                  placeholder="وصف مميزات الخطة"
                  data-testid="input-plan-description"
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button 
                onClick={() => addPlanMutation.mutate(newPlan)}
                disabled={addPlanMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-add-plan"
              >
                <Plus className="w-4 h-4 mr-2" />
                إضافة الخطة
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Teacher Plans List */}
        <Card>
          <CardHeader>
            <CardTitle>خطط اشتراك المعلمين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teacherPlans?.map((plan: any) => (
                <Card key={plan.id} className="border">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{plan.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm">السعر:</span>
                        <span className="font-semibold">{plan.price} ر.س</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">أقصى عدد طلاب:</span>
                        <span className="font-semibold">{plan.maxStudents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">أقصى عدد مواد:</span>
                        <span className="font-semibold">{plan.maxMaterials}</span>
                      </div>
                    </div>
                    <Badge variant={plan.active ? "default" : "secondary"}>
                      {plan.active ? 'نشطة' : 'غير نشطة'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Teacher Subscriptions */}
        <Card>
          <CardHeader>
            <CardTitle>اشتراكات المعلمين النشطة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teacherSubscriptions?.map((subscription: any) => (
                <Card key={subscription.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{subscription.teacherName}</h3>
                        <p className="text-sm text-gray-600">{subscription.planName}</p>
                        <p className="text-xs text-gray-500">
                          ينتهي في: {new Date(subscription.endDate).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                        {subscription.status === 'active' ? 'نشط' : subscription.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Users Management Component
  function UsersManagement() {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Users className="w-5 h-5" />
            <span>إدارة المستخدمين</span>
          </CardTitle>
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
    );
  }
}