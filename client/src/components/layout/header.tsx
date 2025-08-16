import { useAuth } from '@/hooks/use-auth';
import { Bell, ShoppingCart, User } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-paper sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and App Name */}
          <Link href="/">
            <div className="flex items-center space-x-3 space-x-reverse hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                <i className="fas fa-print text-white text-lg"></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">اطبعلي</h1>
                <p className="text-xs text-muted-foreground">منصة الطباعة الذكية</p>
              </div>
            </div>
          </Link>
          
          {/* Navigation Icons */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <Button variant="ghost" size="sm" className="relative p-2">
              <ShoppingCart className="w-5 h-5" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -left-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center p-0 arabic-nums"
              >
                3
              </Badge>
            </Button>
            
            <Button variant="ghost" size="sm" className="relative p-2">
              <Bell className="w-5 h-5" />
              <Badge 
                variant="secondary" 
                className="absolute -top-1 -left-1 bg-warning text-white text-xs rounded-full w-5 h-5 flex items-center justify-center p-0 arabic-nums"
              >
                2
              </Badge>
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
  );
}
