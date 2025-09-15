import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { smartPDFPreview } from '@/lib/pdf-tools';
import { useState, useEffect } from 'react';

export interface NewCartItem {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  googleDriveFileId?: string;
  pages: number;
  
  // Print options
  paperSize: string;
  paperType: string;
  printType: string;
  isBlackWhite: boolean;
  quantity: number;
  
  // Pricing
  unitPrice: string;
  totalPrice: string;
  
  // Preview and metadata
  previewUrl?: string;
  metadata?: any;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface NewCart {
  items: NewCartItem[];
  totalQuantity: number;
  subtotal: number;
  currency: string;
}

export function useNewCart() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [previewCache, setPreviewCache] = useState<Record<string, string>>({});

  // Get new cart data
  const { data: cart, isLoading } = useQuery<NewCart>({
    queryKey: ['/api/new-cart'],
    staleTime: 1000 * 30, // 30 seconds for fresh data
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Generate previews for cart items
  useEffect(() => {
    if (cart?.items) {
      cart.items.forEach(async (item) => {
        if (!item.previewUrl && !previewCache[item.id]) {
          try {
            const fileSource = item.googleDriveFileId 
              ? { url: item.fileUrl, name: item.fileName, fileId: item.googleDriveFileId }
              : item.fileUrl;

            const previewResult = await smartPDFPreview(fileSource);
            
            if (previewResult.success && previewResult.previewUrl) {
              setPreviewCache(prev => ({
                ...prev,
                [item.id]: previewResult.previewUrl!
              }));
            }
          } catch (error) {
            console.error(`Failed to generate preview for ${item.fileName}:`, error);
          }
        }
      });
    }
  }, [cart?.items, previewCache]);

  // Add item to new cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (cartItemData: {
      fileName: string;
      fileUrl: string;
      fileType: string;
      googleDriveFileId?: string;
      pages: number;
      paperSize: string;
      paperType: string;
      printType: string;
      isBlackWhite: boolean;
      quantity: number;
      unitPrice: string;
      totalPrice: string;
      previewUrl?: string;
      metadata?: any;
    }) => {
      const response = await apiRequest('POST', '/api/new-cart/items', cartItemData);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/new-cart'] });
      toast({
        title: "تمت الإضافة للسلة",
        description: data.message || "تم إضافة الملف بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ",
        description: error.message || "فشل في إضافة الملف للسلة",
        variant: "destructive",
      });
    },
  });

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      const response = await apiRequest('PUT', `/api/new-cart/items/${itemId}/quantity`, { quantity });
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/new-cart'] });
      toast({
        title: "تم التحديث",
        description: data.message || "تم تحديث الكمية بنجاح",
      });
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
      const response = await apiRequest('DELETE', `/api/new-cart/items/${itemId}`);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/new-cart'] });
      // Remove from preview cache
      setPreviewCache(prev => {
        const newCache = { ...prev };
        delete newCache[data.itemId];
        return newCache;
      });
      toast({
        title: "تم الحذف",
        description: data.message || "تم حذف المنتج من السلة",
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
      const response = await apiRequest('DELETE', '/api/new-cart/clear');
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/new-cart'] });
      setPreviewCache({});
      toast({
        title: "تم تفريغ السلة",
        description: data.message || "تم حذف جميع المنتجات من السلة",
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
    }) => {
      const response = await apiRequest('POST', '/api/new-cart/checkout', checkoutData);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/new-cart'] });
      setPreviewCache({});
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

  // Helper function to get preview URL for an item
  const getPreviewUrl = (item: NewCartItem): string | undefined => {
    return item.previewUrl || previewCache[item.id];
  };

  // Helper function to get file type icon
  const getFileTypeIcon = (fileType: string) => {
    if (fileType.toLowerCase().includes('pdf')) return '📄';
    if (fileType.toLowerCase().includes('image') || ['jpg', 'jpeg', 'png', 'gif'].includes(fileType.toLowerCase())) return '🖼️';
    return '📁';
  };

  return {
    cart: cart || { items: [], totalQuantity: 0, subtotal: 0, currency: 'جنيه' },
    isLoading,
    
    // Helper functions
    getPreviewUrl,
    getFileTypeIcon,
    
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
    
    // Error states
    addToCartError: addToCartMutation.error,
    updateQuantityError: updateQuantityMutation.error,
    removeItemError: removeItemMutation.error,
    clearCartError: clearCartMutation.error,
    checkoutError: checkoutMutation.error,
  };
}