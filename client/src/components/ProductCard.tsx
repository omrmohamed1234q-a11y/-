import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart, Plus, Star, BookOpen, FileText } from 'lucide-react';
import { useProgress } from '@/contexts/ProgressContext';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  originalPrice?: string;
  imageUrl?: string;
  category: string;
  rating?: string;
  ratingCount?: number;
  featured?: boolean;
  gradeLevel?: string;
  subject?: string;
  stock?: number;
}

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export default function ProductCard({ product, compact = false }: ProductCardProps) {
  const { addToCart, isAddingToCart } = useCart();
  const [imageError, setImageError] = useState(false);
  const { progress } = useProgress();

  const handleAddToCart = () => {
    addToCart({ productId: product.id, quantity: 1 });
  };

  const discount = product.originalPrice && product.price
    ? Math.round(((parseFloat(product.originalPrice) - parseFloat(product.price)) / parseFloat(product.originalPrice)) * 100)
    : 0;

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;

  return (
    <Card className={`group hover:shadow-lg transition-all duration-200 ${compact ? 'h-full' : ''}`} data-testid={`product-card-${product.id}`}>
      <CardContent className="p-4">
        {/* Product Image */}
        <div className="relative mb-4 aspect-square overflow-hidden rounded-lg bg-gray-100">
          {product.imageUrl && !imageError ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              onError={() => setImageError(true)}
              data-testid={`product-image-${product.id}`}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
              <BookOpen className="h-12 w-12 text-gray-400" />
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.featured && (
              <Badge variant="secondary" className="bg-yellow-500 text-white">
                مميز
              </Badge>
            )}
            {discount > 0 && (
              <Badge variant="destructive" className="bg-red-500 text-white">
                خصم {discount}%
              </Badge>
            )}
          </div>

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Badge variant="secondary" className="bg-gray-800 text-white">
                نفدت الكمية
              </Badge>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <h3 
            className="font-semibold text-gray-900 line-clamp-2 leading-tight"
            data-testid={`product-name-${product.id}`}
          >
            {product.name}
          </h3>
          
          {!compact && (
            <p 
              className="text-sm text-gray-600 line-clamp-2"
              data-testid={`product-description-${product.id}`}
            >
              {product.description}
            </p>
          )}

          {/* Grade and Subject */}
          {(product.gradeLevel || product.subject) && (
            <div className="flex flex-wrap gap-1">
              {product.gradeLevel && (
                <Badge variant="outline" className="text-xs">
                  <FileText className="w-3 h-3 ml-1" />
                  {product.gradeLevel}
                </Badge>
              )}
              {product.subject && (
                <Badge variant="outline" className="text-xs">
                  {product.subject}
                </Badge>
              )}
            </div>
          )}

          {/* Rating */}
          {product.rating && parseFloat(product.rating) > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium" data-testid={`product-rating-${product.id}`}>
                {parseFloat(product.rating).toFixed(1)}
              </span>
              {product.ratingCount && (
                <span className="text-xs text-gray-500">
                  ({product.ratingCount})
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span 
                className="text-lg font-bold text-green-600"
                data-testid={`product-price-${product.id}`}
              >
                <span className="currency-display">
                  <span className="arabic-nums">{parseFloat(product.price).toFixed(0)}</span> جنيه
                </span>
              </span>
              {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                <span className="text-sm text-gray-500 line-through">
                  <span className="currency-display">
                    <span className="arabic-nums">{parseFloat(product.originalPrice).toFixed(0)}</span> جنيه
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button 
          onClick={handleAddToCart}
          disabled={isAddingToCart || isOutOfStock}
          className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
          data-testid={`button-add-to-cart-${product.id}`}
        >
          {isAddingToCart ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {progress.isActive && progress.currentStep?.message ? progress.currentStep.message : 'جاري الإضافة...'}
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              {isOutOfStock ? 'نفدت الكمية' : 'إضافة للسلة'}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}