import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package, DollarSign, Tag } from 'lucide-react';
import AdminActionsMenu from '@/components/admin/AdminActionsMenu';
import type { products } from '@shared/schema';

type Product = typeof products.$inferSelect;

export default function AdminProductsPage() {
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stock: '',
    imageUrl: '',
    grade: '',
    subject: '',
    publisher: '',
    curriculum: '',
    featured: false,
    teacherOnly: false,
    vip: false
  });

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
      resetForm();
    },
    onError: (error: any) => {
      console.error('Product creation error:', error);
      toast({
        title: 'خطأ في إضافة المنتج',
        description: 'حدث خطأ أثناء إضافة المنتج. حاول مرة أخرى.',
        variant: 'destructive',
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest('PUT', `/api/admin/products/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'تم تحديث المنتج بنجاح',
        description: 'تم حفظ التغييرات على المنتج',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      setEditingProduct(null);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Product update error:', error);
      toast({
        title: 'خطأ في تحديث المنتج',
        description: 'حدث خطأ أثناء تحديث المنتج. حاول مرة أخرى.',
        variant: 'destructive',
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/products/${id}`);
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
      console.error('Product deletion error:', error);
      toast({
        title: 'خطأ في حذف المنتج',
        description: 'حدث خطأ أثناء حذف المنتج. حاول مرة أخرى.',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setNewProduct({
      name: '',
      description: '',
      category: '',
      price: '',
      stock: '',
      imageUrl: '',
      grade: '',
      subject: '',
      publisher: '',
      curriculum: '',
      featured: false,
      teacherOnly: false,
      vip: false
    });
  };

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.description || !newProduct.category || !newProduct.price) {
      toast({
        title: 'بيانات غير مكتملة',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        variant: 'destructive',
      });
      return;
    }

    const productData = {
      ...newProduct,
      price: newProduct.price,
      stock: parseInt(newProduct.stock) || 0,
    };

    createProductMutation.mutate(productData);
  };

  const updateProduct = async () => {
    if (!editingProduct) return;

    const productData = {
      ...newProduct,
      price: newProduct.price,
      stock: parseInt(newProduct.stock) || 0,
    };

    updateProductMutation.mutate({ id: editingProduct.id, data: productData });
  };

  const startEditing = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name || '',
      description: product.description || '',
      category: product.category || '',
      price: product.price || '',
      stock: product.stock?.toString() || '',
      imageUrl: product.imageUrl || '',
      grade: product.grade || '',
      subject: product.subject || '',
      publisher: product.publisher || '',
      curriculum: product.curriculum || '',
      featured: product.featured || false,
      teacherOnly: product.teacherOnly || false,
      vip: product.vip || false
    });
    setShowProductForm(true);
  };

  const cancelEditing = () => {
    setEditingProduct(null);
    setShowProductForm(false);
    resetForm();
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
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المنتجات</h1>
              <p className="text-gray-600">إضافة وتحرير وإدارة منتجات المتجر</p>
            </div>
            <Button
              onClick={() => setShowProductForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg"
              data-testid="button-add-new-product"
            >
              <Plus className="w-5 h-5 ml-2" />
              اضافة منتج جديد
            </Button>
          </div>
        </div>

        {/* Add/Edit Product Form */}
        {showProductForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl">
                {editingProduct ? 'تحرير المنتج' : 'إضافة منتج جديد'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المنتج *
                  </label>
                  <Input
                    placeholder="أدخل اسم المنتج"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    data-testid="input-product-name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    السعر (جنيه) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    data-testid="input-product-price"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الفئة *
                  </label>
                  <Input
                    placeholder="مثل: كتب، أدوات مكتبية، إلخ"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    data-testid="input-product-category"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المخزون
                  </label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                    data-testid="input-product-stock"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الصف الدراسي
                  </label>
                  <Input
                    placeholder="مثل: الأول الابتدائي، الثالث الثانوي"
                    value={newProduct.grade}
                    onChange={(e) => setNewProduct({...newProduct, grade: e.target.value})}
                    data-testid="input-product-grade"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المادة
                  </label>
                  <Input
                    placeholder="مثل: رياضيات، علوم، لغة عربية"
                    value={newProduct.subject}
                    onChange={(e) => setNewProduct({...newProduct, subject: e.target.value})}
                    data-testid="input-product-subject"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الناشر
                  </label>
                  <Input
                    placeholder="اسم الناشر أو دار النشر"
                    value={newProduct.publisher}
                    onChange={(e) => setNewProduct({...newProduct, publisher: e.target.value})}
                    data-testid="input-product-publisher"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المنهج
                  </label>
                  <Input
                    placeholder="مثل: سعودي، مصري، أمريكي"
                    value={newProduct.curriculum}
                    onChange={(e) => setNewProduct({...newProduct, curriculum: e.target.value})}
                    data-testid="input-product-curriculum"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  وصف المنتج *
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="أدخل وصف تفصيلي للمنتج"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  data-testid="input-product-description"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رابط الصورة
                </label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})}
                  data-testid="input-product-image"
                />
              </div>

              {/* Product Options */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <input
                    type="checkbox"
                    checked={newProduct.featured}
                    onChange={(e) => setNewProduct({...newProduct, featured: e.target.checked})}
                    className="rounded border-gray-300"
                    data-testid="checkbox-featured"
                  />
                  <label className="text-sm font-medium text-gray-700">منتج مميز</label>
                </div>

                <div className="flex items-center space-x-3 space-x-reverse">
                  <input
                    type="checkbox"
                    checked={newProduct.teacherOnly}
                    onChange={(e) => setNewProduct({...newProduct, teacherOnly: e.target.checked})}
                    className="rounded border-gray-300"
                    data-testid="checkbox-teacher-only"
                  />
                  <label className="text-sm font-medium text-gray-700">للمعلمين فقط</label>
                </div>

                <div className="flex items-center space-x-3 space-x-reverse">
                  <input
                    type="checkbox"
                    checked={newProduct.vip}
                    onChange={(e) => setNewProduct({...newProduct, vip: e.target.checked})}
                    className="rounded border-gray-300"
                    data-testid="checkbox-vip"
                  />
                  <label className="text-sm font-medium text-gray-700">منتج VIP</label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 space-x-reverse mt-6">
                <Button 
                  variant="outline"
                  onClick={cancelEditing}
                  data-testid="button-cancel"
                >
                  إلغاء
                </Button>
                <Button 
                  onClick={editingProduct ? updateProduct : addProduct}
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-save-product"
                >
                  {(createProductMutation.isPending || updateProductMutation.isPending) ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      {editingProduct ? 'جاري التحديث...' : 'جاري الإضافة...'}
                    </div>
                  ) : (
                    <>
                      <Package className="w-4 h-4 ml-2" />
                      {editingProduct ? 'تحديث المنتج' : 'إضافة المنتج'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product: Product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2" data-testid={`text-product-name-${product.id}`}>
                      {product.name}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {product.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    {product.imageUrl && (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <AdminActionsMenu
                      itemId={product.id}
                      itemType="product"
                      onEdit={() => startEditing(product)}
                      onDelete={() => deleteProductMutation.mutate(product.id)}
                      showView={false}
                      showDuplicate={false}
                    />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">السعر:</span>
                    <span className="font-semibold text-green-600" data-testid={`text-product-price-${product.id}`}>
                      {product.price} جنيه
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">المخزون:</span>
                    <span className={`font-semibold ${(product.stock || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stock || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">الفئة:</span>
                    <Badge variant="secondary">{product.category}</Badge>
                  </div>
                </div>

                {/* Product Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {product.featured && (
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">مميز</Badge>
                  )}
                  {product.teacherOnly && (
                    <Badge className="bg-blue-100 text-blue-800 text-xs">للمعلمين</Badge>
                  )}
                  {product.vip && (
                    <Badge className="bg-purple-100 text-purple-800 text-xs">VIP</Badge>
                  )}
                  {product.grade && (
                    <Badge variant="outline" className="text-xs">{product.grade}</Badge>
                  )}
                  {product.subject && (
                    <Badge variant="outline" className="text-xs">{product.subject}</Badge>
                  )}
                </div>


              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد منتجات</h3>
            <p className="text-gray-600 mb-4">ابدأ بإضافة أول منتج إلى المتجر</p>
            <Button
              onClick={() => setShowProductForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة منتج جديد
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}