import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Ticket,
  Gift,
  Settings,
  GraduationCap,
  Users,
  BarChart3,
  Menu,
  X,
  LogOut,
  Store,
  BookOpen,
  Building2,
  Shield,
  Smartphone,
  HardDrive,
  FileText,
  ScrollText,
  Lock,
  Zap
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'لوحة التحكم', href: '/admin', icon: LayoutDashboard },
  { name: 'المتجر', href: '/admin/store', icon: Store },
  { name: 'المنتجات', href: '/admin/products', icon: Package },
  { name: 'الطلبات', href: '/admin/orders', icon: ShoppingCart },
  { name: 'الشركاء', href: '/admin/partners', icon: Building2 },
  { name: 'ركن المعلم', href: '/admin/teachers-corner', icon: BookOpen },
  { name: 'الكوبونات', href: '/admin/vouchers', icon: Ticket },
  { name: 'المكافآت', href: '/admin/rewards', icon: Gift },
  { name: 'المواد التعليمية', href: '/admin/teacher-materials', icon: GraduationCap },
  { name: 'المستخدمين', href: '/admin/users', icon: Users },
  { name: '📢 الإشعارات التلقائية', href: '/admin/automatic-notifications', icon: Zap },
  { name: 'الشروط والأحكام', href: '/admin/terms-management', icon: FileText },
  { name: 'سياسة الخصوصية', href: '/admin/privacy-policy-management', icon: Lock },
  { name: 'التحليلات', href: '/admin/reports', icon: BarChart3 },
  { name: 'الأمان', href: '/admin/security-dashboard', icon: Shield },
  { name: 'إدارة المساحة', href: '/admin/storage-dashboard', icon: HardDrive },
  { name: 'المصادقة الثنائية', href: '/admin/two-factor-settings', icon: Smartphone },
  { name: 'الإعدادات', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">غير مصرح</h1>
          <p className="text-gray-600 mb-4">يجب أن تكون مدير للوصول إلى هذه الصفحة</p>
          <Link href="/">
            <Button>العودة للرئيسية</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100" dir="rtl">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="text-xl font-bold text-primary">إدارة اطبعلي</h1>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href || 
                             (item.href !== '/admin' && location.startsWith(item.href));
              
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    className={`w-full justify-start text-right ${
                      isActive ? 'bg-primary text-primary-foreground' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="w-5 h-5 ml-3" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User info and logout */}
        <div className="absolute bottom-0 w-full p-4 border-t">
          <div className="flex items-center space-x-3 space-x-reverse mb-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-foreground">
                {user.fullName?.charAt(0) || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.fullName || 'المدير'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
          <Link href="/api/logout">
            <Button variant="outline" className="w-full justify-start">
              <LogOut className="w-4 h-4 ml-2" />
              تسجيل الخروج
            </Button>
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">إدارة اطبعلي</h1>
          <div></div> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}