import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/hooks/useCart';
import Header from '@/components/layout/header';
import BottomNav from '@/components/layout/bottom-nav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, Star, Clock, Heart, Tag, Sparkles } from 'lucide-react';
import { ProductDetailsModal } from '@/components/ProductDetailsModal';

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
    deliveryType?: string;
    reservationDays?: number;
    curriculumType?: string | null;
    authorPublisher?: string | null;
    createdAt?: string;
}

export default function Store() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { addToCart, isAddingToCart } = useCart();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<string>('all');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [showProductModal, setShowProductModal] = useState(false);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

    const { data: allProducts = [], isLoading } = useQuery<Product[]>({
        queryKey: ['/api/products'],
    });

    const products = useMemo(() => {
        let filtered = [...(allProducts as Product[])];

        if (searchQuery.trim()) {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedFilter === 'books') {
            filtered = filtered.filter(p =>
                p.category.includes('book') || p.category.includes('teacher') || p.category.includes('student')
            );
        } else if (selectedFilter === 'featured') {
            filtered = filtered.filter(p => p.featured);
        } else if (selectedFilter === 'offers') {
            filtered = filtered.filter(p =>
                p.originalPrice && parseFloat(p.originalPrice) > parseFloat(p.price)
            );
        }

        filtered.sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return 0;
        });

        return filtered;
    }, [allProducts, searchQuery, selectedFilter]);

    const handleProductClick = (product: Product) => {
        setSelectedProduct(product);
        setShowProductModal(true);
    };

    const toggleFavorite = (productId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setFavorites(prev => {
            const newFavorites = new Set(prev);
            if (newFavorites.has(productId)) {
                newFavorites.delete(productId);
                toast({
                    title: 'تمت الإزالة',
                    description: 'تم إزالة المنتج من المفضلة',
                });
            } else {
                newFavorites.add(productId);
                toast({
                    title: 'تمت الإضافة',
                    description: 'تم إضافة المنتج للمفضلة',
                });
            }
            return newFavorites;
        });
    };

    const handleAddToCart = async (product: Product) => {
        try {
            await addToCart({
                productId: product.id,
                quantity: 1,
            });
            toast({
                title: 'تمت الإضافة',
                description: `تم إضافة ${product.name} إلى السلة`,
            });
            setShowProductModal(false);
        } catch (error) {
            toast({
                title: 'خطأ',
                description: 'فشل في إضافة المنتج للسلة',
                variant: 'destructive',
            });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-20">
                <Header />
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="h-10 bg-gray-200 rounded-lg animate-pulse mb-3"></div>
                    <div className="h-12 bg-gray-200 rounded-xl animate-pulse mb-4"></div>
                    <div className="flex gap-2 mb-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                        ))}
                    </div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-28 bg-gray-200 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                </div>
                <BottomNav />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <Header />

            <main className="max-w-4xl mx-auto px-4 py-4">


                <div className="mb-4">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            placeholder="ابحث عن منتج..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pr-10 h-11 rounded-xl border-gray-200 bg-white"
                        />
                    </div>
                </div>

                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                    <Button
                        variant={selectedFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedFilter('all')}
                        className="rounded-full whitespace-nowrap h-9 px-4"
                    >
                        الكل
                    </Button>
                    <Button
                        variant={selectedFilter === 'featured' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedFilter('featured')}
                        className="rounded-full whitespace-nowrap h-9 px-4"
                    >
                        <Sparkles className="w-3.5 h-3.5 ml-1" />
                        مميز
                    </Button>
                    <Button
                        variant={selectedFilter === 'offers' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedFilter('offers')}
                        className="rounded-full whitespace-nowrap h-9 px-4"
                    >
                        <Tag className="w-3.5 h-3.5 ml-1" />
                        عروض
                    </Button>
                    <Button
                        variant={selectedFilter === 'books' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedFilter('books')}
                        className="rounded-full whitespace-nowrap h-9 px-4"
                    >
                        كتب
                    </Button>
                </div>

                {products.length > 0 && (
                    <div className="mb-3">
                        <h2 className="text-base font-bold text-gray-900">
                            {selectedFilter === 'featured' ? 'المنتجات المميزة' :
                                selectedFilter === 'offers' ? 'العروض الحالية' :
                                    selectedFilter === 'books' ? 'الكتب المتاحة' :
                                        'جميع المنتجات'}
                        </h2>
                        <p className="text-xs text-gray-500">{products.length} منتج متاح</p>
                    </div>
                )}

                {products.length === 0 ? (
                    <Card className="mt-8">
                        <CardContent className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد منتجات</h3>
                            <p className="text-gray-600 mb-4">جرب البحث بكلمات أخرى</p>
                            <Button onClick={() => {
                                setSearchQuery('');
                                setSelectedFilter('all');
                            }}>مسح البحث</Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {products.map((product: Product) => (
                            <Card
                                key={product.id}
                                className="overflow-hidden hover:shadow-md transition-all duration-200 border-gray-200 cursor-pointer"
                                onClick={() => handleProductClick(product)}
                            >
                                <CardContent className="p-0">
                                    <div className="flex gap-3">
                                        <div className="w-28 h-28 flex-shrink-0 bg-gray-100 relative rounded-l-xl overflow-hidden">
                                            {product.imageUrl ? (
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                                    <div className="w-10 h-10 bg-white/80 rounded-lg"></div>
                                                </div>
                                            )}

                                            <button
                                                className="absolute top-2 left-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full shadow-sm flex items-center justify-center hover:bg-white transition-colors"
                                                onClick={(e) => toggleFavorite(product.id, e)}
                                            >
                                                <Heart
                                                    className={`w-3.5 h-3.5 transition-colors ${favorites.has(product.id)
                                                            ? 'fill-red-500 text-red-500'
                                                            : 'text-gray-600'
                                                        }`}
                                                />
                                            </button>

                                            {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                                                <div className="absolute bottom-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                                                    {Math.round((1 - parseFloat(product.price) / parseFloat(product.originalPrice)) * 100)}%
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 py-2.5 pr-3 min-w-0">
                                            <div className="flex gap-1.5 mb-1.5 flex-wrap">
                                                {product.featured && (
                                                    <Badge className="bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0 font-medium border-0">
                                                        مميز
                                                    </Badge>
                                                )}
                                                {product.isDigital && (
                                                    <Badge className="bg-purple-50 text-purple-700 text-[10px] px-1.5 py-0 font-medium border-0">
                                                        رقمي
                                                    </Badge>
                                                )}
                                            </div>

                                            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 text-sm leading-tight">
                                                {product.name}
                                            </h3>

                                            <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-1.5">
                                                {product.rating && Number(product.rating) > 0 ? (
                                                    <>
                                                        <div className="flex items-center gap-0.5">
                                                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                                            <span className="font-semibold text-gray-900">
                                                                {Number(product.rating).toFixed(1)}
                                                            </span>
                                                        </div>
                                                        <span className="text-gray-400">({product.ratingCount}+)</span>
                                                        <span className="text-gray-400">•</span>
                                                    </>
                                                ) : null}
                                                <div className="flex items-center gap-0.5">
                                                    <Clock className="w-3 h-3" />
                                                    <span>15-30 دقيقة</span>
                                                </div>
                                                {product.grade && (
                                                    <>
                                                        <span className="text-gray-400">•</span>
                                                        <span>{product.grade}</span>
                                                    </>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900 text-base">
                                                    {parseFloat(product.price).toLocaleString('ar-EG')} جنيه
                                                </span>
                                                {product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price) && (
                                                    <span className="text-xs text-gray-400 line-through">
                                                        {parseFloat(product.originalPrice).toLocaleString('ar-EG')}
                                                    </span>
                                                )}
                                            </div>

                                            {product.availableCopies !== undefined && product.availableCopies === 0 && (
                                                <div className="text-[10px] text-red-600 font-medium mt-1">
                                                    غير متوفر حالياً
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            <BottomNav />

            {/* Product Details Modal */}
            <ProductDetailsModal
                product={selectedProduct}
                isOpen={showProductModal}
                onClose={() => setShowProductModal(false)}
                onAddToCart={handleAddToCart}
                isAddingToCart={isAddingToCart}
            />
        </div>
    );
}
