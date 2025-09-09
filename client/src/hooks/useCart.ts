import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price: string;
  quantity: number;
  variant?: {
    size?: string;
    color?: string;
  };
}

export interface Cart {
  items: CartItem[];
  totalQuantity: number;
  subtotal: number;
  currency: string;
}

export function useCart() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get cart data
  const { data: cart, isLoading } = useQuery<Cart>({
    queryKey: ['/api/cart'],
    staleTime: 1000 * 30, // 30 seconds for fresh data
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Get cart count
  const { data: cartCount } = useQuery<{ count: number }>({
    queryKey: ['/api/cart/count'],
    staleTime: 1000 * 30, // 30 seconds for fresh data
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1, variant }: {
      productId: string;
      quantity?: number;
      variant?: any;
    }) => {
      const response = await apiRequest('POST', '/api/cart/add', {
        productId,
        quantity,
        variant,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
      toast({
        title: "تمت الإضافة للسلة",
        description: "تم إضافة المنتج بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة المنتج للسلة",
        variant: "destructive",
      });
    },
  });

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const response = await apiRequest('PUT', `/api/cart/items/${itemId}`, { quantity });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تحديث الكمية",
        variant: "destructive",
      });
    },
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest('DELETE', `/api/cart/items/${itemId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
      toast({
        title: "تم الحذف",
        description: "تم حذف المنتج من السلة",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في حذف المنتج",
        variant: "destructive",
      });
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/cart/clear');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
      toast({
        title: "تم تفريغ السلة",
        description: "تم حذف جميع المنتجات من السلة",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في تفريغ السلة",
        variant: "destructive",
      });
    },
  });

  // Checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: async (checkoutData: {
      deliveryAddress: string;
      deliveryMethod?: string;
      paymentMethod?: string;
      notes?: string;
      usePoints?: boolean;
    }) => {
      const response = await apiRequest('POST', '/api/checkout', checkoutData);
      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cart/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "تم إنشاء الطلب",
        description: `تم إنشاء طلبك رقم ${data.orderNumber || data.order?.orderNumber} بنجاح`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إنشاء الطلب",
        variant: "destructive",
      });
    },
  });

  return {
    cart,
    cartCount: cartCount?.count || 0,
    isLoading,
    
    // Actions
    addToCart: addToCartMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    removeItem: removeItemMutation.mutate,
    clearCart: clearCartMutation.mutate,
    checkout: checkoutMutation.mutate,
    
    // States
    isAddingToCart: addToCartMutation.isPending,
    isUpdatingQuantity: updateQuantityMutation.isPending,
    isRemovingItem: removeItemMutation.isPending,
    isClearingCart: clearCartMutation.isPending,
    isCheckingOut: checkoutMutation.isPending,
  };
}