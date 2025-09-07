import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/useCart';
import Header from '@/components/layout/header';
import BottomNav from '@/components/layout/bottom-nav';
import ProductCard from '@/components/ProductCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const bookCategories = [
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
    id: 'digital',
    name: 'كتب رقمية',
    icon: 'fas fa-download',
    color: 'from-orange-50 to-orange-100',
    iconColor: 'text-orange-600',
  },
];

const habshetnakCategories = [
  {
    id: 'time-organization',
    name: 'تنظيم الوقت',
    icon: 'fas fa-clock',
    color: 'from-purple-50 to-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    id: 'focus-tools',
    name: 'أدوات التركيز',
    icon: 'fas fa-target',
    color: 'from-red-50 to-red-100',
    iconColor: 'text-red-600',
  },
  {
    id: 'planning',
    name: 'التخطيط والجداول',
    icon: 'fas fa-calendar-alt',
    color: 'from-blue-50 to-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'mind-maps',
    name: 'الخرائط الذهنية',
    icon: 'fas fa-project-diagram',
    color: 'from-green-50 to-green-100',
    iconColor: 'text-green-600',
  },
];

export default function Store() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addToCart, isAddingToCart } = useCart();
  
  const [activeTab, setActiveTab] = useState<string>('books');
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

    // Tab filter (books vs habshetnak)
    filtered = filtered.filter(product => {
      if (activeTab === 'books') {
        return product.category === 'book' || product.category.includes('book') || 
               product.category.includes('teacher') || product.category.includes('student') || 
               product.isDigital;
      } else if (activeTab === 'habshetnak') {
        return product.category === 'habshetnak' || product.category === 'tools' || 
               product.category === 'supplies' || product.category === 'planning';
      }
      return true;
    });

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(product => {
        // Book categories
        if (activeTab === 'books') {
          switch (selectedCategory) {
            case 'teachers':
              return product.teacherOnly || product.category.includes('teacher');
            case 'students':
              return !product.teacherOnly && product.category.includes('student');
            case 'digital':
              return product.isDigital;
            default:
              return true;
          }
        }
        // Habshetnak categories  
        else if (activeTab === 'habshetnak') {
          switch (selectedCategory) {
            case 'time-organization':
              return product.category.includes('time') || product.category.includes('organization');
            case 'focus-tools':
              return product.category.includes('focus') || product.category.includes('concentration');
            case 'planning':
              return product.category.includes('planning') || product.category.includes('schedule');
            case 'mind-maps':
              return product.category.includes('mind-map') || product.category.includes('diagram');
            default:
              return true;
          }
        }
        return true;
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

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(selectedCategory === category ? '' : category);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedCategory(''); // Reset category when switching tabs
  };

  const getCurrentCategories = () => {
    return activeTab === 'books' ? bookCategories : habshetnakCategories;
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
          <p className="text-muted-foreground">تسوق من أفضل الكتب التعليمية وحبشتكنات اطبعلي المميزة</p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="books" className="text-lg font-semibold">
              📚 الكتب
            </TabsTrigger>
            <TabsTrigger value="habshetnak" className="text-lg font-semibold">
              🎯 حبشتكنات اطبعلي
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">

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
              {getCurrentCategories().map((category) => (
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
                {isLoading ? 'جاري التحميل...' : 
                  `تم العثور على ${products.length} ${activeTab === 'books' ? 'كتاب' : 'منتج من حبشتكنات اطبعلي'}`
                }
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
                  <i className={`fas ${activeTab === 'books' ? 'fa-book' : 'fa-lightbulb'} text-4xl text-muted-foreground mb-4`}></i>
                  <h3 className="text-lg font-semibold mb-2">
                    {activeTab === 'books' ? 'لا توجد كتب' : 'لا توجد حبشتكنات'}
                  </h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'books' ? 
                      'جرب البحث عن كتب أخرى أو تعديل الفلاتر' :
                      'جرب البحث عن منتجات أخرى من حبشتكنات اطبعلي'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product: Product) => (
                  <ProductCard
                    key={product.id}
                    product={{
                      id: product.id,
                      name: product.name,
                      description: product.description,
                      price: product.price,
                      originalPrice: product.originalPrice || undefined,
                      imageUrl: product.imageUrl || undefined,
                      category: product.category,
                      rating: product.rating,
                      ratingCount: product.ratingCount,
                      featured: product.featured,
                      gradeLevel: product.grade || undefined,
                      subject: product.subject || undefined,
                      stock: product.availableCopies,
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <BottomNav />
    </div>
  );
}
