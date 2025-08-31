import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LogoPresets } from '@/components/AnimatedLogo';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Settings,
  BarChart3,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  Printer,
  Gift,
  MessageCircle,
  Eye,
  Plus,
  Search,
  Filter,
  Bell,
  TrendingUp,
  Activity,
  Calendar,
  UserCheck,
  Truck,
  User,
  LogOut,
  ChevronDown,
  Monitor
} from 'lucide-react';

interface AdminStats {
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  avgBasket: number;
  conversionRate: number;
  onTimeDeliveryRate: number;
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  ordersByStatus: {
    pending: number;
    processing: number;
    printing: number;
    out_for_delivery: number;
    delivered: number;
    cancelled: number;
  };
  voucherUsage: {
    totalVouchers: number;
    usedVouchers: number;
    totalDiscount: number;
  };
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/dashboard/stats']
  });

  const [currentTime] = useState(new Date());

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل الخروج بنجاح",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      });
    }
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 18) return 'مساء الخير';
    return 'مساء الخير';
  };

  // Quick Actions for Workers
  const quickActions = [
    {
      title: 'الطلبات الجديدة',
      description: 'عرض ومعالجة الطلبات الواردة',
      icon: ShoppingCart,
      link: '/admin/orders',
      color: 'red',
      count: stats?.ordersByStatus.pending || 0,
      urgent: true
    },
    {
      title: 'إدارة المنتجات',
      description: 'إضافة وتحرير المنتجات',
      icon: Package,
      link: '/admin/products',
      color: 'blue',
      count: 0
    },
    {
      title: 'إدارة العملاء',
      description: 'عرض وإدارة حسابات العملاء',
      icon: Users,
      link: '/admin/users',
      color: 'green',
      count: 0
    },
    {
      title: 'الكوبونات والعروض',
      description: 'إنشاء وإدارة العروض',
      icon: Gift,
      link: '/admin/coupons',
      color: 'purple',
      count: 0
    },
    {
      title: 'الاستفسارات',
      description: 'الرد على استفسارات العملاء',
      icon: MessageCircle,
      link: '/admin/inquiries',
      color: 'orange',
      count: 0
    },
    {
      title: 'إدارة الإعلانات',
      description: 'إنشاء وتحرير إعلانات الصفحة الرئيسية',
      icon: Monitor,
      link: '/admin/announcements',
      color: 'indigo',
      count: 0
    },
    {
      title: 'إدارة الكباتن',
      description: 'إدارة طاقم التوصيل وتتبع الأداء',
      icon: Truck,
      link: '/admin/drivers',
      color: 'cyan',
      count: 0
    },
    {
      title: 'التقارير والإحصائيات',
      description: 'مراجعة الأداء والتقارير',
      icon: BarChart3,
      link: '/admin/reports',
      color: 'indigo',
      count: 0
    }
  ];

  // Status overview for workers
  const statusOverview = [
    {
      title: 'طلبات اليوم',
      value: stats?.todayOrders || 0,
      icon: Calendar,
      color: 'blue',
      description: 'طلبات جديدة اليوم'
    },
    {
      title: 'قيد المعالجة',
      value: (stats?.ordersByStatus.processing || 0) + (stats?.ordersByStatus.printing || 0),
      icon: Activity,
      color: 'yellow',
      description: 'طلبات تحتاج متابعة'
    },
    {
      title: 'تم التسليم',
      value: stats?.ordersByStatus.delivered || 0,
      icon: CheckCircle2,
      color: 'green',
      description: 'طلبات مكتملة اليوم'
    },
    {
      title: 'العملاء النشطون',
      value: 0,
      icon: UserCheck,
      color: 'purple',
      description: 'عملاء تفاعلوا اليوم'
    }
  ];

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <LogoPresets.Hero />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {getGreeting()}، مدير اطبعلي! 👋
              </h1>
              <p className="text-lg text-gray-600">
                {currentTime.toLocaleDateString('ar-EG', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="lg" className="gap-2">
              <Bell className="w-5 h-5" />
              التنبيهات
              {(stats?.ordersByStatus.pending || 0) > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {stats?.ordersByStatus.pending}
                </Badge>
              )}
            </Button>
            
            {/* Admin Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="lg" className="gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      إ
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline">إدارة الحساب</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" dir="rtl">
                <DropdownMenuItem 
                  onClick={() => navigate('/admin/profile')}
                  className="gap-2 cursor-pointer"
                  data-testid="menu-admin-profile"
                >
                  <User className="w-4 h-4" />
                  الملف الشخصي
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate('/admin/settings')}
                  className="gap-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  الإعدادات
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
                  data-testid="menu-logout"
                >
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statusOverview.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    item.color === 'blue' ? 'bg-blue-100' :
                    item.color === 'yellow' ? 'bg-yellow-100' :
                    item.color === 'green' ? 'bg-green-100' :
                    'bg-purple-100'
                  }`}>
                    <item.icon className={`w-6 h-6 ${
                      item.color === 'blue' ? 'text-blue-600' :
                      item.color === 'yellow' ? 'text-yellow-600' :
                      item.color === 'green' ? 'text-green-600' :
                      'text-purple-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">{item.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions - Large Cards for Easy Access */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">الإجراءات السريعة</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link href={action.link}>
                <Card className="h-40 cursor-pointer hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                  {action.urgent && action.count > 0 && (
                    <div className="absolute top-3 left-3 z-10">
                      <Badge variant="destructive" className="animate-pulse">
                        عاجل! {action.count}
                      </Badge>
                    </div>
                  )}
                  
                  <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity ${
                    action.color === 'red' ? 'from-red-500 to-red-700' :
                    action.color === 'blue' ? 'from-blue-500 to-blue-700' :
                    action.color === 'green' ? 'from-green-500 to-green-700' :
                    action.color === 'purple' ? 'from-purple-500 to-purple-700' :
                    action.color === 'orange' ? 'from-orange-500 to-orange-700' :
                    'from-indigo-500 to-indigo-700'
                  }`} />
                  
                  <CardContent className="p-6 h-full flex flex-col justify-between relative z-10">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        action.color === 'red' ? 'bg-red-100' :
                        action.color === 'blue' ? 'bg-blue-100' :
                        action.color === 'green' ? 'bg-green-100' :
                        action.color === 'purple' ? 'bg-purple-100' :
                        action.color === 'orange' ? 'bg-orange-100' :
                        'bg-indigo-100'
                      }`}>
                        <action.icon className={`w-8 h-8 ${
                          action.color === 'red' ? 'text-red-600' :
                          action.color === 'blue' ? 'text-blue-600' :
                          action.color === 'green' ? 'text-green-600' :
                          action.color === 'purple' ? 'text-purple-600' :
                          action.color === 'orange' ? 'text-orange-600' :
                          'text-indigo-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-gray-800">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <Button variant="ghost" size="sm" className="p-0 h-auto font-semibold text-blue-600 hover:text-blue-700">
                        افتح الآن ←
                      </Button>
                      {action.count > 0 && (
                        <Badge variant="secondary" className="bg-gray-100">
                          {action.count} عنصر
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Today's Priority Tasks */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="bg-white rounded-2xl shadow-sm p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">مهام اليوم الأساسية</h2>
          <Button variant="outline" size="sm" className="gap-2">
            <Eye className="w-4 h-4" />
            عرض الكل
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Priority Tasks */}
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
                <span className="font-semibold text-red-700">عاجل</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">
                طلبات في انتظار المعالجة
              </h3>
              <p className="text-2xl font-bold text-red-600 mb-2">
                {stats?.ordersByStatus.pending || 0}
              </p>
              <p className="text-sm text-gray-600">طلب يحتاج مراجعة فورية</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
                <span className="font-semibold text-yellow-700">قيد التنفيذ</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">
                طلبات قيد الطباعة
              </h3>
              <p className="text-2xl font-bold text-yellow-600 mb-2">
                {stats?.ordersByStatus.printing || 0}
              </p>
              <p className="text-sm text-gray-600">طلب في مرحلة الطباعة</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <span className="font-semibold text-green-700">إنجازات اليوم</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">
                إجمالي الإيرادات
              </h3>
              <p className="text-2xl font-bold text-green-600 mb-2">
                {stats?.totalRevenue || 0} جنيه
              </p>
              <p className="text-sm text-gray-600">إيرادات ممتازة اليوم</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.1 }}
        className="mt-8 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-blue-900 mb-1">
              هل تحتاج مساعدة؟
            </h3>
            <p className="text-blue-700">
              تواصل مع فريق الدعم الفني أو راجع دليل استخدام النظام
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-50">
              دليل الاستخدام
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              تواصل معنا
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}