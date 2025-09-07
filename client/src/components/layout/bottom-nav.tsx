import { useLocation } from 'wouter';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'الرئيسية', icon: 'fas fa-home' },
  { path: '/print', label: 'طباعة', icon: 'fas fa-print' },
  { path: '/store', label: 'المتجر', icon: 'fas fa-store' },
  { path: '/rewards', label: 'المكافآت', icon: 'fas fa-trophy' },
  { path: '/profile', label: 'الملف الشخصي', icon: 'fas fa-user' },
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border px-3 py-1.5 z-50">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={cn(
                  "flex flex-col items-center py-1.5 px-2 transition-colors",
                  isActive ? "text-accent" : "text-muted-foreground hover:text-accent"
                )}
              >
                <i className={`${item.icon} text-lg mb-0.5`}></i>
                <span className={cn(
                  "text-[10px]",
                  isActive ? "font-medium" : "font-normal"
                )}>
                  {item.label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
