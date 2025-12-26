import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Product, InsertProduct } from '@shared/schema';
import ProductForm from '@/components/admin/ProductForm';
import {
  getCurriculumLabel,
  getSubjectLabel,
  getGradeLevelLabel,
  getProductTypesLabels
} from '@/lib/constants/education';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Package,
  Star,
  ArrowLeft,
  AlertTriangle,
  XCircle,
  TrendingDown,
  DollarSign,
  MoreVertical
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function AdminProducts() {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/admin/products']
  });

  // Calculate smart stats
  const stats = useMemo(() => {
    const total = products.length;
    const outOfStock = products.filter(p => (p.stock || 0) === 0).length;
    const lowStock = products.filter(p => {
      const stock = p.stock || 0;
      return stock > 0 && stock <= 5; // Low stock threshold: 5 or less
    }).length;
    const totalValue = products.reduce((sum, p) => {
      return sum + (parseFloat(p.price) * (p.stock || 0));
    }, 0);

    return { total, outOfStock, lowStock, totalValue: Math.round(totalValue) };
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (searchQuery.trim()) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      if (categoryFilter === 'books') {
        filtered = filtered.filter(p =>
          p.category.includes('book') || p.category.includes('education')
        );
      } else if (categoryFilter === 'digital') {
        filtered = filtered.filter(p => p.isDigital);
      } else {
        filtered = filtered.filter(p => p.category === categoryFilter);
      }
    }

    if (stockFilter === 'available') {
      filtered = filtered.filter(p => (p.stock || 0) > 0);
    } else if (stockFilter === 'out') {
      filtered = filtered.filter(p => (p.stock || 0) === 0);
    } else if (stockFilter === 'low') {
      filtered = filtered.filter(p => {
        const stock = p.stock || 0;
        return stock > 0 && stock <= 5;
      });
    }

    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      } else if (sortBy === 'price-low') {
        return parseFloat(a.price) - parseFloat(b.price);
      } else if (sortBy === 'price-high') {
        return parseFloat(b.price) - parseFloat(a.price);
      } else if (sortBy === 'stock-low') {
        return (a.stock || 0) - (b.stock || 0);
      }
      return 0;
    });

    return filtered;
  }, [products, searchQuery, categoryFilter, stockFilter, sortBy]);

  const createProductMutation = useMutation({
    mutationFn: async (product: InsertProduct) => {
      await apiRequest('POST', '/api/admin/products', product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      setDialogOpen(false);
      setEditingProduct(null);
      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ المنتج بنجاح'
      });
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Product> }) => {
      await apiRequest('PUT', `/api/admin/products/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      setDialogOpen(false);
      setEditingProduct(null);
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث المنتج بنجاح'
      });
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف المنتج بنجاح'
      });
    }
  });

  const handleFormSubmit = (formData: any) => {
    const productData: InsertProduct = {
      ...formData,
      category: formData.category || 'education',
      availableCopies: formData.availableCopies || 0,
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, updates: productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStockFilter('all');
    setSortBy('newest');
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">إدارة المنتجات</h1>
                <p className="text-sm text-gray-500 mt-0.5">{products.length} منتج</p>
              </div>
            </div>
            <Button onClick={() => {
              setEditingProduct(null);
              setDialogOpen(true);
            }} size="lg">
              <Plus className="w-5 h-5 ml-2" />
              إضافة منتج
            </Button>
          </div>

          {/* Search Bar - At Top */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="ابحث عن منتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 h-12 text-base"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Smart Stats - Alerts & Useful Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Products */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">إجمالي المنتجات</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Out of Stock - ALERT */}
          <Card className={stats.outOfStock > 0 ? 'border-red-200 bg-red-50' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">نفذ المخزون</p>
                  <p className={`text-3xl font-bold ${stats.outOfStock > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {stats.outOfStock}
                  </p>
                  {stats.outOfStock > 0 && (
                    <p className="text-xs text-red-600 mt-1 font-medium">يحتاج إعادة توفير!</p>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stats.outOfStock > 0 ? 'bg-red-200' : 'bg-gray-100'
                  }`}>
                  <XCircle className={`w-6 h-6 ${stats.outOfStock > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock - WARNING */}
          <Card className={stats.lowStock > 0 ? 'border-yellow-200 bg-yellow-50' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">مخزون منخفض</p>
                  <p className={`text-3xl font-bold ${stats.lowStock > 0 ? 'text-yellow-600' : 'text-gray-900'}`}>
                    {stats.lowStock}
                  </p>
                  {stats.lowStock > 0 && (
                    <p className="text-xs text-yellow-600 mt-1 font-medium">أقل من 5 قطع</p>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stats.lowStock > 0 ? 'bg-yellow-200' : 'bg-gray-100'
                  }`}>
                  <AlertTriangle className={`w-6 h-6 ${stats.lowStock > 0 ? 'text-yellow-600' : 'text-gray-400'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Inventory Value */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">قيمة المخزون</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalValue.toLocaleString('ar-EG')}</p>
                  <p className="text-xs text-gray-500 mt-1">جنيه</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الفئات</SelectItem>
                  <SelectItem value="books">كتب</SelectItem>
                  <SelectItem value="supplies">أدوات</SelectItem>
                  <SelectItem value="digital">رقمي</SelectItem>
                </SelectContent>
              </Select>

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="المخزون" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="available">متوفر</SelectItem>
                  <SelectItem value="low">مخزون منخفض</SelectItem>
                  <SelectItem value="out">نفذ المخزون</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="الترتيب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">الأحدث</SelectItem>
                  <SelectItem value="stock-low">المخزون الأقل</SelectItem>
                  <SelectItem value="price-low">السعر ↑</SelectItem>
                  <SelectItem value="price-high">السعر ↓</SelectItem>
                </SelectContent>
              </Select>

              {(searchQuery || categoryFilter !== 'all' || stockFilter !== 'all' || sortBy !== 'newest') && (
                <Button variant="outline" onClick={clearFilters}>
                  مسح الفلاتر
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="p-16 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد منتجات</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || categoryFilter !== 'all' || stockFilter !== 'all'
                  ? 'جرب تغيير معايير البحث'
                  : 'ابدأ بإضافة منتجك الأول'}
              </p>
              <Button onClick={() => {
                if (searchQuery || categoryFilter !== 'all' || stockFilter !== 'all') {
                  clearFilters();
                } else {
                  setEditingProduct(null);
                  setDialogOpen(true);
                }
              }}>
                {searchQuery || categoryFilter !== 'all' || stockFilter !== 'all'
                  ? 'مسح الفلاتر'
                  : 'إضافة منتج جديد'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const stock = product.stock || 0;
              const isOutOfStock = stock === 0;
              const isLowStock = stock > 0 && stock <= 5;

              return (
                <Card key={product.id} className={`group hover:shadow-lg transition-all duration-200 ${isOutOfStock ? 'border-red-200' : isLowStock ? 'border-yellow-200' : ''
                  }`}>
                  <CardContent className="p-0">
                    {/* Image */}
                    <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-300" />
                        </div>
                      )}

                      {/* Quick Actions */}
                      <div className="absolute top-2 left-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="secondary" className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => {
                              setEditingProduct(product);
                              setDialogOpen(true);
                            }}>
                              <Edit className="w-4 h-4 ml-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
                                  deleteProductMutation.mutate(product.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 ml-2" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Stock Alert Badge */}
                      {isOutOfStock && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-red-500 text-white border-0 shadow-sm">
                            نفذ المخزون
                          </Badge>
                        </div>
                      )}
                      {isLowStock && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-yellow-500 text-white border-0 shadow-sm">
                            مخزون منخفض
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3rem]">
                        {product.name}
                      </h3>

                      {/* Educational Info */}
                      {(product.gradeLevel || product.subject) && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {product.gradeLevel && (
                            <Badge variant="outline" className="text-xs">
                              {getGradeLevelLabel(product.gradeLevel)}
                            </Badge>
                          )}
                          {product.subject && (
                            <Badge variant="outline" className="text-xs">
                              {getSubjectLabel(product.subject)}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Price & Stock */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-xl font-bold text-gray-900">
                            {product.price} جنيه
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-gray-400 line-through mr-2">
                              {product.originalPrice}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stock Display */}
                      <div className={`text-center py-2 rounded-lg mb-3 ${isOutOfStock ? 'bg-red-100 text-red-700' :
                          isLowStock ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                        }`}>
                        <span className="font-semibold">
                          {isOutOfStock ? 'نفذ المخزون' : `${stock} متوفر`}
                        </span>
                      </div>

                      {/* Rating */}
                      {product.rating && parseFloat(product.rating) > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-gray-900">
                            {parseFloat(product.rating).toFixed(1)}
                          </span>
                          <span className="text-gray-400">({product.ratingCount || 0})</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingProduct ? 'تحديث المنتج' : 'إضافة منتج جديد'}
            </DialogTitle>
          </DialogHeader>

          <ProductForm
            initialData={editingProduct}
            onSubmit={handleFormSubmit}
            isLoading={createProductMutation.isPending || updateProductMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}