import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  BarChart3, Users, Package, Printer, ShoppingCart, TrendingUp,
  Plus, Edit, Trash2, FileText, Settings, Home, LogOut,
  Eye, Calendar, BookOpen, GraduationCap
} from 'lucide-react';
import AdminAnalytics from '@/pages/admin/analytics';

export default function AdminDashboard() {
  // All hooks must be at the top level
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image: ''
  });

  // Queries with enabled conditions
  const { data: stats = {}, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/stats'],
    enabled: !!user && !loading
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/admin/products'],
    enabled: !!user && !loading
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/admin/orders'],
    enabled: !!user && !loading
  });

  const { data: printJobs = [], isLoading: printJobsLoading } = useQuery({
    queryKey: ['/api/admin/print-jobs'],
    enabled: !!user && !loading
  });

  // Mutations
  const createProductMutation = useMutation({
    mutationFn: (productData: any) => apiRequest('POST', '/api/admin/products', productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({ title: "تم إضافة المنتج بنجاح" });
      setNewProduct({ name: '', description: '', price: '', category: '', stock: '', image: '' });
      setShowProductForm(false);
    },
    onError: () => {
      toast({ title: "خطأ في إضافة المنتج", variant: "destructive" });
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({ title: "تم حذف المنتج بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ في حذف المنتج", variant: "destructive" });
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      apiRequest('PUT', `/api/admin/orders/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({ title: "تم تحديث الطلب بنجاح" });
    }
  });

  // Event handlers
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/';
  };

  const addProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      toast({ title: "يرجى ملء الحقول المطلوبة", variant: "destructive" });
      return;
    }
    createProductMutation.mutate(newProduct);
  };

  // Conditional rendering based on auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">
              دخول لوحة الإدارة
            </CardTitle>
            <p className="text-gray-600">يجب تسجيل الدخول أولاً للوصول إلى لوحة الإدارة</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => window.location.href = '/auth/login'}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              تسجيل الدخول
            </Button>
            <Button 
              onClick={() => window.location.href = '/'}
              variant="outline"
              className="w-full"
            >
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Safe default values for stats
  const safeStats = {
    totalUsers: stats?.totalUsers || 0,
    totalOrders: stats?.totalOrders || 0,
    totalPrintJobs: stats?.totalPrintJobs || 0,
    totalRevenue: stats?.totalRevenue || 0,
    ...stats
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-red-600 mr-4">📄 اطبعلي</div>
              <div className="text-sm text-gray-500">لوحة الإدارة</div>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="text-sm text-gray-600">
                مرحباً، {user.fullName || user.username || 'مدير النظام'}
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2 space-x-reverse">
              <BarChart3 className="w-4 h-4" />
              <span>لوحة التحكم</span>
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center space-x-2 space-x-reverse">
              <Package className="w-4 h-4" />
              <span>المنتجات</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center space-x-2 space-x-reverse">
              <ShoppingCart className="w-4 h-4" />
              <span>الطلبات</span>
            </TabsTrigger>
            <TabsTrigger value="print-jobs" className="flex items-center space-x-2 space-x-reverse">
              <Printer className="w-4 h-4" />
              <span>مهام الطباعة</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2 space-x-reverse">
              <Users className="w-4 h-4" />
              <span>المستخدمون</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2 space-x-reverse">
              <TrendingUp className="w-4 h-4" />
              <span>التحليلات</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{safeStats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    +{Math.floor(safeStats.totalUsers * 0.1)} من الشهر الماضي
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{safeStats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    +{Math.floor(safeStats.totalOrders * 0.15)} من الشهر الماضي
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">مهام الطباعة</CardTitle>
                  <Printer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{safeStats.totalPrintJobs}</div>
                  <p className="text-xs text-muted-foreground">
                    +{Math.floor(safeStats.totalPrintJobs * 0.08)} من الشهر الماضي
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{safeStats.totalRevenue} ر.س</div>
                  <p className="text-xs text-muted-foreground">
                    +{Math.floor(safeStats.totalRevenue * 0.12)} من الشهر الماضي
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>النشاط الأخير</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">طلب جديد #1234</p>
                      <p className="text-xs text-gray-500">منذ 5 دقائق</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">مستخدم جديد سجل</p>
                      <p className="text-xs text-gray-500">منذ 10 دقائق</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">مهمة طباعة اكتملت</p>
                      <p className="text-xs text-gray-500">منذ 15 دقيقة</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">إدارة المنتجات</h2>
              <Button onClick={() => setShowProductForm(!showProductForm)}>
                <Plus className="w-4 h-4 mr-2" />
                إضافة منتج جديد
              </Button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product: any) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <Badge variant="secondary">{product.category}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-600">{product.price} ر.س</span>
                      <div className="flex space-x-2 space-x-reverse">
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => deleteProductMutation.mutate(product.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <h2 className="text-2xl font-bold">إدارة الطلبات</h2>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">رقم الطلب</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">العميل</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">المبلغ</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">الحالة</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {orders.map((order: any) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">#{order.id}</td>
                          <td className="px-4 py-3 text-sm">{order.customerName}</td>
                          <td className="px-4 py-3 text-sm">{order.total} ر.س</td>
                          <td className="px-4 py-3">
                            <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                              {order.status === 'completed' ? 'مكتمل' : 'قيد التنفيذ'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Print Jobs Tab */}
          <TabsContent value="print-jobs" className="space-y-6">
            <h2 className="text-2xl font-bold">مهام الطباعة</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {printJobs.map((job: any) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">مهمة #{job.id}</h3>
                      <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                        {job.status === 'completed' ? 'مكتملة' : 'قيد التنفيذ'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{job.fileName}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">{job.pages} صفحة</span>
                      <span className="font-bold">{job.cost} ر.س</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <h2 className="text-2xl font-bold">إدارة المستخدمين</h2>
            <Card>
              <CardContent>
                <p className="text-center text-gray-500 py-8">سيتم إضافة إدارة المستخدمين قريباً</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}