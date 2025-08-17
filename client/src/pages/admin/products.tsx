import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Product, InsertProduct } from '@shared/schema';
import {
  Plus,
  Edit,
  Trash2,
  Upload,
  Image,
  Package,
  DollarSign,
  BarChart3,
  Eye,
  EyeOff
} from 'lucide-react';

export default function AdminProducts() {
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/admin/products']
  });

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
      await apiRequest('PATCH', `/api/admin/products/${id}`, updates);
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const productData: InsertProduct = {
      name: formData.get('name') as string,
      nameEn: formData.get('nameEn') as string,
      description: formData.get('description') as string,
      descriptionEn: formData.get('descriptionEn') as string,
      category: formData.get('category') as string,
      price: formData.get('price') as string,
      originalPrice: formData.get('originalPrice') as string || null,
      stock: parseInt(formData.get('stock') as string) || 0,
      grade: formData.get('grade') as string || null,
      subject: formData.get('subject') as string || null,
      curriculum: formData.get('curriculum') as string || null,
      isDigital: formData.get('isDigital') === 'on',
      teacherOnly: formData.get('teacherOnly') === 'on',
      vip: formData.get('vip') === 'on',
      featured: formData.get('featured') === 'on',
      tags: (formData.get('tags') as string)?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, updates: productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">إدارة المنتجات</h1>
        <div className="flex space-x-3 space-x-reverse">
          <Badge variant="outline">{products?.length || 0} منتج</Badge>
          <Button onClick={() => {
            setEditingProduct(null);
            setDialogOpen(true);
          }}>
            <Plus className="w-4 h-4 ml-2" />
            إضافة منتج جديد
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products?.map((product) => (
          <Card key={product.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                <div className="flex space-x-1 space-x-reverse">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingProduct(product);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
                        deleteProductMutation.mutate(product.id);
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Product Image */}
              <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Image className="w-8 h-8 text-gray-400" />
                )}
              </div>

              {/* Price */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xl font-bold arabic-nums">{product.price} جنيه</span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through mr-2 arabic-nums">
                      {product.originalPrice} جنيه
                    </span>
                  )}
                </div>
                <Badge variant={product.stock && product.stock > 0 ? 'default' : 'destructive'}>
                  {product.stock && product.stock > 0 ? `${product.stock} متوفر` : 'نفذ المخزون'}
                </Badge>
              </div>

              {/* Category & Tags */}
              <div className="space-y-2">
                <Badge variant="outline">{product.category}</Badge>
                <div className="flex flex-wrap gap-1">
                  {product.isDigital && <Badge variant="secondary" className="text-xs">رقمي</Badge>}
                  {product.teacherOnly && <Badge variant="secondary" className="text-xs">للمعلمين</Badge>}
                  {product.vip && <Badge variant="secondary" className="text-xs">VIP</Badge>}
                  {product.featured && <Badge variant="secondary" className="text-xs">مميز</Badge>}
                </div>
              </div>

              {/* Stats */}
              <div className="flex justify-between text-sm text-muted-foreground">
                <span className="flex items-center">
                  <BarChart3 className="w-3 h-3 ml-1" />
                  {product.rating || 0} ⭐
                </span>
                <span className="arabic-nums">{product.ratingCount || 0} تقييم</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">اسم المنتج (عربي) *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingProduct?.name || ''}
                  required
                />
              </div>
              <div>
                <Label htmlFor="nameEn">اسم المنتج (إنجليزي)</Label>
                <Input
                  id="nameEn"
                  name="nameEn"
                  defaultValue={editingProduct?.nameEn || ''}
                />
              </div>
            </div>

            {/* Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description">الوصف (عربي) *</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingProduct?.description || ''}
                  required
                />
              </div>
              <div>
                <Label htmlFor="descriptionEn">الوصف (إنجليزي)</Label>
                <Textarea
                  id="descriptionEn"
                  name="descriptionEn"
                  defaultValue={editingProduct?.descriptionEn || ''}
                />
              </div>
            </div>

            {/* Category & Classification */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">الفئة *</Label>
                <Select name="category" defaultValue={editingProduct?.category || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="books">كتب</SelectItem>
                    <SelectItem value="stationery">قرطاسية</SelectItem>
                    <SelectItem value="digital">منتجات رقمية</SelectItem>
                    <SelectItem value="educational">تعليمية</SelectItem>
                    <SelectItem value="printing">طباعة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="grade">الصف الدراسي</Label>
                <Input
                  id="grade"
                  name="grade"
                  defaultValue={editingProduct?.grade || ''}
                  placeholder="الصف الأول الثانوي"
                />
              </div>
              <div>
                <Label htmlFor="subject">المادة</Label>
                <Input
                  id="subject"
                  name="subject"
                  defaultValue={editingProduct?.subject || ''}
                  placeholder="الرياضيات"
                />
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">السعر *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  defaultValue={editingProduct?.price || ''}
                  required
                />
              </div>
              <div>
                <Label htmlFor="originalPrice">السعر الأصلي</Label>
                <Input
                  id="originalPrice"
                  name="originalPrice"
                  type="number"
                  step="0.01"
                  defaultValue={editingProduct?.originalPrice || ''}
                />
              </div>
              <div>
                <Label htmlFor="stock">المخزون</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  defaultValue={editingProduct?.stock || '0'}
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags">العلامات (مفصولة بفواصل)</Label>
              <Input
                id="tags"
                name="tags"
                defaultValue={editingProduct?.tags?.join(', ') || ''}
                placeholder="جديد, مميز, أكثر مبيعاً"
              />
            </div>

            {/* Flags */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="isDigital"
                  name="isDigital"
                  defaultChecked={editingProduct?.isDigital || false}
                />
                <Label htmlFor="isDigital">منتج رقمي</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="teacherOnly"
                  name="teacherOnly"
                  defaultChecked={editingProduct?.teacherOnly || false}
                />
                <Label htmlFor="teacherOnly">للمعلمين فقط</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="vip"
                  name="vip"
                  defaultChecked={editingProduct?.vip || false}
                />
                <Label htmlFor="vip">VIP</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="featured"
                  name="featured"
                  defaultChecked={editingProduct?.featured || false}
                />
                <Label htmlFor="featured">مميز</Label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 space-x-reverse">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                إلغاء
              </Button>
              <Button 
                type="submit" 
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
              >
                {(createProductMutation.isPending || updateProductMutation.isPending) ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Package className="w-4 h-4 ml-2" />
                    {editingProduct ? 'تحديث المنتج' : 'إضافة المنتج'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}