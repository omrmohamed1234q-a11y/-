import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Package, BookOpen, PenTool } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PartnerProduct {
  id: string;
  partnerId: string;
  name: string;
  description: string;
  price: string;
  category: string;
  subcategory?: string;
  imageUrl?: string;
  inStock: boolean;
  quantity: number;
  unit: string;
  tags: string[];
  featured: boolean;
  gradeLevel?: string;
  subject?: string;
  isbn?: string;
  publisher?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PartnerProductsSectionProps {
  partnerId: string;
  partnerName: string;
}

export function PartnerProductsSection({ partnerId, partnerName }: PartnerProductsSectionProps) {
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<PartnerProduct | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    subcategory: '',
    imageUrl: '',
    inStock: true,
    quantity: 0,
    unit: 'قطعة',
    tags: '',
    featured: false,
    gradeLevel: '',
    subject: '',
    isbn: '',
    publisher: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch partner products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['/api/partners', partnerId, 'products'],
    queryFn: () => apiRequest('GET', `/api/partners/${partnerId}/products`)
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (productData: any) =>
      apiRequest('POST', '/api/admin/partner-products', {
        ...productData,
        partnerId,
        tags: productData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partners', partnerId, 'products'] });
      resetForm();
      toast({
        title: "تم الإنشاء بنجاح",
        description: "تم إضافة المنتج بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الإنشاء",
        description: error.message || "فشل في إضافة المنتج",
        variant: "destructive",
      });
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: ({ id, ...productData }: any) =>
      apiRequest('PUT', `/api/admin/partner-products/${id}`, {
        ...productData,
        tags: productData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partners', partnerId, 'products'] });
      resetForm();
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث المنتج بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في التحديث",
        description: error.message || "فشل في تحديث المنتج",
        variant: "destructive",
      });
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/admin/partner-products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/partners', partnerId, 'products'] });
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف المنتج بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "فشل في حذف المنتج",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      subcategory: '',
      imageUrl: '',
      inStock: true,
      quantity: 0,
      unit: 'قطعة',
      tags: '',
      featured: false,
      gradeLevel: '',
      subject: '',
      isbn: '',
      publisher: ''
    });
    setIsAddingProduct(false);
    setEditingProduct(null);
  };

  const handleEdit = (product: PartnerProduct) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      subcategory: product.subcategory || '',
      imageUrl: product.imageUrl || '',
      inStock: product.inStock,
      quantity: product.quantity,
      unit: product.unit,
      tags: product.tags.join(', '),
      featured: product.featured,
      gradeLevel: product.gradeLevel || '',
      subject: product.subject || '',
      isbn: product.isbn || '',
      publisher: product.publisher || ''
    });
    setEditingProduct(product);
    setIsAddingProduct(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      ...formData,
      price: parseFloat(formData.price).toFixed(2),
      quantity: parseInt(formData.quantity.toString()) || 0
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, ...productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      deleteProductMutation.mutate(id);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'كتب مدرسية':
      case 'كتب':
        return <BookOpen className="h-4 w-4" />;
      case 'أدوات مكتبية':
        return <PenTool className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            منتجات الشريك
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">جاري التحميل...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              منتجات {partnerName}
            </CardTitle>
            <CardDescription>
              إدارة المنتجات المتاحة لدى هذا الشريك ({products.length} منتج)
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsAddingProduct(true)}
            className="flex items-center gap-2"
            data-testid="button-add-product"
          >
            <Plus className="h-4 w-4" />
            إضافة منتج
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isAddingProduct && (
          <Card className="border-2 border-dashed border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">
                {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">اسم المنتج *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="أدخل اسم المنتج"
                      required
                      data-testid="input-product-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">السعر (جنيه) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                      required
                      data-testid="input-product-price"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="وصف تفصيلي للمنتج"
                    data-testid="input-product-description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">الفئة *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger data-testid="select-product-category">
                        <SelectValue placeholder="اختر الفئة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="كتب مدرسية">كتب مدرسية</SelectItem>
                        <SelectItem value="أدوات مكتبية">أدوات مكتبية</SelectItem>
                        <SelectItem value="أدوات رسم">أدوات رسم</SelectItem>
                        <SelectItem value="حقائب مدرسية">حقائب مدرسية</SelectItem>
                        <SelectItem value="مراجع">مراجع</SelectItem>
                        <SelectItem value="أخرى">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="subcategory">الفئة الفرعية</Label>
                    <Input
                      id="subcategory"
                      value={formData.subcategory}
                      onChange={(e) => setFormData(prev => ({ ...prev, subcategory: e.target.value }))}
                      placeholder="الفئة الفرعية"
                      data-testid="input-product-subcategory"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="quantity">الكمية المتاحة</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                      data-testid="input-product-quantity"
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit">الوحدة</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                    >
                      <SelectTrigger data-testid="select-product-unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="قطعة">قطعة</SelectItem>
                        <SelectItem value="نسخة">نسخة</SelectItem>
                        <SelectItem value="طقم">طقم</SelectItem>
                        <SelectItem value="علبة">علبة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id="inStock"
                      checked={formData.inStock}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, inStock: checked }))}
                      data-testid="switch-product-in-stock"
                    />
                    <Label htmlFor="inStock">متوفر في المخزن</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="imageUrl">رابط الصورة</Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    data-testid="input-product-image"
                  />
                </div>

                <div>
                  <Label htmlFor="tags">الكلمات المفتاحية</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="رياضيات, ثانوية عامة, مراجعة (فصل بفاصلة)"
                    data-testid="input-product-tags"
                  />
                </div>

                {formData.category === 'كتب مدرسية' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div>
                      <Label htmlFor="gradeLevel">المرحلة الدراسية</Label>
                      <Input
                        id="gradeLevel"
                        value={formData.gradeLevel}
                        onChange={(e) => setFormData(prev => ({ ...prev, gradeLevel: e.target.value }))}
                        placeholder="الصف الثالث الثانوي"
                        data-testid="input-product-grade"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject">المادة</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="الرياضيات"
                        data-testid="input-product-subject"
                      />
                    </div>
                    <div>
                      <Label htmlFor="isbn">رقم ISBN</Label>
                      <Input
                        id="isbn"
                        value={formData.isbn}
                        onChange={(e) => setFormData(prev => ({ ...prev, isbn: e.target.value }))}
                        placeholder="978-123456789"
                        data-testid="input-product-isbn"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                    data-testid="switch-product-featured"
                  />
                  <Label htmlFor="featured">منتج مميز</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={createProductMutation.isPending || updateProductMutation.isPending}
                    data-testid="button-save-product"
                  >
                    {editingProduct ? 'تحديث المنتج' : 'إضافة المنتج'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    data-testid="button-cancel-product"
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {products.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد منتجات لهذا الشريك</p>
            <p className="text-sm">ابدأ بإضافة المنتجات الأولى</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {products.map((product: PartnerProduct) => (
              <Card key={product.id} className="border-l-4 border-l-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1">
                      {product.imageUrl && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            data-testid={`img-product-${product.id}`}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-lg" data-testid={`text-product-name-${product.id}`}>
                            {product.name}
                          </h4>
                          {product.featured && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                              مميز
                            </Badge>
                          )}
                          {!product.inStock && (
                            <Badge variant="destructive">نفد المخزون</Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mb-2" data-testid={`text-product-description-${product.id}`}>
                          {product.description}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {getCategoryIcon(product.category)}
                            <span data-testid={`text-product-category-${product.id}`}>{product.category}</span>
                          </div>
                          <span data-testid={`text-product-price-${product.id}`}>
                            {product.price} جنيه
                          </span>
                          <span data-testid={`text-product-quantity-${product.id}`}>
                            {product.quantity} {product.unit}
                          </span>
                        </div>

                        {product.tags && product.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {product.tags.map((tag, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                                data-testid={`badge-product-tag-${product.id}-${index}`}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(product)}
                        data-testid={`button-edit-product-${product.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-product-${product.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}