import { useAuth } from '@/hooks/use-auth';
import { Bell, ShoppingCart, User } from 'lucide-react';
import { LogoPresets } from '@/components/AnimatedLogo';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import CartDrawer from '@/components/cart/CartDrawer';

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

  // Fetch real notifications
  const { data: notifications } = useQuery({
    queryKey: ['/api/notifications'],
    retry: false,
    enabled: !!user
  });

  const cartItemsCount = (cartData as any)?.items?.length || 0;
  const unreadNotifications = (notifications as any[])?.filter((n: any) => !n.read)?.length || 0;

  return (
    <>
      <header className="bg-white shadow-paper sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and App Name */}
            <Link href="/">
              <div className="flex items-center space-x-3 space-x-reverse hover:opacity-80 transition-opacity">
                <LogoPresets.Navigation />
                <div>
                  <h1 className="text-xl font-bold text-primary">اطبعلي</h1>
                  <p className="text-xs text-muted-foreground">منصة الطباعة الذكية</p>
                </div>
              </div>
            </Link>
            
            {/* Navigation Icons */}
            <div className="flex items-center space-x-4 space-x-reverse">
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative p-2"
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
                className="relative p-2"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                data-testid="button-notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -top-1 -left-1 bg-warning text-white text-xs rounded-full w-5 h-5 flex items-center justify-center p-0 arabic-nums"
                  >
                    {unreadNotifications}
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

      {/* Notification Panel */}
      {isNotificationOpen && (
        <div className="fixed top-16 left-4 w-80 bg-white rounded-lg shadow-lg border z-50 p-4" dir="rtl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">الإشعارات</h3>
            <button 
              onClick={() => setIsNotificationOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="space-y-3">
            {(notifications as any[]) && (notifications as any[]).length > 0 ? (
              (notifications as any[]).map((notification: any) => (
                <div 
                  key={notification.id} 
                  className={`p-3 rounded-lg ${
                    notification.type === 'order' ? 'bg-blue-50' : 
                    notification.type === 'delivery' ? 'bg-green-50' : 
                    notification.type === 'print' ? 'bg-orange-50' : 'bg-gray-50'
                  }`}
                >
                  <p className={`text-sm ${
                    notification.type === 'order' ? 'text-blue-800' : 
                    notification.type === 'delivery' ? 'text-green-800' : 
                    notification.type === 'print' ? 'text-orange-800' : 'text-gray-800'
                  }`}>
                    {notification.message}
                  </p>
                  <p className={`text-xs mt-1 ${
                    notification.type === 'order' ? 'text-blue-600' : 
                    notification.type === 'delivery' ? 'text-green-600' : 
                    notification.type === 'print' ? 'text-orange-600' : 'text-gray-600'
                  }`}>
                    {notification.createdAt && new Date(notification.createdAt).toLocaleString('ar-EG')}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-gray-500">
                <p className="text-sm">لا توجد إشعارات جديدة</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}