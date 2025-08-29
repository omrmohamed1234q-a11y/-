import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { ProductForm } from '@/components/ProductForm';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package, DollarSign, Tag, Search, Home, Store, Users, BarChart3, Settings, FileText } from 'lucide-react';
import AdminActionsMenu from '@/components/admin/AdminActionsMenu';
import { Link } from 'wouter';
import type { products } from '@shared/schema';

type Product = typeof products.$inferSelect;

export default function AdminProductsPage() {
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/admin/products'],
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const response = await apiRequest('POST', '/api/admin/products', productData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'تم إضافة المنتج بنجاح',
        description: 'تم إضافة المنتج الجديد إلى المتجر',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      setShowProductForm(false);
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في إضافة المنتج',
        description: error.message || 'حدث خطأ أثناء إضافة المنتج',
        variant: 'destructive',
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, productData }: { id: string; productData: any }) => {
      const response = await apiRequest('PUT', `/api/admin/products/${id}`, productData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'تم تحديث المنتج بنجاح',
        description: 'تم حفظ التغييرات بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      setShowProductForm(false);
      setEditingProduct(null);
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في تحديث المنتج',
        description: error.message || 'حدث خطأ أثناء تحديث المنتج',
        variant: 'destructive',
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await apiRequest('DELETE', `/api/admin/products/${productId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'تم حذف المنتج بنجاح',
        description: 'تم حذف المنتج من المتجر',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
    },
    onError: (error: any) => {
      toast({
        title: 'خطأ في حذف المنتج',
        description: error.message || 'حدث خطأ أثناء حذف المنتج',
        variant: 'destructive',
      });
    },
  });

  const handleSaveProduct = (productData: any) => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleAddNewProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${num.toFixed(2)} جنيه`;
  };

  const getCurriculumLabel = (type: string) => {
    const curriculumMap: { [key: string]: string } = {
      'egyptian_arabic': 'المنهج المصري - عربي',
      'egyptian_languages': 'المنهج المصري - لغات',
      'azhar': 'منهج الأزهر الشريف',
      'igcse': 'IGCSE البريطاني',
      'american': 'الدبلومة الأمريكية',
      'ib': 'البكالوريا الدولية IB',
      'stem': 'مدارس STEM'
    };
    return curriculumMap[type] || type;
  };

  const getSubjectLabel = (subject: string) => {
    const subjectMap: { [key: string]: string } = {
      'arabic': 'اللغة العربية',
      'english': 'اللغة الإنجليزية',
      'math': 'الرياضيات',
      'science': 'العلوم',
      'chemistry': 'الكيمياء',
      'physics': 'الفيزياء',
      'biology': 'الأحياء'
    };
    return subjectMap[subject] || subject;
  };

  const getGradeLevelLabel = (grade: string) => {
    const gradeMap: { [key: string]: string } = {
      'primary_1': 'الأول الابتدائي',
      'primary_2': 'الثاني الابتدائي',
      'primary_3': 'الثالث الابتدائي',
      'prep_1': 'الأول الإعدادي',
      'prep_2': 'الثاني الإعدادي',
      'prep_3': 'الثالث الإعدادي',
      'secondary_1': 'الأول الثانوي',
      'secondary_2': 'الثاني الثانوي',
      'secondary_3': 'الثالث الثانوي'
    };
    return gradeMap[grade] || grade;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">جاري تحميل المنتجات...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Admin Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">لوحة التحكم الإدارية</h2>
              <Badge className="bg-blue-100 text-blue-800">المنتجات</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Link href="/admin">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50">
                  <Home className="w-6 h-6 text-blue-600" />
                  <span className="text-xs">الرئيسية</span>
                </Button>
              </Link>
              
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg h-20 flex flex-col items-center justify-center space-y-2">
                <Package className="w-6 h-6 text-blue-600" />
                <span className="text-xs text-blue-800 font-medium">المنتجات</span>
              </div>
              
              <Link href="/admin/store">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-green-50">
                  <Store className="w-6 h-6 text-green-600" />
                  <span className="text-xs">المتجر</span>
                </Button>
              </Link>
              
              <Link href="/admin">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50">
                  <Users className="w-6 h-6 text-purple-600" />
                  <span className="text-xs">المستخدمين</span>
                </Button>
              </Link>
              
              <Link href="/admin">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-orange-50">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                  <span className="text-xs">التقارير</span>
                </Button>
              </Link>
              
              <Link href="/cloudinary-test">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-indigo-50">
                  <FileText className="w-6 h-6 text-indigo-600" />
                  <span className="text-xs">اختبار Cloudinary</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/">
              <Button variant="outline" className="flex items-center space-x-2 space-x-reverse">
                <Home className="w-4 h-4" />
                <span>العودة للرئيسية</span>
              </Button>
            </Link>
            <Button
              onClick={handleAddNewProduct}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg"
              data-testid="button-add-new-product"
            >
              <Plus className="w-5 h-5 ml-2" />
              إضافة منتج جديد
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المنتجات</h1>
            <p className="text-gray-600">إضافة وتحرير وإدارة منتجات المتجر التعليمي</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي المنتجات</p>
                  <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">المنتجات المميزة</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {products.filter(p => p.featured).length}
                  </p>
                </div>
                <Tag className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">منتجات VIP</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {products.filter(p => p.vip).length}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="البحث في المنتجات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">قائمة المنتجات ({filteredProducts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد منتجات</h3>
                <p className="text-gray-500 mb-6">ابدأ بإضافة منتجك الأول</p>
                <Button onClick={handleAddNewProduct} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة منتج جديد
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 space-x-reverse flex-1">
                        {/* Product Image */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-8 h-8 text-gray-400" />
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">{product.name}</h3>
                              {product.nameEn && (
                                <p className="text-sm text-gray-500">{product.nameEn}</p>
                              )}
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-xl text-green-600">
                                {formatCurrency(product.price)}
                              </p>
                              {product.originalPrice && (
                                <p className="text-sm text-gray-500 line-through">
                                  {formatCurrency(product.originalPrice)}
                                </p>
                              )}
                            </div>
                          </div>

                          <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>

                          {/* Educational Info */}
                          <div className="flex flex-wrap gap-2">
                            {product.curriculumType && (
                              <Badge variant="outline" className="text-xs">
                                {getCurriculumLabel(product.curriculumType)}
                              </Badge>
                            )}
                            {product.subject && (
                              <Badge variant="outline" className="text-xs">
                                {getSubjectLabel(product.subject)}
                              </Badge>
                            )}
                            {product.gradeLevel && (
                              <Badge variant="outline" className="text-xs">
                                {getGradeLevelLabel(product.gradeLevel)}
                              </Badge>
                            )}
                            {product.authorPublisher && (
                              <Badge variant="outline" className="text-xs">
                                {product.authorPublisher}
                              </Badge>
                            )}
                          </div>

                          {/* Features */}
                          <div className="flex flex-wrap gap-2">
                            {product.featured && (
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">مميز</Badge>
                            )}
                            {product.teacherOnly && (
                              <Badge className="bg-blue-100 text-blue-800 text-xs">للمعلمين</Badge>
                            )}
                            {product.vip && (
                              <Badge className="bg-purple-100 text-purple-800 text-xs">VIP</Badge>
                            )}
                            {product.isDigital && (
                              <Badge className="bg-green-100 text-green-800 text-xs">رقمي</Badge>
                            )}
                          </div>

                          {/* Stock Info */}
                          <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-600">
                            <span>المخزون: {product.availableCopies || 0}</span>
                            <span>الفئة: {product.category}</span>
                            {product.productTypes && product.productTypes.length > 0 && (
                              <span>الأنواع: {product.productTypes.join(', ')}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Form Dialog */}
        <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <ProductForm
              editingProduct={editingProduct}
              onSave={handleSaveProduct}
              onCancel={() => {
                setShowProductForm(false);
                setEditingProduct(null);
              }}
              isLoading={createProductMutation.isPending || updateProductMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        <AdminActionsMenu />
      </div>
    </div>
  );
}