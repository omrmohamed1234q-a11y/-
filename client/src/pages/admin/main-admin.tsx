import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Users, 
  Truck, 
  BarChart3, 
  Settings, 
  FileText, 
  Bell, 
  LogOut,
  Activity,
  Database,
  ShoppingCart,
  Gift,
  Box
} from 'lucide-react';
import { Link } from 'wouter';

export default function MainAdmin() {
  const [adminData, setAdminData] = useState<any>(null);
  // Fetch real stats from API
  const { data: stats = {
    totalUsers: 0,
    activeDrivers: 0,
    totalOrders: 0,
    systemStatus: 'نشط'
  }, isLoading } = useQuery<{
    totalUsers: number;
    activeDrivers: number;
    totalOrders: number;
    systemStatus: string;
  }>({
    queryKey: ['/api/admin/stats'],
  });

  useEffect(() => {
    // Get admin info from localStorage (set during login)
    const adminInfo = localStorage.getItem('adminAuth');
    if (adminInfo) {
      setAdminData(JSON.parse(adminInfo));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/secure-login';
  };

  const adminSections = [
    {
      title: 'الاستفسارات',
      description: 'الرد على استفسارات العملاء',
      icon: 'headset',
      link: '/admin/inquiries',
      iconColor: 'bg-orange-100 text-orange-600'
    },
    {
      title: 'إدارة الإعلانات',
      description: 'إنشاء وتحرير إعلانات الصفحة الرئيسية',
      icon: 'monitor',
      link: '/admin/announcements',
      iconColor: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'إدارة الشركاء',
      description: 'إدارة المطابع والمكتبات الشريكة',
      icon: 'building',
      link: '/admin/partners',
      iconColor: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'نظام المكافآت والأوراق المجانية',
      description: 'إدارة قوانين المكافآت ومتابعة الاستخدام',
      icon: 'gift',
      link: '/admin/rewards-management',
      iconColor: 'bg-purple-100 text-purple-600'
    },
    {
      title: 'إدارة السائقين والمديرين',
      description: 'لوحة الأمان المتقدمة - نظام آمن لإدارة الحسابات',
      icon: 'truck',
      link: '/admin/security-dashboard',
      iconColor: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'التقارير والإحصائيات',
      description: 'مراجعة الأداء والتقارير',
      icon: 'bar-chart',
      link: '/admin/simple-analytics',
      iconColor: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'نظام الإشعارات الشامل',
      description: 'إدارة الإشعارات التلقائية والبريدية وتنبيهات النظام - شامل كل أنواع الإشعارات',
      icon: 'notification',
      link: '/admin/automatic-notifications',
      iconColor: 'bg-red-100 text-red-600',
      isSpecial: true
    }
  ];

  const quickActions = [
    {
      title: 'الطلبات الجديدة',
      description: 'عرض ومعالجة الطلبات الواردة',
      icon: 'shopping-cart',
      link: '/admin/orders-management',
      iconColor: 'bg-red-100 text-red-600'
    },
    {
      title: 'إدارة العملاء',
      description: 'عرض وإدارة حسابات العملاء',
      icon: 'users',
      link: '/admin/users',
      iconColor: 'bg-green-100 text-green-600'
    },
    {
      title: 'إدارة المنتجات',
      description: 'إضافة وتحرير المنتجات',
      icon: 'box',
      link: '/admin/products',
      iconColor: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'الكوبونات والعروض',
      description: 'إنشاء وإدارة العروض',
      icon: 'gift',
      link: '/admin/coupons',
      iconColor: 'bg-purple-100 text-purple-600'
    }
  ];

  const getIconComponent = (iconType: string) => {
    const iconMap: Record<string, any> = {
      'headset': Activity,
      'monitor': FileText,
      'building': Database,
      'gift': Gift,
      'truck': Truck,
      'bar-chart': BarChart3,
      'notification': Bell,
      'shopping-cart': ShoppingCart,
      'users': Users,
      'box': Box
    };
    
    return iconMap[iconType] || Bell;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="bg-red-600 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">لوحة التحكم الإدارية</h1>
                <p className="text-gray-600 text-sm">منصة اطبعلي</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {adminData && (
                <div className="text-right">
                  <p className="text-gray-900 font-medium text-sm">{adminData.admin?.fullName || adminData.admin?.username}</p>
                  <p className="text-gray-500 text-xs">{adminData.admin?.email}</p>
                </div>
              )}
              
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-gray-300"
                data-testid="button-admin-logout"
              >
                <LogOut className="w-4 h-4 mr-1" />
                خروج
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* System Status Alert */}
        <Alert className="mb-6 bg-green-50 border-green-200">
          <Activity className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>حالة النظام:</strong> جميع الأنظمة تعمل بشكل طبيعي | آخر تحديث: {new Date().toLocaleString('ar-EG')}
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">المستخدمين</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">السائقين النشطين</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeDrivers}</p>
                </div>
                <div className="bg-green-100 p-2 rounded-lg">
                  <Truck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">إجمالي الطلبات</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
                <div className="bg-purple-100 p-2 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">حالة النظام</p>
                  <p className="text-xl font-bold text-green-600">{stats.systemStatus}</p>
                </div>
                <div className="bg-orange-100 p-2 rounded-lg">
                  <Database className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {adminSections.map((section, index) => (
            <Card key={index} className="bg-white shadow-sm border hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                      {section.description}
                    </p>
                    <Link href={section.link}>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
                        افتح الآن ←
                      </Button>
                    </Link>
                  </div>
                  <div className={`p-3 rounded-xl ${section.iconColor} ml-4`}>
                    {(() => {
                      const IconComponent = getIconComponent(section.icon);
                      return <IconComponent className="w-6 h-6" />;
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">الإجراءات السريعة</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => (
              <Card key={index} className="bg-gray-50 border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 mb-1">{action.title}</h4>
                      <p className="text-gray-600 text-sm mb-3">
                        {action.description}
                      </p>
                      <Link href={action.link}>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
                          افتح الآن ←
                        </Button>
                      </Link>
                    </div>
                    <div className={`p-2 rounded-lg ${action.iconColor} ml-3`}>
                      {(() => {
                        const IconComponent = getIconComponent(action.icon);
                        return <IconComponent className="w-5 h-5" />;
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}