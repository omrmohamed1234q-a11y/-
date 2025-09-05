import { useAuth } from '@/hooks/use-auth';
import { Bell, ShoppingCart, User } from 'lucide-react';
import { LogoPresets } from '@/components/AnimatedLogo';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import CartDrawer from '@/components/cart/CartDrawer';
import { NotificationCenter } from '@/components/NotificationCenter';
import { useNotifications } from '@/hooks/useNotifications';

export default function Header() {
  const { user } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Fetch real cart data for cart count
  const { data: cartData } = useQuery({
    queryKey: ['/api/cart'],
    retry: false,
    enabled: !!user
  });

  // Use the notifications hook
  const { unreadCount } = useNotifications();

  const cartItemsCount = (cartData as any)?.items?.length || 0;

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
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative p-1.5"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                data-testid="button-notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center p-0 arabic-nums"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            
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

      {/* Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
      />

      {/* Notification Center */}
      <NotificationCenter 
        isOpen={isNotificationOpen} 
        onClose={() => setIsNotificationOpen(false)} 
      />
    </>
  );
}