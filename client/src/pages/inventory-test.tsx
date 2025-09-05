import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  BarChart3,
  Package2,
  CheckCircle,
  AlertCircle,
  History,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Search,
  Download
} from 'lucide-react';

interface InventoryStats {
  totalProducts: number;
  inStockProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalStockValue: number;
  averageStockLevel: number;
  topSellingProducts: Array<{
    id: string;
    name: string;
    totalSold: number;
    currentStock: number;
  }>;
  recentMovements: any[];
  activeAlerts: any[];
}

interface Product {
  id: string;
  name: string;
  currentStock: number;
  minStockLevel: number;
  price: number;
  category: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export default function InventoryTest() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    currentStock: 0,
    minStockLevel: 10,
    price: 0,
    category: ''
  });

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/inventory/dashboard');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      } else {
        throw new Error('Failed to load inventory data');
      }
    } catch (err) {
      console.error('Error fetching inventory data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createSampleData = async () => {
    try {
      const response = await fetch('/api/inventory/create-sample-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        await fetchInventoryData();
        await fetchProducts();
        alert('تم إنشاء البيانات التجريبية بنجاح!');
      }
    } catch (err) {
      alert('فشل في إنشاء البيانات التجريبية');
    }
  };

  const fetchProducts = async () => {
    try {
      // محاكاة بيانات المنتجات - ستتصل بـ API حقيقي لاحقاً
      const mockProducts: Product[] = [
        {
          id: 'print-service',
          name: 'خدمة الطباعة',
          currentStock: 80,
          minStockLevel: 20,
          price: 25,
          category: 'خدمات',
          status: 'in_stock'
        },
        {
          id: 'scan-service',
          name: 'خدمة المسح الضوئي',
          currentStock: 5,
          minStockLevel: 10,
          price: 15,
          category: 'خدمات',
          status: 'low_stock'
        },
        {
          id: 'book-math-grade-1',
          name: 'كتاب الرياضيات - الصف الأول',
          currentStock: 0,
          minStockLevel: 5,
          price: 45,
          category: 'كتب',
          status: 'out_of_stock'
        },
        {
          id: 'book-science-grade-2',
          name: 'كتاب العلوم - الصف الثاني',
          currentStock: 25,
          minStockLevel: 10,
          price: 50,
          category: 'كتب',
          status: 'in_stock'
        }
      ];
      setProducts(mockProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const addProduct = async () => {
    try {
      const productId = `product-${Date.now()}`;
      const product: Product = {
        id: productId,
        ...newProduct,
        status: newProduct.currentStock > newProduct.minStockLevel ? 'in_stock' : 
               newProduct.currentStock > 0 ? 'low_stock' : 'out_of_stock'
      };
      
      setProducts(prev => [...prev, product]);
      setNewProduct({ name: '', currentStock: 0, minStockLevel: 10, price: 0, category: '' });
      setShowAddDialog(false);
      alert('تم إضافة المنتج بنجاح!');
    } catch (err) {
      alert('فشل في إضافة المنتج');
    }
  };

  const updateProductStock = async (productId: string, newStock: number) => {
    try {
      setProducts(prev => prev.map(product => {
        if (product.id === productId) {
          const status = newStock > product.minStockLevel ? 'in_stock' : 
                        newStock > 0 ? 'low_stock' : 'out_of_stock';
          return { ...product, currentStock: newStock, status };
        }
        return product;
      }));
      await fetchInventoryData(); // تحديث الإحصائيات
    } catch (err) {
      alert('فشل في تحديث المخزون');
    }
  };

  const deleteProduct = async (productId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        setProducts(prev => prev.filter(product => product.id !== productId));
        await fetchInventoryData(); // تحديث الإحصائيات
        alert('تم حذف المنتج بنجاح!');
      } catch (err) {
        alert('فشل في حذف المنتج');
      }
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchInventoryData();
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800">خطأ في تحميل البيانات</h3>
                  <p className="text-red-600">{error}</p>
                  <Button 
                    onClick={fetchInventoryData} 
                    variant="outline" 
                    className="mt-3"
                    size="sm"
                  >
                    إعادة المحاولة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة المخزون</h1>
            <p className="text-gray-600 mt-1">تتبع وإدارة مستويات المخزون والتنبيهات</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={createSampleData} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              إنشاء بيانات تجريبية
            </Button>
            <Button onClick={fetchInventoryData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              تحديث
            </Button>
          </div>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              لوحة التحكم
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              إدارة المخزون
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              التنبيهات ({stats?.activeAlerts?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="movements" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              تحركات المخزون
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">إجمالي المنتجات</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats?.totalProducts || 0}
                      </p>
                    </div>
                    <Package2 className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">متوفرة في المخزون</p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats?.inStockProducts || 0}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">مخزون منخفض</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {stats?.lowStockProducts || 0}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">نفد من المخزون</p>
                      <p className="text-2xl font-bold text-red-600">
                        {stats?.outOfStockProducts || 0}
                      </p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Selling Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  أكثر المنتجات مبيعاً
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.topSellingProducts?.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">#{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-600">ID: {product.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">{product.totalSold} مبيع</p>
                        <Badge variant={product.currentStock > 0 ? "default" : "destructive"}>
                          متوفر: {product.currentStock}
                        </Badge>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      لا توجد بيانات مبيعات متاحة
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>إحصائيات سريعة</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">إجمالي قيمة المخزون</span>
                      <span className="font-semibold">{stats?.totalStockValue || 0} جنيه</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">متوسط مستوى المخزون</span>
                      <span className="font-semibold">{stats?.averageStockLevel || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">التنبيهات النشطة</span>
                      <span className="font-semibold text-orange-600">{stats?.activeAlerts?.length || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>حالة المخزون</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-green-600">● متوفر</span>
                      <span className="font-semibold">{stats?.inStockProducts || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-orange-600">● منخفض</span>
                      <span className="font-semibold">{stats?.lowStockProducts || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-red-600">● نفد</span>
                      <span className="font-semibold">{stats?.outOfStockProducts || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stock" className="space-y-6">
            {/* Search and Add Product */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="البحث في المنتجات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      إضافة منتج جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>إضافة منتج جديد</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="product-name">اسم المنتج</Label>
                        <Input
                          id="product-name"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="اسم المنتج"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="product-category">الفئة</Label>
                        <Input
                          id="product-category"
                          value={newProduct.category}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                          placeholder="فئة المنتج"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="grid gap-2">
                          <Label htmlFor="product-stock">الكمية الحالية</Label>
                          <Input
                            id="product-stock"
                            type="number"
                            value={newProduct.currentStock}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, currentStock: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="product-min">الحد الأدنى</Label>
                          <Input
                            id="product-min"
                            type="number"
                            value={newProduct.minStockLevel}
                            onChange={(e) => setNewProduct(prev => ({ ...prev, minStockLevel: parseInt(e.target.value) || 0 }))}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="product-price">السعر (جنيه)</Label>
                        <Input
                          id="product-price"
                          type="number"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        إلغاء
                      </Button>
                      <Button onClick={addProduct} disabled={!newProduct.name}>
                        إضافة المنتج
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  تصدير
                </Button>
              </div>
            </div>

            {/* Products Table */}
            <Card>
              <CardHeader>
                <CardTitle>قائمة المنتجات ({filteredProducts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredProducts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>اسم المنتج</TableHead>
                          <TableHead>الفئة</TableHead>
                          <TableHead>الكمية الحالية</TableHead>
                          <TableHead>الحد الأدنى</TableHead>
                          <TableHead>السعر</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.category}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={product.currentStock}
                                onChange={(e) => updateProductStock(product.id, parseInt(e.target.value) || 0)}
                                className="w-20"
                                min="0"
                              />
                            </TableCell>
                            <TableCell>{product.minStockLevel}</TableCell>
                            <TableCell>{product.price} جنيه</TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  product.status === 'in_stock' ? 'default' :
                                  product.status === 'low_stock' ? 'destructive' : 'secondary'
                                }
                              >
                                {product.status === 'in_stock' ? 'متوفر' :
                                 product.status === 'low_stock' ? 'منخفض' : 'نفد'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => deleteProduct(product.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {searchTerm ? 'لا توجد منتجات تطابق البحث' : 'لا توجد منتجات بعد'}
                    </p>
                    {!searchTerm && (
                      <Button onClick={() => setShowAddDialog(true)} className="mt-4">
                        <Plus className="w-4 h-4 mr-2" />
                        إضافة أول منتج
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            {/* Alert Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-orange-500" />
                    <div>
                      <p className="text-sm text-orange-600">مخزون منخفض</p>
                      <p className="text-2xl font-bold text-orange-800">
                        {products.filter(p => p.status === 'low_stock').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                    <div>
                      <p className="text-sm text-red-600">نفد من المخزون</p>
                      <p className="text-2xl font-bold text-red-800">
                        {products.filter(p => p.status === 'out_of_stock').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-sm text-blue-600">مستوى آمن</p>
                      <p className="text-2xl font-bold text-blue-800">
                        {products.filter(p => p.status === 'in_stock').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alerts List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>التنبيهات النشطة</span>
                  <Badge variant="outline">
                    {products.filter(p => p.status !== 'in_stock').length} تنبيه
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {products.filter(p => p.status !== 'in_stock').length > 0 ? (
                  <div className="space-y-4">
                    {products.filter(p => p.status !== 'in_stock').map((product) => (
                      <div 
                        key={product.id} 
                        className={`border rounded-lg p-4 ${
                          product.status === 'out_of_stock' 
                            ? 'border-red-200 bg-red-50' 
                            : 'border-orange-200 bg-orange-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {product.status === 'out_of_stock' ? (
                              <AlertCircle className="w-5 h-5 text-red-500" />
                            ) : (
                              <AlertTriangle className="w-5 h-5 text-orange-500" />
                            )}
                            <div>
                              <h3 className={`font-semibold ${
                                product.status === 'out_of_stock' ? 'text-red-800' : 'text-orange-800'
                              }`}>
                                {product.name}
                              </h3>
                              <p className={`text-sm ${
                                product.status === 'out_of_stock' ? 'text-red-600' : 'text-orange-600'
                              }`}>
                                {product.category} • الكمية: {product.currentStock} • الحد الأدنى: {product.minStockLevel}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant={product.status === 'out_of_stock' ? 'destructive' : 'secondary'}>
                              {product.status === 'out_of_stock' ? 'نفد من المخزون' : 'مخزون منخفض'}
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateProductStock(product.id, product.minStockLevel + 10)}
                            >
                              إعادة التخزين
                            </Button>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span>مستوى المخزون</span>
                            <span>{Math.round((product.currentStock / product.minStockLevel) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                product.status === 'out_of_stock' 
                                  ? 'bg-red-500' 
                                  : 'bg-orange-500'
                              }`}
                              style={{ 
                                width: `${Math.min(100, (product.currentStock / product.minStockLevel) * 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                    <p className="text-gray-500">لا توجد تنبيهات نشطة</p>
                    <p className="text-sm text-gray-400 mt-2">
                      جميع المنتجات في مستوى آمن من المخزون
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements" className="space-y-6">
            {/* Recent Activity Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">إضافات اليوم</p>
                      <p className="text-lg font-bold">8</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">مبيعات اليوم</p>
                      <p className="text-lg font-bold">15</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <History className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">إجمالي التحركات</p>
                      <p className="text-lg font-bold">47</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">القيمة المحولة</p>
                      <p className="text-lg font-bold">1,250 جنيه</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Movements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>آخر التحركات</span>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    تصدير السجل
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Sample movements data */}
                  {[
                    {
                      id: 1,
                      type: 'sale',
                      product: 'خدمة الطباعة',
                      quantity: 5,
                      timestamp: '2025-01-05 09:15',
                      user: 'أحمد محمد',
                      notes: 'طلب رقم #12345'
                    },
                    {
                      id: 2,
                      type: 'addition',
                      product: 'كتاب الرياضيات - الصف الأول',
                      quantity: 20,
                      timestamp: '2025-01-05 08:30',
                      user: 'مدير المخزون',
                      notes: 'شحنة جديدة من المورد'
                    },
                    {
                      id: 3,
                      type: 'sale',
                      product: 'خدمة المسح الضوئي',
                      quantity: 3,
                      timestamp: '2025-01-05 07:45',
                      user: 'فاطمة علي',
                      notes: 'طلب رقم #12344'
                    },
                    {
                      id: 4,
                      type: 'adjustment',
                      product: 'كتاب العلوم - الصف الثاني',
                      quantity: -2,
                      timestamp: '2025-01-04 16:20',
                      user: 'مدير المخزون',
                      notes: 'تصحيح الجرد'
                    },
                    {
                      id: 5,
                      type: 'addition',
                      product: 'خدمة الطباعة',
                      quantity: 50,
                      timestamp: '2025-01-04 14:00',
                      user: 'مدير المخزون',
                      notes: 'تجديد المخزون'
                    }
                  ].map((movement) => (
                    <div key={movement.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          movement.type === 'sale' ? 'bg-red-100' :
                          movement.type === 'addition' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          {movement.type === 'sale' ? (
                            <Package className="w-5 h-5 text-red-600" />
                          ) : movement.type === 'addition' ? (
                            <Plus className="w-5 h-5 text-green-600" />
                          ) : (
                            <Edit className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                        
                        <div>
                          <h4 className="font-semibold">{movement.product}</h4>
                          <p className="text-sm text-gray-600">
                            {movement.type === 'sale' ? 'مبيع' : 
                             movement.type === 'addition' ? 'إضافة' : 'تعديل'} • 
                            {movement.user} • {movement.timestamp}
                          </p>
                          {movement.notes && (
                            <p className="text-xs text-gray-500 mt-1">{movement.notes}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className={`font-semibold ${
                          movement.type === 'sale' ? 'text-red-600' :
                          movement.type === 'addition' ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          {movement.type === 'sale' ? '-' : movement.quantity > 0 ? '+' : ''}{Math.abs(movement.quantity)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {movement.type === 'sale' ? 'مبيع' : 
                           movement.type === 'addition' ? 'إضافة' : 'تعديل'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-center mt-6">
                  <Button variant="outline">
                    عرض المزيد من التحركات
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