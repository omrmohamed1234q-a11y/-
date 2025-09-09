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
  Eye, Download, Calendar, BookOpen, GraduationCap, Store, X, Tag, HardDrive
} from 'lucide-react';
import { Link } from 'wouter';
import AdminActionsMenu from '@/components/admin/AdminActionsMenu';
import AdminAnalytics from '@/pages/admin/analytics';
import ProductForm from '@/components/admin/ProductForm';

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
    mutationFn: (productData: any) => {
      console.log('🚀 Making API request with data:', productData);
      return apiRequest('POST', '/api/admin/products', productData);
    },
    onSuccess: (response) => {
      console.log('✅ Product creation successful:', response);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({ title: "تم إضافة المنتج بنجاح" });
      setShowProductForm(false);
    },
    onError: (error) => {
      console.error('❌ Product creation failed:', error);
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
    totalUsers: (stats as any)?.totalUsers || 0,
    totalOrders: (stats as any)?.totalOrders || 0,
    totalPrintJobs: (stats as any)?.totalPrintJobs || 0,
    totalRevenue: (stats as any)?.totalRevenue || 0,
    ...(stats as any)
  };

  // Handle viewing file
  const handleViewFile = (job: any) => {
    if (job.fileUrl) {
      // Check if it's a base64 data URL or Firebase URL
      if (job.fileUrl.startsWith('data:')) {
        // Create blob URL for base64 data
        const byteCharacters = atob(job.fileUrl.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } else {
        // Direct URL
        window.open(job.fileUrl, '_blank');
      }
    } else {
      toast({
        title: "خطأ",
        description: "رابط الملف غير متوفر",
        variant: "destructive",
      });
    }
  };

  // Handle downloading file
  const handleDownloadFile = (job: any) => {
    if (job.fileUrl) {
      if (job.fileUrl.startsWith('data:')) {
        // Create download link for base64 data
        const byteCharacters = atob(job.fileUrl.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = job.filename || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      } else {
        // Direct download
        const link = document.createElement('a');
        link.href = job.fileUrl;
        link.download = job.filename || 'document.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      toast({
        title: "نجح التحميل",
        description: `تم تحميل الملف: ${job.filename}`,
      });
    } else {
      toast({
        title: "خطأ",
        description: "رابط الملف غير متوفر",
        variant: "destructive",
      });
    }
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
              <Link href="/">
                <Button variant="outline" size="sm">
                  <Home className="w-4 h-4 mr-2" />
                  الرئيسية
                </Button>
              </Link>
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
        {/* Admin Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">التنقل السريع</h2>
              <Badge className="bg-blue-100 text-blue-800">الإدارة</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg h-20 flex flex-col items-center justify-center space-y-2">
                <Home className="w-6 h-6 text-blue-600" />
                <span className="text-xs text-blue-800 font-medium">الرئيسية</span>
              </div>
              
              <Link href="/admin-products">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-green-50">
                  <Package className="w-6 h-6 text-green-600" />
                  <span className="text-xs">المنتجات</span>
                </Button>
              </Link>

              <Link href="/admin/inventory">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-yellow-50">
                  <Package className="w-6 h-6 text-yellow-600" />
                  <span className="text-xs">المخزون</span>
                </Button>
              </Link>
              
              <Link href="/admin/store">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-green-50">
                  <Store className="w-6 h-6 text-green-600" />
                  <span className="text-xs">المتجر</span>
                </Button>
              </Link>
              
              <Link href="/admin/teachers-corner">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  <span className="text-xs">ركن المعلم</span>
                </Button>
              </Link>
              
              <Link href="/admin/users">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50">
                  <Users className="w-6 h-6 text-purple-600" />
                  <span className="text-xs">المستخدمين</span>
                </Button>
              </Link>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-orange-50">
                <BarChart3 className="w-6 h-6 text-orange-600" />
                <span className="text-xs">التقارير</span>
              </Button>
              
              <Link href="/admin/coupons">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-yellow-50">
                  <Tag className="w-6 h-6 text-yellow-600" />
                  <span className="text-xs">القسائم</span>
                </Button>
              </Link>
              
              <Link href="/admin/inquiries">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-indigo-50">
                  <FileText className="w-6 h-6 text-indigo-600" />
                  <span className="text-xs">الاستعلامات</span>
                </Button>
              </Link>
              
              <Link href="/admin/storage-dashboard">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-emerald-50">
                  <HardDrive className="w-6 h-6 text-emerald-600" />
                  <span className="text-xs">إدارة المساحة</span>
                </Button>
              </Link>
              
              <Link href="/admin/security-dashboard">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-red-50">
                  <Shield className="w-6 h-6 text-red-600" />
                  <span className="text-xs">لوحة الأمان</span>
                </Button>
              </Link>
              
              <Link href="/admin/two-factor-settings">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50">
                  <Smartphone className="w-6 h-6 text-blue-600" />
                  <span className="text-xs">المصادقة النائية</span>
                </Button>
              </Link>
              
              <Link href="/admin/settings">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-gray-50">
                  <Settings className="w-6 h-6 text-gray-600" />
                  <span className="text-xs">الإعدادات</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
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
                  <div className="text-2xl font-bold">{safeStats.totalRevenue} جنيه</div>
                  <p className="text-xs text-muted-foreground">
                    +{Math.floor(safeStats.totalRevenue * 0.12)} من الشهر الماضي
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Access Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Link href="/admin/store">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-6 text-center">
                    <Store className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-lg font-semibold text-blue-900">إدارة المتجر</div>
                    <div className="text-sm text-blue-600">عرض وإدارة منتجات المتجر</div>
                  </CardContent>
                </Card>
              </Link>
              
              <Card 
                className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-green-50 to-green-100 border-green-200"
                onClick={() => setActiveTab('products')}
              >
                <CardContent className="p-6 text-center">
                  <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-lg font-semibold text-green-900">إدارة المنتجات</div>
                  <div className="text-sm text-green-600">إضافة وتعديل المنتجات</div>
                </CardContent>
              </Card>
              
              <Card 
                className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200"
                onClick={() => setActiveTab('orders')}
              >
                <CardContent className="p-6 text-center">
                  <ShoppingCart className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-lg font-semibold text-orange-900">إدارة الطلبات</div>
                  <div className="text-sm text-orange-600">متابعة وإدارة الطلبات</div>
                </CardContent>
              </Card>
              
              <Card 
                className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
                onClick={() => setActiveTab('analytics')}
              >
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-lg font-semibold text-purple-900">التحليلات</div>
                  <div className="text-sm text-purple-600">تقارير وإحصائيات مفصلة</div>
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
              {(products as any[]).map((product: any) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <Badge variant="secondary">{product.category}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-600">{product.price} جنيه</span>
                      <AdminActionsMenu
                        itemId={product.id}
                        itemType="product"
                        onEdit={() => setEditingProduct(product)}
                        onDelete={() => deleteProductMutation.mutate(product.id)}
                        showView={false}
                        showDuplicate={false}
                      />
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
                      {(orders as any[]).map((order: any) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">#{order.id}</td>
                          <td className="px-4 py-3 text-sm">{order.customerName}</td>
                          <td className="px-4 py-3 text-sm">{order.total} جنيه</td>
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
              {(printJobs as any[]).map((job: any) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-right">مهمة #{job.id.slice(0, 8)}</h3>
                      <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                        {job.status === 'completed' ? 'مكتملة' : 
                         job.status === 'pending' ? 'في الانتظار' :
                         job.status === 'printing' ? 'جاري الطباعة' :
                         job.status === 'failed' ? 'فشل' : 'قيد التنفيذ'}
                      </Badge>
                    </div>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-800 font-medium text-right">{job.filename}</p>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>{job.pages} صفحة</span>
                        <span>{job.copies} نسخة</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>{job.colorMode === 'color' ? 'ملون' : 'أبيض وأسود'}</span>
                        <span>{job.paperSize}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">{job.doubleSided ? 'وجهين' : 'وجه واحد'}</span>
                        <span className="font-bold text-green-600">{job.cost} جنيه</span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleViewFile(job)}
                        data-testid={`button-view-${job.id}`}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        عرض الملف
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleDownloadFile(job)}
                        data-testid={`button-download-${job.id}`}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        تحميل
                      </Button>
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

        {/* Product Form Dialog */}
        {showProductForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">إضافة منتج جديد</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowProductForm(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <ProductForm
                onSubmit={(data) => {
                  console.log('🔄 Admin page received form data:', data);
                  createProductMutation.mutate(data);
                }}
                isLoading={createProductMutation.isPending}
              />
            </div>
          </div>
        )}

        {/* Edit Product Dialog */}
        {editingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">تعديل المنتج</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setEditingProduct(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <ProductForm
                initialData={editingProduct}
                onSubmit={(data) => {
                  // Update product logic here
                  console.log('Update product:', data);
                  setEditingProduct(null);
                }}
                isLoading={false}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}