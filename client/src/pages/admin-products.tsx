import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ProductForm } from '@/components/ProductForm';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package, DollarSign, Tag, Search, Home, Store, Users, BarChart3, Settings, FileText, BookOpen, ArrowLeft, Grid, List, Filter } from 'lucide-react';
import AdminActionsMenu from '@/components/admin/AdminActionsMenu';
import { Link } from 'wouter';
import type { products } from '@shared/schema';

type Product = typeof products.$inferSelect;

export default function AdminProductsPage() {
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const queryClient = useQueryClient();

  // Fetch products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/admin/products'],
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      return await apiRequest('POST', '/api/admin/products', productData);
    },
    onSuccess: () => {
      toast({
        title: 'تم إضافة المنتج بنجاح',
        description: 'تم إضافة المنتج الجديد إلى المتجر',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      setShowProductForm(false);
      setEditingProduct(null);
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
      return await apiRequest('PUT', `/api/admin/products/${id}`, productData);
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
      console.log('🚀 Mutation function called for:', productId);
      return await apiRequest('DELETE', `/api/admin/products/${productId}`);
    },
    onSuccess: (_data, productId) => {
      console.log('✅ Delete mutation succeeded for:', productId);

      // CRITICAL FIX: Manually update cache instead of refetching
      // because staleTime: Infinity prevents refetch from working
      queryClient.setQueryData(['/api/admin/products'], (oldData: Product[] | undefined) => {
        if (!oldData) return [];
        const newData = oldData.filter(p => p.id !== productId);
        console.log(`📊 Admin cache updated: ${oldData.length} → ${newData.length} products`);
        return newData;
      });

      // ALSO update public products cache (for store page)
      queryClient.setQueryData(['/api/products'], (oldData: Product[] | undefined) => {
        if (!oldData) return [];
        const newData = oldData.filter(p => p.id !== productId);
        console.log(`📊 Store cache updated: ${oldData.length} → ${newData.length} products`);
        return newData;
      });

      toast({
        title: 'تم حذف المنتج بنجاح',
        description: 'تم حذف المنتج من المتجر',
      });
    },
    onError: (error: any) => {
      console.log('❌ Delete mutation failed:', error);
      toast({
        title: 'خطأ في حذف المنتج',
        description: error.message || 'حدث خطأ أثناء حذف المنتج',
        variant: 'destructive',
      });
    },
  });

  const handleCreateProduct = (productData: any) => {
    createProductMutation.mutate(productData);
  };

  const handleUpdateProduct = (productData: any) => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, productData });
    }
  };

  const handleSaveProduct = (productData: any) => {
    if (editingProduct) {
      handleUpdateProduct(productData);
    } else {
      handleCreateProduct(productData);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = (productId: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    console.log('🗑️ handleDeleteProduct called with ID:', productId);

    // Prevent double execution
    if (deleteProductMutation.isPending) {
      console.log('⏳ Delete already in progress, ignoring...');
      return;
    }

    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      console.log('✅ User confirmed deletion, calling mutation...');
      deleteProductMutation.mutate(productId);
    } else {
      console.log('❌ User cancelled deletion');
    }
  };

  const handleAddNewProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  // Filter products based on search
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.nameEn && product.nameEn.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

  const categories = [
    { value: 'all', label: 'جميع الفئات' },
    { value: 'books', label: 'الكتب' },
    { value: 'worksheets', label: 'أوراق العمل' },
    { value: 'exams', label: 'الامتحانات' },
    { value: 'notes', label: 'الملاحظات' },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Top Header with Back Button */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-gray-100">
                <ArrowLeft className="w-4 h-4" />
                <span>العودة للوحة التحكم</span>
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-gray-800">إدارة المنتجات</span>
            </div>

            <Button
              onClick={handleAddNewProduct}
              className="bg-blue-500 hover:bg-blue-600 text-white gap-2"
              data-testid="button-add-new-product"
            >
              <Plus className="w-4 h-4" />
              إضافة منتج جديد
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Compact Stats - Horizontal Scroll */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {/* Total */}
          <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-100 min-w-fit">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">إجمالي</p>
              <p className="text-xl font-bold text-gray-900">{products.length}</p>
            </div>
          </div>

          {/* Out of Stock - Alert */}
          {products.filter(p => (p.availableCopies || 0) === 0).length > 0 && (
            <div className="flex items-center gap-3 bg-red-50 rounded-lg px-4 py-3 shadow-sm border border-red-200 min-w-fit animate-pulse">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-red-600 font-medium">نفذ!</p>
                <p className="text-xl font-bold text-red-700">
                  {products.filter(p => (p.availableCopies || 0) === 0).length}
                </p>
              </div>
            </div>
          )}

          {/* Low Stock - Warning */}
          {products.filter(p => {
            const stock = p.availableCopies || 0;
            return stock > 0 && stock <= 5;
          }).length > 0 && (
              <div className="flex items-center gap-3 bg-yellow-50 rounded-lg px-4 py-3 shadow-sm border border-yellow-200 min-w-fit">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Tag className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-yellow-600 font-medium">منخفض</p>
                  <p className="text-xl font-bold text-yellow-700">
                    {products.filter(p => {
                      const stock = p.availableCopies || 0;
                      return stock > 0 && stock <= 5;
                    }).length}
                  </p>
                </div>
              </div>
            )}

          {/* Inventory Value */}
          <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-3 shadow-sm border border-gray-100 min-w-fit">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">القيمة</p>
              <p className="text-lg font-bold text-gray-900">
                {products.reduce((sum, p) => {
                  return sum + (parseFloat(p.price) * (p.availableCopies || 0));
                }, 0).toLocaleString('ar-EG')} جنيه
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="البحث في المنتجات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                    data-testid="input-search-products"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  data-testid="select-category-filter"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>

                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="px-3"
                    data-testid="button-grid-view"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="px-3"
                    data-testid="button-list-view"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center justify-between">
              <span>قائمة المنتجات ({filteredProducts.length})</span>
              <Badge variant="secondary">{viewMode === 'grid' ? 'عرض شبكي' : 'عرض قائمة'}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mb-6">
                  <Package className="w-12 h-12 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">لا توجد منتجات</h3>
                <p className="text-gray-500 mb-8 max-w-md text-center">
                  ابدأ رحلتك بإضافة منتجك الأول وشاهد مبيعاتك تنمو
                </p>
                <Button
                  onClick={handleAddNewProduct}
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg"
                >
                  <Plus className="w-5 h-5 ml-2" />
                  إضافة منتج جديد
                </Button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Product Image */}
                        <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-12 h-12 text-gray-400" />
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="space-y-2">
                          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">{product.name}</h3>
                          {product.nameEn && (
                            <p className="text-sm text-gray-500">{product.nameEn}</p>
                          )}

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-bold text-xl text-green-600">
                                {formatCurrency(product.price)}
                              </p>
                              {product.originalPrice && (
                                <p className="text-sm text-gray-500 line-through">
                                  {formatCurrency(product.originalPrice)}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">متوفر: {product.availableCopies}</p>
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="flex gap-2 flex-wrap">
                            {product.featured && (
                              <Badge className="bg-yellow-100 text-yellow-800">مميز</Badge>
                            )}
                            {product.vip && (
                              <Badge className="bg-purple-100 text-purple-800">VIP</Badge>
                            )}
                            {product.category && (
                              <Badge variant="outline">{product.category}</Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                            data-testid={`button-edit-${product.id}`}
                          >
                            <Edit className="w-4 h-4 ml-1" />
                            تعديل
                          </Button>
                          <AdminActionsMenu
                            itemId={product.id}
                            onEdit={() => handleEditProduct(product)}
                            onDelete={() => handleDeleteProduct(product.id)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="p-4 hover:shadow-md transition-shadow">
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

                          <div className="flex items-center justify-between">
                            <div className="flex gap-2 flex-wrap">
                              {product.featured && (
                                <Badge className="bg-yellow-100 text-yellow-800">مميز</Badge>
                              )}
                              {product.vip && (
                                <Badge className="bg-purple-100 text-purple-800">VIP</Badge>
                              )}
                              {product.category && (
                                <Badge variant="outline">{product.category}</Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">متوفر: {product.availableCopies}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                                data-testid={`button-edit-${product.id}`}
                              >
                                <Edit className="w-4 h-4 ml-1" />
                                تعديل
                              </Button>
                              <AdminActionsMenu
                                itemId={product.id}
                                onEdit={() => handleEditProduct(product)}
                                onDelete={() => handleDeleteProduct(product.id)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Product Form Dialog */}
      <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            editingProduct={editingProduct}
            onSubmit={handleSaveProduct}
            onCancel={() => {
              setShowProductForm(false);
              setEditingProduct(null);
            }}
            isLoading={editingProduct ? updateProductMutation.isPending : createProductMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}