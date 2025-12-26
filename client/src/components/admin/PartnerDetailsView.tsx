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
import { CartConflictModal } from '@/components/CartConflictModal';
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
  Edit,
  X,
  Info,
  Wallet,
  ChevronRight
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
  quantity?: number;
  inStock: boolean;
  unit?: string;
  tags?: string[];
  featured?: boolean;
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
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState<any>(null);
  const [pendingProduct, setPendingProduct] = useState<PartnerProduct | null>(null);
  const [showRatingsModal, setShowRatingsModal] = useState(false);

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
      console.log('🚀 Sending add to cart request:', { productId, partnerId: partner.id, quantity });
      const response = await apiRequest('POST', '/api/cart/add-partner-product', {
        productId,
        partnerId: partner.id,
        quantity,
      });
      console.log('✅ Add to cart response:', response);
      return response;
    },
    onSuccess: (data: any) => {
      if (data?.conflict) {
        // Handle cart conflict
        setConflictData(data);
        setShowConflictModal(true);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
      toast({
        title: "تمت الإضافة للسلة",
        description: data?.message || "تم إضافة المنتج من الشريك بنجاح",
      });
    },
    onError: (error: any) => {
      // Check if this is a 409 conflict error
      if (error?.message?.includes('409:')) {
        try {
          // Parse the conflict data from error message
          const conflictMatch = error.message.match(/409: ({.*})/);
          if (conflictMatch) {
            const conflictData = JSON.parse(conflictMatch[1]);
            if (conflictData.conflict && conflictData.requiresClearCart) {
              console.log('⚠️ Cart conflict detected, showing modal...');
              setConflictData(conflictData);
              setShowConflictModal(true);
              return;
            }
          }
        } catch (parseError) {
          console.error('Failed to parse conflict data:', parseError);
        }
      }

      // Generic error handling
      toast({
        title: "خطأ في الإضافة",
        description: error.message || "فشل في إضافة المنتج للسلة",
        variant: "destructive",
      });
    },
  });

  // Clear and switch mutation
  const clearAndSwitchMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: {
      productId: string;
      quantity?: number;
    }) => {
      const response = await apiRequest('POST', '/api/cart/clear-and-switch', {
        newSource: 'partner',
        partnerId: partner.id,
        productId,
        quantity,
      });
      return response;
    },
    onSuccess: (data: any) => {
      setShowConflictModal(false);
      setPendingProduct(null);
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
      toast({
        title: "تمت الإضافة",
        description: data?.message || "تم تفريغ السلة وإضافة المنتج الجديد",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تبديل السلة",
        variant: "destructive",
      });
    },
  });

  const handleAddToCart = (product: PartnerProduct) => {
    console.log('🛒 handleAddToCart called with product:', product);
    console.log('🛒 Product inStock:', product.inStock);
    console.log('🛒 Product quantity:', product.quantity);
    console.log('🛒 Mutation pending:', addToCartMutation.isPending);

    setPendingProduct(product);
    addToCartMutation.mutate({ productId: product.id, quantity: 1 });
  };

  const handleClearAndAdd = () => {
    if (pendingProduct) {
      clearAndSwitchMutation.mutate({ productId: pendingProduct.id, quantity: 1 });
    }
  };

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
    if (!product.inStock) {
      return <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">نفد</Badge>;
    }
    if (product.quantity && product.quantity <= 0) {
      return <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">نفد</Badge>;
    }
    if (product.quantity && product.quantity <= 5) {
      return <Badge variant="outline" className="text-orange-600 text-[10px] px-1.5 py-0 h-4 border-orange-300">قليل</Badge>;
    }
    return <Badge variant="secondary" className="text-green-700 bg-green-50 text-[10px] px-1.5 py-0 h-4">متوفر</Badge>;
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
    <div className="w-full bg-gray-50">
      {/* Cover Image Header - Talabat Style */}
      <div className="relative h-64 bg-gradient-to-br from-blue-600 to-indigo-700 overflow-hidden">
        {partner.coverImageUrl ? (
          <>
            <img
              src={partner.coverImageUrl}
              alt={partner.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700" />
        )}

        {/* Back Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-900 rounded-full shadow-lg backdrop-blur-sm"
          onClick={() => {
            onClose();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Partner Logo - Bottom Right */}
        {partner.logoUrl && (
          <div className="absolute bottom-4 right-4 w-20 h-20 bg-white rounded-2xl shadow-xl p-2">
            <img
              src={partner.logoUrl}
              alt={`${partner.name} Logo`}
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Floating Info Card - Talabat Style */}
      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-10">
        <Card className="bg-white rounded-2xl shadow-xl border-0 overflow-hidden">
          <CardContent className="p-6">
            {/* Partner Name */}
            <div className="mb-3">
              <h1 className="text-2xl font-bold text-gray-900">{partner.name}</h1>
            </div>

            {/* Rating & Quick Stats - Clickable */}
            <div className="flex items-center gap-3 mb-4">
              {/* Rating - Clickable */}
              <button
                onClick={() => setShowRatingsModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-base font-semibold text-gray-900">
                  {partner.rating ? Number(partner.rating).toFixed(1) : '0.0'}
                </span>
                <span className="text-sm text-gray-500">({partner.reviewCount || 0})</span>
                <ChevronRight className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </button>

              <div className="h-4 w-px bg-gray-200" />

              {/* Delivery Time */}
              <div className="flex items-center gap-1.5 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">30-45 د</span>
              </div>

              {partner.hasDelivery && (
                <>
                  <div className="h-4 w-px bg-gray-200" />
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Truck className="w-4 h-4" />
                    <span className="text-sm">{partner.deliveryFee || 0} ج</span>
                  </div>
                </>
              )}
            </div>

            {/* Description */}
            {partner.shortDescription && (
              <p className="text-sm text-gray-600 mb-4 pb-4 border-b border-gray-100">
                {partner.shortDescription}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                  <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className={viewMode === 'grid'
                ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
                : "space-y-2"
              }>
                {filteredProducts.map((product) => (
                  <Card key={product.id} className={`group hover:shadow-md transition-all duration-200 border-gray-200 ${viewMode === 'list' ? 'flex flex-row h-24' : 'flex flex-col'
                    }`}>
                    {viewMode === 'grid' ? (
                      <>
                        {/* Grid View - Compact */}
                        <div className="relative w-full h-24 bg-gray-50 rounded-t-lg overflow-hidden">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                              <Package className="h-8 w-8 text-gray-300" />
                            </div>
                          )}
                          <div className="absolute top-1 left-1">
                            {getProductStatusBadge(product)}
                          </div>
                        </div>

                        <CardContent className="p-2 flex flex-col justify-between flex-1">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-xs line-clamp-2 leading-tight text-gray-900">
                              {product.name}
                            </h3>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 w-fit">
                              {getCategoryLabel(product.category)}
                            </Badge>
                          </div>

                          <div className="mt-2 space-y-1.5">
                            <div className="flex items-baseline justify-between">
                              <span className="text-base font-bold text-blue-600">
                                {product.price} ج
                              </span>
                              {product.quantity && (
                                <span className="text-[10px] text-gray-500">
                                  {product.quantity} {product.unit || 'قطعة'}
                                </span>
                              )}
                            </div>

                            <Button
                              size="sm"
                              className="w-full h-7 text-xs"
                              data-testid={`button-add-cart-${product.id}`}
                              onClick={() => handleAddToCart(product)}
                              disabled={addToCartMutation.isPending || clearAndSwitchMutation.isPending || !product.inStock}
                            >
                              <ShoppingCart className="h-3 w-3 ml-1" />
                              {(addToCartMutation.isPending || clearAndSwitchMutation.isPending) ? 'جاري...' :
                                !product.inStock ? 'غير متوفر' : 'إضافة'}
                            </Button>
                          </div>
                        </CardContent>
                      </>
                    ) : (
                      <>
                        {/* List View - Horizontal */}
                        <div className="relative w-20 h-24 bg-gray-50 flex-shrink-0 rounded-r-lg overflow-hidden">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                              <Package className="h-6 w-6 text-gray-300" />
                            </div>
                          )}
                        </div>

                        <CardContent className="p-2 flex-1 flex items-center justify-between">
                          <div className="flex-1 min-w-0 ml-2">
                            <h3 className="font-semibold text-xs line-clamp-1 text-gray-900 mb-1">
                              {product.name}
                            </h3>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                {getCategoryLabel(product.category)}
                              </Badge>
                              {getProductStatusBadge(product)}
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-bold text-blue-600">
                                {product.price} ج
                              </span>
                              {product.quantity && (
                                <span className="text-[10px] text-gray-500">
                                  {product.quantity} {product.unit || 'قطعة'}
                                </span>
                              )}
                            </div>
                          </div>

                          <Button
                            size="sm"
                            className="h-8 px-3 text-xs flex-shrink-0"
                            data-testid={`button-add-cart-${product.id}`}
                            onClick={() => handleAddToCart(product)}
                            disabled={addToCartMutation.isPending || clearAndSwitchMutation.isPending || !product.inStock}
                          >
                            <ShoppingCart className="h-3 w-3 ml-1" />
                            {(addToCartMutation.isPending || clearAndSwitchMutation.isPending) ? 'جاري...' :
                              !product.inStock ? 'غير متوفر' : 'إضافة'}
                          </Button>
                        </CardContent>
                      </>
                    )}
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

          {/* Ratings Modal */}
          {showRatingsModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">التقييمات والمراجعات</h2>
                    <button
                      onClick={() => setShowRatingsModal(false)}
                      className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Overall Rating */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900 mb-1">
                        {partner.rating ? Number(partner.rating).toFixed(1) : '0.0'}
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= Math.round(Number(partner.rating || 0))
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                              }`}
                          />
                        ))}
                      </div>
                      <div className="text-sm text-gray-500">
                        {partner.reviewCount || 0} تقييم
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="text-sm text-gray-600 mb-2">
                        قريباً: سنعرض جميع التقييمات والمراجعات هنا
                      </div>
                      <div className="text-xs text-gray-500">
                        يمكنك تقييم الشريك بعد استلام طلبك
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reviews List - Placeholder */}
                <div className="p-6 overflow-y-auto max-h-96">
                  <div className="text-center py-12">
                    <Star className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 mb-2">لا توجد تقييمات بعد</p>
                    <p className="text-sm text-gray-400">كن أول من يقيّم هذا الشريك!</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cart Conflict Modal */}
          {showConflictModal && conflictData && pendingProduct && (
            <CartConflictModal
              isOpen={showConflictModal}
              onClose={() => {
                setShowConflictModal(false);
                setPendingProduct(null);
              }}
              conflictType={conflictData.conflictType}
              currentSource={conflictData.currentSource}
              currentPartner={conflictData.currentPartner}
              newItem={{
                source: 'partner',
                partnerName: partner.name,
                productName: pendingProduct.name
              }}
              onClearAndAdd={handleClearAndAdd}
              isLoading={clearAndSwitchMutation.isPending}
            />
          )}
        </Tabs>
      </div>
    </div>
  );
}