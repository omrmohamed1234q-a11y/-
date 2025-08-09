import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  rating: number;
  ratingCount: number;
  featured: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
}

// Mock products data - replace with Supabase data
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'كتاب الرياضيات - الصف الثالث الثانوي',
    description: 'منهج محدث وفقاً لوزارة التربية والتعليم',
    price: 120,
    originalPrice: 150,
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    category: 'كتب الطلاب',
    rating: 4.2,
    ratingCount: 45,
    featured: true,
    isNew: true,
  },
  {
    id: '2',
    name: 'ورق طباعة فاخر A4',
    description: '٥٠٠ ورقة • جودة عالية • مقاوم للحبر',
    price: 85,
    imageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    category: 'مستلزمات الطباعة',
    rating: 5.0,
    ratingCount: 128,
    featured: true,
    isBestseller: true,
  },
  {
    id: '3',
    name: 'مجموعة قوالب الطلاب',
    description: 'جداول دراسية • منظمات • أوراق ملاحظات',
    price: 45,
    originalPrice: 60,
    imageUrl: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=250',
    category: 'تحميلات رقمية',
    rating: 4.7,
    ratingCount: 89,
    featured: true,
  },
];

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

export default function MarketplaceSection() {
  const handleCategoryClick = (categoryId: string) => {
    // TODO: Navigate to category page or filter products
    console.log('Category clicked:', categoryId);
  };

  const handleAddToCart = (productId: string) => {
    // TODO: Add to cart via Supabase
    console.log('Add to cart:', productId);
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

  return (
    <section className="max-w-6xl mx-auto px-4 py-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center">
              <i className="fas fa-store text-accent ml-2"></i>
              متجر اطبعلي
            </h2>
            <Button variant="link" className="text-accent p-0">
              عرض الكل
              <i className="fas fa-chevron-left mr-1 rtl-flip"></i>
            </Button>
          </div>
          
          {/* Categories */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`p-4 bg-gradient-to-br ${category.color} rounded-lg text-center hover-lift transition-transform`}
              >
                <i className={`${category.icon} ${category.iconColor} text-2xl mb-2`}></i>
                <p className="text-sm font-medium">{category.name}</p>
              </button>
            ))}
          </div>
          
          {/* Featured Products */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover-lift border">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-40 object-cover"
                />
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    {product.isNew && (
                      <Badge className="bg-success text-white">جديد</Badge>
                    )}
                    {product.isBestseller && (
                      <Badge className="bg-accent text-white">الأكثر مبيعاً</Badge>
                    )}
                    {!product.isNew && !product.isBestseller && (
                      <div></div>
                    )}
                    {renderStars(product.rating)}
                  </div>
                  <h3 className="font-bold text-sm mb-1 line-clamp-2">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className="text-lg font-bold text-accent arabic-nums">
                        {product.price} جنيه
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through arabic-nums">
                          {product.originalPrice} جنيه
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="bg-accent hover:bg-accent/90 text-white"
                      onClick={() => handleAddToCart(product.id)}
                    >
                      <i className="fas fa-cart-plus ml-1"></i>
                      أضف للسلة
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
