import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import Header from '@/components/layout/header';
import BottomNav from '@/components/layout/bottom-nav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string | null;
  imageUrl?: string | null;
  category: string;
  rating?: string;
  ratingCount?: number;
  featured?: boolean;
  isDigital?: boolean;
  grade?: string | null;
  subject?: string | null;
  availableCopies?: number;
  tags?: string[] | null;
  createdAt?: string;
}

const categories = [
  {
    id: 'teachers',
    name: 'كتب المعلمين',
    icon: 'fas fa-chalkboard-teacher',
    color: 'from-blue-50 to-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'students',
    name: 'كتب الطلاب',
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
  {
    id: 'tools',
    name: 'أدوات مدرسية',
    icon: 'fas fa-pencil-ruler',
    color: 'from-red-50 to-red-100',
    iconColor: 'text-red-600',
  },
];

export default function Store() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [priceRange, setPriceRange] = useState<string>('all');

  // Fetch products
  const { data: allProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/admin/products'],
  });

  // Filter and sort products
  const products = useMemo(() => {
    let filtered = [...(allProducts as Product[])];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.subject && product.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.grade && product.grade.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(product => {
        switch (selectedCategory) {
          case 'teachers':
            return product.teacherOnly || product.category.includes('teacher');
          case 'students':
            return !product.teacherOnly && product.category.includes('student');
          case 'supplies':
            return product.category === 'supplies' || product.category === 'stationery';
          case 'digital':
            return product.isDigital;
          case 'tools':
            return product.category === 'tools' || product.category === 'equipment';
          default:
            return true;
        }
      });
    }

    // Price range filter
    if (priceRange && priceRange !== 'all') {
      filtered = filtered.filter(product => {
        const price = parseFloat(product.price);
        switch (priceRange) {
          case 'under-50':
            return price < 50;
          case '50-100':
            return price >= 50 && price <= 100;
          case '100-200':
            return price >= 100 && price <= 200;
          case 'over-200':
            return price > 200;
          default:
            return true;
        }
      });
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'featured':
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return 0;
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'price_low':
          return parseFloat(a.price) - parseFloat(b.price);
        case 'price_high':
          return parseFloat(b.price) - parseFloat(a.price);
        case 'rating':
          return parseFloat(b.rating || '0') - parseFloat(a.rating || '0');
        default:
          return 0;
      }
    });

    return filtered;
  }, [allProducts, searchQuery, selectedCategory, priceRange, sortBy]);

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      // Use our Express API instead of Supabase direct access
      const response = await apiRequest('POST', '/api/cart/add', {
        productId,
        quantity
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast({
        title: 'تمت الإضافة بنجاح',
        description: 'تم إضافة المنتج إلى السلة',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ في الإضافة',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(selectedCategory === category ? '' : category);
  };

  const handleAddToCart = (productId: string) => {
    addToCartMutation.mutate({ productId });
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return (
      <div className="flex text-yellow-400 text-xs">
        {[...Array(fullStars)].map((_, i) => (
          <i key={i} className="fas fa-star"></i>
        ))}
        {hasHalfStar && <i className="fas fa-star-half-alt"></i>}
        {[...Array(5 - Math.ceil(rating))].map((_, i) => (
          <i key={i} className="far fa-star"></i>
        ))}
      </div>
    );
  };

  const formatPrice = (price: string) => {
    return parseFloat(price).toLocaleString('ar-EG');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="w-full h-40 bg-muted animate-pulse"></div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                    <div className="h-3 bg-muted rounded animate-pulse w-3/4"></div>
                    <div className="h-6 bg-muted rounded animate-pulse w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">متجر اطبعلي</h1>
          <p className="text-muted-foreground">تسوق من أفضل المنتجات التعليمية ومستلزمات الطباعة</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="ابحث عن منتج..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="ترتيب حسب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">المميزة</SelectItem>
                    <SelectItem value="newest">الأحدث</SelectItem>
                    <SelectItem value="price_low">السعر: من الأقل للأعلى</SelectItem>
                    <SelectItem value="price_high">السعر: من الأعلى للأقل</SelectItem>
                    <SelectItem value="rating">الأعلى تقييماً</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="فلترة بالسعر" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأسعار</SelectItem>
                    <SelectItem value="under-50">أقل من 50 جنيه</SelectItem>
                    <SelectItem value="50-100">50 - 100 جنيه</SelectItem>
                    <SelectItem value="100-200">100 - 200 جنيه</SelectItem>
                    <SelectItem value="over-200">أكثر من 200 جنيه</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryFilter(category.id)}
                  className="flex items-center space-x-2 space-x-reverse"
                >
                  <i className={`${category.icon} text-sm`}></i>
                  <span>{category.name}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-muted-foreground">
            {isLoading ? 'جاري التحميل...' : `تم العثور على ${products.length} منتج`}
            {searchQuery && ` عن "${searchQuery}"`}
          </p>
          {(searchQuery || selectedCategory || (priceRange && priceRange !== 'all')) && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                setPriceRange('all');
              }}
              className="text-sm"
            >
              مسح الفلاتر
            </Button>
          )}
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <i className="fas fa-search text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold mb-2">لا توجد منتجات</h3>
              <p className="text-muted-foreground">جرب تعديل معايير البحث أو الفلترة</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product: Product) => (
              <Card key={product.id} className="overflow-hidden hover-lift border">
                <img
                  src={product.imageUrl || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250'}
                  alt={product.name}
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250`;
                  }}
                />
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {product.featured && (
                        <Badge className="bg-accent text-white">مميز</Badge>
                      )}
                      {product.isDigital && (
                        <Badge className="bg-purple-100 text-purple-600">رقمي</Badge>
                      )}
                      {(product.availableCopies || 0) === 0 && (
                        <Badge variant="destructive">نفدت الكمية</Badge>
                      )}
                    </div>
                    {product.rating && renderStars(parseFloat(product.rating))}
                  </div>
                  
                  <h3 className="font-bold text-sm mb-1 line-clamp-2">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  
                  {product.grade && (
                    <div className="flex items-center text-xs text-muted-foreground mb-2">
                      <i className="fas fa-graduation-cap ml-1"></i>
                      <span>{product.grade}</span>
                      {product.subject && <span> • {product.subject}</span>}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className="text-lg font-bold text-accent arabic-nums">
                        {formatPrice(product.price)} جنيه
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through arabic-nums">
                          {formatPrice(product.originalPrice)} جنيه
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="bg-accent hover:bg-accent/90 text-white"
                      onClick={() => handleAddToCart(product.id)}
                      disabled={(product.availableCopies || 0) === 0 || addToCartMutation.isPending}
                    >
                      {product.isDigital ? (
                        <>
                          <i className="fas fa-download ml-1"></i>
                          تحميل فوري
                        </>
                      ) : (
                        <>
                          <i className="fas fa-cart-plus ml-1"></i>
                          أضف للسلة
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span className="arabic-nums">{product.ratingCount || 0} تقييم</span>
                    {!product.isDigital && (product.availableCopies || 0) > 0 && (
                      <span className="text-green-600">متوفر</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
}
