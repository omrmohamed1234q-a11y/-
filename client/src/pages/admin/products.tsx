import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
          <Card key={product.id} className="relative hover:shadow-lg transition-shadow">
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
                    <div className="flex flex-wrap gap-1">
                      {getProductTypesLabels(product.productTypes).map((type, index) => (
                        <Badge key={index} variant="outline" className="text-xs bg-blue-50">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-1 space-x-reverse">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingProduct(product);
                      setDialogOpen(true);
                    }}
                    data-testid={`button-edit-product-${product.id}`}
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
                    data-testid={`button-delete-product-${product.id}`}
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