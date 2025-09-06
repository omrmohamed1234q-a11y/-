import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Star, 
  MapPin, 
  Phone, 
  Clock, 
  Truck, 
  CreditCard, 
  Search,
  Grid3X3,
  List,
  Filter,
  Package,
  ShoppingCart,
  Eye,
  Edit
} from 'lucide-react';
import type { Partner } from '@shared/schema';

// Type for partner product (from partner_products table)
interface PartnerProduct {
  id: string;
  partnerId: string;
  name: string;
  description: string;
  category: string;
  price: string;
  imageUrl?: string;
  stock?: number;
  isAvailable: boolean;
  specifications?: Record<string, any>;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface PartnerDetailsViewProps {
  partner: Partner;
  onClose: () => void;
}

export function PartnerDetailsView({ partner, onClose }: PartnerDetailsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: [`/api/partners/${partner.id}/products`],
    retry: false,
  });

  const partnerProducts = (products as PartnerProduct[] || []);

  // Add to cart mutation for partner products
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: {
      productId: string;
      quantity?: number;
    }) => {
      const response = await apiRequest('POST', '/api/cart/add-partner-product', {
        productId,
        partnerId: partner.id,
        quantity,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
      toast({
        title: "تمت الإضافة للسلة",
        description: "تم إضافة المنتج من الشريك بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الإضافة",
        description: error.message || "فشل في إضافة المنتج للسلة",
        variant: "destructive",
      });
    },
  });

  // فلترة المنتجات
  const filteredProducts = partnerProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           (product.category && product.category === selectedCategory);
    return matchesSearch && matchesCategory;
  });

  // الحصول على الفئات المتاحة (تصفية الفئات الفارغة)
  const categories = Array.from(new Set(
    partnerProducts
      .map(p => p.category)
      .filter(category => category && category.trim() !== '')
  ));

  const getProductStatusBadge = (product: PartnerProduct) => {
    if (!product.isAvailable) {
      return <Badge variant="destructive">غير متوفر</Badge>;
    }
    if (product.stock && product.stock <= 5) {
      return <Badge variant="outline" className="text-orange-600">مخزون قليل</Badge>;
    }
    return <Badge variant="secondary" className="text-green-600">متوفر</Badge>;
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      books: 'كتب',
      stationery: 'أدوات مكتبية',
      printing: 'خدمات طباعة',
      binding: 'تجليد',
      educational: 'مواد تعليمية',
    };
    return categories[category] || category;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      {/* Header - Partner Cover */}
      <div className="relative">
        <div 
          className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg relative overflow-hidden"
          style={{
            backgroundImage: partner.coverImageUrl ? `url(${partner.coverImageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40" />
          <div className="absolute bottom-2 left-4 text-white">
            <h1 className="text-xl font-bold">{partner.name}</h1>
            <p className="text-sm opacity-90 line-clamp-1">{partner.shortDescription}</p>
          </div>
          <Button 
            variant="outline" 
            className="absolute top-2 right-2 bg-white text-black h-8 px-3"
            onClick={onClose}
          >
            إغلاق
          </Button>
        </div>
      </div>

      {/* Partner Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Star className="h-6 w-6 mx-auto mb-1 text-yellow-500" />
            <div className="text-lg font-bold">{partner.rating}</div>
            <div className="text-xs text-gray-600">({partner.reviewCount} تقييم)</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 text-center">
            <Clock className="h-6 w-6 mx-auto mb-1 text-blue-500" />
            <div className="text-sm font-bold">30-45 دقيقة</div>
            <div className="text-xs text-gray-600">وقت التحضير</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 text-center">
            <Truck className="h-6 w-6 mx-auto mb-1 text-green-500" />
            <div className="text-sm font-bold">
              {partner.hasDelivery ? `${partner.deliveryFee} ج` : 'غير متوفر'}
            </div>
            <div className="text-xs text-gray-600">رسوم التوصيل</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 text-center">
            <Package className="h-6 w-6 mx-auto mb-1 text-purple-500" />
            <div className="text-sm font-bold">{partnerProducts.length}</div>
            <div className="text-xs text-gray-600">منتج متاح</div>
          </CardContent>
        </Card>
      </div>

      {/* Partner Details */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="products">المنتجات ({partnerProducts.length})</TabsTrigger>
          <TabsTrigger value="info">معلومات الشريك</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-3">
          {/* Products Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ابحث في المنتجات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9"
                  data-testid="input-search-products"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40 h-9" data-testid="select-category">
                <SelectValue placeholder="اختر الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {getCategoryLabel(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setViewMode('grid')}
                data-testid="button-grid-view"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => setViewMode('list')}
                data-testid="button-list-view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Products Grid/List */}
          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "space-y-3"
            }>
              {filteredProducts.map((product) => (
                <Card key={product.id} className={`group hover:shadow-md transition-shadow ${
                  viewMode === 'list' ? 'flex flex-row' : 'flex flex-col h-full'
                }`}>
                  <div className={viewMode === 'list' ? 'w-24 h-24 flex-shrink-0' : 'aspect-square'}>
                    <div 
                      className="w-full h-full bg-gray-200 rounded-t-lg bg-cover bg-center relative"
                      style={{
                        backgroundImage: product.imageUrl ? `url(${product.imageUrl})` : undefined
                      }}
                    >
                      {!product.imageUrl && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute top-1 right-1">
                        {getProductStatusBadge(product)}
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className={`p-3 ${viewMode === 'list' ? 'flex-1' : 'flex-1 flex flex-col justify-between'}`}>
                    <div className="space-y-2">
                      <div className={viewMode === 'list' ? 'flex justify-between items-start' : ''}>
                        <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                        {viewMode === 'list' && (
                          <Badge variant="outline" className="text-xs ml-2">
                            {getCategoryLabel(product.category)}
                          </Badge>
                        )}
                      </div>
                      
                      {viewMode === 'grid' && (
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(product.category)}
                        </Badge>
                      )}
                      
                      <p className="text-gray-600 text-xs line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                    
                    <div className={`mt-3 ${viewMode === 'list' ? 'flex justify-between items-center' : 'space-y-2'}`}>
                      <div>
                        <span className="text-lg font-bold text-primary">
                          {product.price} ج
                        </span>
                        {product.stock && (
                          <div className="text-xs text-gray-500">
                            متوفر: {product.stock}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 w-full">
                        <Button size="sm" variant="outline" className="h-9 px-3 flex-1" data-testid={`button-view-${product.id}`}>
                          <Eye className="h-4 w-4 ml-1" />
                          عرض
                        </Button>
                        <Button 
                          size="sm" 
                          className="h-9 px-3 flex-1" 
                          data-testid={`button-add-cart-${product.id}`}
                          onClick={() => addToCartMutation.mutate({ productId: product.id })}
                          disabled={addToCartMutation.isPending || !product.isAvailable}
                        >
                          <ShoppingCart className="h-4 w-4 ml-1" />
                          {addToCartMutation.isPending ? 'جاري...' : 'إضافة'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredProducts.length === 0 && !productsLoading && (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">لا توجد منتجات</h3>
              <p className="text-gray-600">لم يتم العثور على منتجات تطابق البحث</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="info" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>معلومات الاتصال</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-blue-500" />
                  <span>{partner.phone || 'غير محدد'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-red-500" />
                  <div>
                    <div>{partner.address}</div>
                    <div className="text-sm text-gray-600">{partner.city}, {partner.governorate}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>خدمات الشريك</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {partner.services?.map((service, index) => (
                    <Badge key={index} variant="secondary">
                      {service}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>التخصصات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {partner.specialties?.map((specialty, index) => (
                    <Badge key={index} variant="outline">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>معلومات التوصيل</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-green-500" />
                  <span>
                    {partner.hasDelivery ? `متاح - ${partner.deliveryFee} جنيه` : 'غير متاح'}
                  </span>
                </div>
                {partner.hasDelivery && (
                  <div className="text-sm text-gray-600">
                    الحد الأدنى للطلب: {partner.minOrderForDelivery} جنيه
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-purple-500" />
                  <span>
                    {partner.acceptsOnlinePayment ? 'يقبل الدفع الإلكتروني' : 'الدفع عند الاستلام فقط'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>وصف الشريك</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {partner.description}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}