import { useAuth } from '@/hooks/use-auth';
import { Bell, ShoppingCart, User } from 'lucide-react';
import { LogoPresets } from '@/components/AnimatedLogo';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import CartDrawer from '@/components/cart/CartDrawer';
import NotificationCenter from '@/components/NotificationCenter';

export default function Header() {
  const { user } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Fetch real cart data for cart count
  const { data: cartData } = useQuery({
    queryKey: ['/api/cart'],
    retry: false,
    enabled: !!user
  });

  // Fetch active orders to show tracking badge
  const { data: ordersData } = useQuery({
    queryKey: ['/api/orders'],
    retry: false,
    enabled: !!user,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const cartItemsCount = (cartData as any)?.totalQuantity || 0;

  // Check if there's an active order (not delivered/cancelled)
  const activeOrders = (ordersData as any[])?.filter((order: any) =>
    !['delivered', 'cancelled', 'completed'].includes(order.status)
  ) || [];
  const hasActiveOrder = activeOrders.length > 0;

  return (
    <>
      <header className="bg-white shadow-paper sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and App Name */}
            <Link href="/">
              <div className="flex items-center space-x-2 space-x-reverse hover:opacity-80 transition-opacity">
                <LogoPresets.Navigation />
                <div>
                  <h1 className="text-lg font-bold text-primary">اطبعلي</h1>
                  <p className="text-xs text-muted-foreground">منصة الطباعة الذكية</p>
                </div>
              </div>
            </Link>

            {/* Navigation Icons */}
            <div className="flex items-center space-x-3 space-x-reverse">
              <Button
                variant="ghost"
                size="sm"
                className="relative p-1.5"
                onClick={() => setIsCartOpen(true)}
                data-testid="button-open-cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemsCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -left-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center p-0 arabic-nums"
                  >
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>

              {/* Active Order Tracking Badge */}
              {hasActiveOrder && (
                <Link href="/orders">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium rounded-full transition-all"
                    data-testid="button-track-order"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      تتبع طلبك
                    </span>
                  </Button>
                </Link>
              )}

              {/* Replace old notification system with new NotificationCenter */}
              <NotificationCenter />

              <Link href="/profile">
                <Button variant="ghost" size="sm" className="p-2">
                  {user ? (
                    <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-accent">
                        {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Cart Drawer - unified single cart system */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      {/* Notification Center - Now implemented with full smart targeting */}
    </>
  );
}