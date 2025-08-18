import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import AdminLayout from './layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye, ShoppingCart, Store as StoreIcon, Package } from 'lucide-react';
import ProductForm from '@/components/admin/ProductForm';
import type { Product, InsertProduct } from '@shared/schema';
import { 
  getCurriculumLabel, 
  getGradeLevelLabel, 
  getSubjectLabel, 
  getProductTypesLabels 
} from '@/lib/constants/education';

const categories = [
  {
    id: 'all',
    name: 'جميع المنتجات',
    icon: Package,
    color: 'from-gray-50 to-gray-100',
    iconColor: 'text-gray-600',
  },
  {
    id: 'teachers',
    name: 'مواد المعلمين',
    icon: 'fas fa-chalkboard-teacher',
    color: 'from-blue-50 to-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'students',
    name: 'مواد الطلاب',
    icon: 'fas fa-graduation-cap',
    color: 'from-green-50 to-green-100',
    iconColor: 'text-green-600',
  },
  {
    id: 'supplies',
    name: 'مستلزمات الطباعة',
    icon: 'fas fa-print',
    color: 'from-purple-50 to-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    id: 'digital',
    name: 'تحميلات رقمية',
    icon: 'fas fa-download',
    color: 'from-orange-50 to-orange-100',
    iconColor: 'text-orange-600',
  },
];

export default function AdminStore() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Fetch products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/admin/products'],
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (productData: InsertProduct) => 
      apiRequest('POST', '/api/admin/products', productData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      setDialogOpen(false);
      toast({
        title: 'تم الإنشاء',
        description: 'تم إنشاء المنتج بنجاح',
      });
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<InsertProduct> }) =>
      apiRequest('PUT', `/api/admin/products/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      setDialogOpen(false);
      setEditingProduct(null);
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث المنتج بنجاح',
      });
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (productId: string) => 
      apiRequest('DELETE', `/api/admin/products/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({
        title: 'تم الحذف',
        description: 'تم حذف المنتج بنجاح'
      });
    }
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: (productId: string) => 
      apiRequest('POST', '/api/cart/add', { 
        productId, 
        quantity: 1 
      }),
    onSuccess: () => {
      toast({
        title: 'تمت الإضافة',
        description: 'تم إضافة المنتج إلى السلة',
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

  // Filter products
  const filteredProducts = products.filter((product: Product) => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a: Product, b: Product) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case 'oldest':
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      case 'price-low':
        return parseFloat(a.price) - parseFloat(b.price);
      case 'price-high':
        return parseFloat(b.price) - parseFloat(a.price);
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 space-x-reverse">
            <StoreIcon className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">متجر اطبعلي</h1>
              <p className="text-muted-foreground">إدارة وعرض المنتجات التعليمية</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse">
            <Badge variant="outline">{sortedProducts.length} منتج</Badge>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    setEditingProduct(null);
                    setDialogOpen(true);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-add-product"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة منتج جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                  <DialogTitle>
                    {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
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
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="البحث في المنتجات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
              data-testid="input-search"
            />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48" data-testid="select-category">
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48" data-testid="select-sort">
              <SelectValue placeholder="ترتيب حسب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">الأحدث</SelectItem>
              <SelectItem value="oldest">الأقدم</SelectItem>
              <SelectItem value="price-low">السعر: من الأقل للأكثر</SelectItem>
              <SelectItem value="price-high">السعر: من الأكثر للأقل</SelectItem>
              <SelectItem value="name">الاسم أبجدياً</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        {sortedProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">لا توجد منتجات</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategory !== 'all' 
                ? 'لم يتم العثور على منتجات تطابق البحث' 
                : 'لم يتم إضافة أي منتجات بعد'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProducts.map((product: Product) => (
              <Card key={product.id} className="relative hover:shadow-lg transition-all duration-200 group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 mb-2">{product.name}</CardTitle>
                      
                      {/* Educational Badges */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {product.curriculumType && (
                          <Badge variant="outline" className="text-xs">
                            {getCurriculumLabel(product.curriculumType)}
                          </Badge>
                        )}
                        {product.gradeLevel && (
                          <Badge variant="secondary" className="text-xs">
                            {getGradeLevelLabel(product.gradeLevel)}
                          </Badge>
                        )}
                        {product.subject && (
                          <Badge variant="default" className="text-xs">
                            {getSubjectLabel(product.subject)}
                          </Badge>
                        )}
                      </div>
                      
                      {product.authorPublisher && (
                        <p className="text-sm text-muted-foreground mb-2">
                          بواسطة: {product.authorPublisher}
                        </p>
                      )}
                      
                      {product.productTypes && product.productTypes.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {product.productTypes.map((type, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {getProductTypesLabels()[type] || type}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Admin Actions */}
                    <div className="flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingProduct(product);
                          setDialogOpen(true);
                        }}
                        data-testid={`button-edit-${product.id}`}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteProductMutation.mutate(product.id)}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-delete-${product.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {product.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-lg font-bold text-primary">
                        {product.price} جنيه
                      </div>
                      {product.availableCopies !== undefined && product.availableCopies !== null && (
                        <div className="text-xs text-muted-foreground">
                          {product.availableCopies > 0 
                            ? `متاح: ${product.availableCopies} نسخة`
                            : 'غير متاح'
                          }
                        </div>
                      )}
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => addToCartMutation.mutate(product.id)}
                      disabled={addToCartMutation.isPending || (product.availableCopies !== undefined && product.availableCopies !== null && product.availableCopies <= 0)}
                      data-testid={`button-add-cart-${product.id}`}
                    >
                      <ShoppingCart className="w-4 h-4 ml-1" />
                      أضف للسلة
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}