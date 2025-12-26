import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Package, Clock, Truck, Calendar, ShoppingCart } from 'lucide-react';

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
}

interface ProductDetailsModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onAddToCart: (product: Product) => void;
    isAddingToCart?: boolean;
}

export function ProductDetailsModal({
    product,
    isOpen,
    onClose,
    onAddToCart,
    isAddingToCart = false
}: ProductDetailsModalProps) {
    if (!product) return null;

    const hasDiscount = product.originalPrice && parseFloat(product.originalPrice) > parseFloat(product.price);
    const discountPercent = hasDiscount
        ? Math.round(((parseFloat(product.originalPrice!) - parseFloat(product.price)) / parseFloat(product.originalPrice!)) * 100)
        : 0;

    const isReservation = product.deliveryType === 'reservation';
    const isSameDay = product.deliveryType === 'same_day' || !product.deliveryType;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{product.name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Product Image */}
                    {product.imageUrl && (
                        <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-contain"
                            />
                            {product.featured && (
                                <Badge className="absolute top-3 left-3 bg-yellow-500">
                                    <Star className="w-3 h-3 mr-1" />
                                    مميز
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* Price Section */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-primary">{product.price} جنيه</span>
                            {hasDiscount && (
                                <>
                                    <span className="text-lg text-gray-400 line-through">{product.originalPrice} جنيه</span>
                                    <Badge variant="destructive" className="text-sm">
                                        خصم {discountPercent}%
                                    </Badge>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Rating */}
                    {product.rating && parseFloat(product.rating) > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-4 h-4 ${i < Math.floor(parseFloat(product.rating!))
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-gray-300'
                                            }`}
                                    />
                                ))}
                            </div>
                            <span className="text-sm text-gray-600">
                                ({product.ratingCount || 0} تقييم)
                            </span>
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <h3 className="font-semibold text-lg mb-2">الوصف</h3>
                        <p className="text-gray-700 leading-relaxed">{product.description}</p>
                    </div>

                    {/* Product Info Grid */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        {product.category && (
                            <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-500" />
                                <div>
                                    <p className="text-xs text-gray-500">الفئة</p>
                                    <p className="font-medium">{product.category}</p>
                                </div>
                            </div>
                        )}

                        {product.curriculumType && (
                            <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-500" />
                                <div>
                                    <p className="text-xs text-gray-500">نوع المنهج</p>
                                    <p className="font-medium">{product.curriculumType}</p>
                                </div>
                            </div>
                        )}

                        {product.grade && (
                            <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-500" />
                                <div>
                                    <p className="text-xs text-gray-500">المرحلة الدراسية</p>
                                    <p className="font-medium">{product.grade}</p>
                                </div>
                            </div>
                        )}

                        {product.subject && (
                            <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-500" />
                                <div>
                                    <p className="text-xs text-gray-500">المادة</p>
                                    <p className="font-medium">{product.subject}</p>
                                </div>
                            </div>
                        )}

                        {product.authorPublisher && (
                            <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-500" />
                                <div>
                                    <p className="text-xs text-gray-500">المؤلف/الناشر</p>
                                    <p className="font-medium">{product.authorPublisher}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Delivery Type Section */}
                    <div className="border-t pt-4">
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <Truck className="w-5 h-5" />
                            طريقة التوصيل
                        </h3>

                        {isSameDay && (
                            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-green-800 mb-1">شحن في نفس اليوم</h4>
                                    <p className="text-sm text-green-700">
                                        سيتم توصيل المنتج في نفس يوم الطلب خلال ساعات العمل
                                    </p>
                                </div>
                            </div>
                        )}

                        {isReservation && (
                            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-semibold text-blue-800 mb-1">بالحجز - الاستلام بعد مدة</h4>
                                    <p className="text-sm text-blue-700 mb-2">
                                        هذا المنتج متاح بالحجز المسبق
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                            <Clock className="w-3 h-3 mr-1" />
                                            مدة الانتظار: {product.reservationDays || 7} يوم
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-blue-600 mt-2">
                                        سيتم إشعارك عندما يكون المنتج جاهز للتوصيل
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tags */}
                    {product.tags && product.tags.length > 0 && (
                        <div>
                            <h3 className="font-semibold text-sm mb-2">الكلمات المفتاحية</h3>
                            <div className="flex flex-wrap gap-2">
                                {product.tags.map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add to Cart Button */}
                    <div className="flex gap-3 pt-4 border-t">
                        <Button
                            onClick={() => onAddToCart(product)}
                            disabled={isAddingToCart || (product.availableCopies !== undefined && product.availableCopies <= 0)}
                            className="flex-1 h-12 text-lg"
                            size="lg"
                        >
                            <ShoppingCart className="w-5 h-5 ml-2" />
                            {isAddingToCart ? 'جاري الإضافة...' : 'إضافة للسلة'}
                        </Button>
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="h-12"
                            size="lg"
                        >
                            إغلاق
                        </Button>
                    </div>

                    {product.availableCopies !== undefined && product.availableCopies <= 0 && (
                        <p className="text-center text-red-600 text-sm">
                            عذراً، هذا المنتج غير متوفر حالياً
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
