import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    X,
    ShoppingCart as CartIcon,
    Plus,
    Minus,
    Trash2,
    Package,
    ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CartItem {
    id: string;
    productId: string;
    productName: string;
    productImage?: string;
    price: string;
    quantity: number;
    partnerId?: string;
    partnerName?: string;
}

interface ShoppingCartProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ShoppingCart({ isOpen, onClose }: ShoppingCartProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: cartData, isLoading } = useQuery({
        queryKey: ['/api/cart'],
        enabled: isOpen,
    });

    const cartItems = (cartData?.items || []) as CartItem[];
    const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

    const updateQuantityMutation = useMutation({
        mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
            apiRequest('PUT', `/api/cart/items/${itemId}`, { quantity }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
            queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
        },
        onError: () => {
            toast({
                title: "خطأ",
                description: "فشل تحديث الكمية",
                variant: "destructive"
            });
        }
    });

    const removeItemMutation = useMutation({
        mutationFn: (itemId: string) =>
            apiRequest('DELETE', `/api/cart/items/${itemId}`, undefined),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
            queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
            toast({ title: "تم الحذف", description: "تم حذف المنتج من السلة" });
        },
        onError: () => {
            toast({
                title: "خطأ",
                description: "فشل حذف المنتج",
                variant: "destructive"
            });
        },
    });

    const clearCartMutation = useMutation({
        mutationFn: () => apiRequest('DELETE', '/api/cart/clear', undefined),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
            queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
            toast({ title: "تم التفريغ", description: "تم تفريغ السلة بنجاح" });
        },
        onError: () => {
            toast({
                title: "خطأ",
                description: "فشل تفريغ السلة",
                variant: "destructive"
            });
        },
    });

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 h-full w-full md:w-96 bg-white shadow-2xl z-50 flex flex-col"
                    >
                        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
                            <div className="flex items-center justify-between text-white">
                                <div className="flex items-center gap-2">
                                    <CartIcon className="h-5 w-5" />
                                    <h2 className="text-lg font-bold">سلة التسوق</h2>
                                    {cartItems.length > 0 && (
                                        <Badge variant="secondary" className="bg-white text-blue-600">
                                            {cartItems.length}
                                        </Badge>
                                    )}
                                </div>
                                <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20 h-8 w-8 p-0">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 p-4">
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
                                    ))}
                                </div>
                            ) : cartItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                                    <Package className="h-16 w-16 text-gray-300 mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-600 mb-2">السلة فارغة</h3>
                                    <p className="text-sm text-gray-500 mb-4">ابدأ بإضافة منتجات من الشركاء</p>
                                    <Button onClick={onClose} variant="outline" size="sm">
                                        <ArrowLeft className="h-4 w-4 ml-2" />
                                        تصفح المنتجات
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {cartItems.map((item) => (
                                        <Card key={item.id} className="border-gray-200">
                                            <CardContent className="p-3">
                                                <div className="flex gap-3">
                                                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                        {item.productImage ? (
                                                            <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Package className="h-6 w-6 text-gray-300" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-sm line-clamp-1 text-gray-900 mb-1">{item.productName}</h4>
                                                        {item.partnerName && <p className="text-xs text-gray-500 mb-1">من: {item.partnerName}</p>}
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-bold text-blue-600">{parseFloat(item.price).toFixed(2)} ج</span>
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0"
                                                                    onClick={() => updateQuantityMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                                                                    disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                                                                >
                                                                    <Minus className="h-3 w-3" />
                                                                </Button>
                                                                <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0"
                                                                    onClick={() => updateQuantityMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                                                                    disabled={updateQuantityMutation.isPending}
                                                                >
                                                                    <Plus className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                    onClick={() => removeItemMutation.mutate(item.id)}
                                                                    disabled={removeItemMutation.isPending}
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}

                                    {cartItems.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => confirm('هل أنت متأكد من تفريغ السلة؟') && clearCartMutation.mutate()}
                                            disabled={clearCartMutation.isPending}
                                        >
                                            <Trash2 className="h-4 w-4 ml-2" />
                                            تفريغ السلة
                                        </Button>
                                    )}
                                </div>
                            )}
                        </ScrollArea>

                        {cartItems.length > 0 && (
                            <div className="p-4 border-t border-gray-200 bg-gray-50">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">المجموع الفرعي</span>
                                        <span className="text-lg font-bold text-gray-900">{subtotal.toFixed(2)} ج</span>
                                    </div>
                                    <Separator />
                                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-11" onClick={() => window.location.href = '/checkout'}>
                                        إتمام الطلب
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                    </Button>
                                    <p className="text-xs text-center text-gray-500">سيتم حساب رسوم التوصيل عند الدفع</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
