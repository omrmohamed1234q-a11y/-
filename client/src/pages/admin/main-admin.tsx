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
  Eye,
  LogOut,
  Activity,
  Database
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
      title: 'إدارة الأمان',
      description: 'إدارة المسؤولين والسائقين وسجلات الأمان',
      icon: Shield,
      link: '/admin/security-dashboard',
      color: 'bg-red-600 hover:bg-red-700',
      textColor: 'text-red-100'
    },
    {
      title: 'إدارة المستخدمين',
      description: 'عرض وإدارة جميع المستخدمين',
      icon: Users,
      link: '/admin/users',
      color: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-blue-100'
    },
    {
      title: 'إدارة السائقين',
      description: 'متابعة حالة السائقين والتوصيلات',
      icon: Truck,
      link: '/admin/drivers',
      color: 'bg-green-600 hover:bg-green-700',
      textColor: 'text-green-100'
    },
    {
      title: 'إدارة الطلبات',
      description: 'متابعة جميع الطلبات والمبيعات',
      icon: FileText,
      link: '/admin/orders-management',
      color: 'bg-purple-600 hover:bg-purple-700',
      textColor: 'text-purple-100'
    },
    {
      title: 'التحليلات',
      description: 'إحصائيات شاملة للمنصة',
      icon: BarChart3,
      link: '/admin/simple-analytics',
      color: 'bg-orange-600 hover:bg-orange-700',
      textColor: 'text-orange-100'
    },
    {
      title: 'الإعلانات',
      description: 'إدارة الإعلانات والمقالات',
      icon: Bell,
      link: '/admin/announcements',
      color: 'bg-pink-600 hover:bg-pink-700',
      textColor: 'text-pink-100'
    },
    {
      title: '🔔📢 نظام الإشعارات الشامل',
      description: 'إدارة الإشعارات التلقائية واليدوية وتنبيهات النظام - شامل كل أنواع الإشعارات',
      icon: Bell,
      link: '/admin/automatic-notifications',
      color: 'bg-red-500 hover:bg-red-600',
      textColor: 'text-red-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800 shadow-xl border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="bg-red-600 p-3 rounded-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">لوحة التحكم الإدارية</h1>
                <p className="text-slate-300">منصة اطبعلي - النظام الإداري</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {adminData && (
                <div className="text-right">
                  <p className="text-white font-medium">{adminData.admin?.fullName || adminData.admin?.username}</p>
                  <p className="text-slate-300 text-sm">{adminData.admin?.email}</p>
                </div>
              )}
              
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                data-testid="button-admin-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                خروج
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Alert */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Alert className="mb-6 bg-green-900 border-green-700">
          <Activity className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-100">
            <strong>حالة النظام:</strong> جميع الأنظمة تعمل بشكل طبيعي | آخر تحديث: {new Date().toLocaleString('ar-EG')}
          </AlertDescription>
        </Alert>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">المستخدمين</p>
                  <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">السائقين النشطين</p>
                  <p className="text-2xl font-bold text-white">{stats.activeDrivers}</p>
                </div>
                <Truck className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">إجمالي الطلبات</p>
                  <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
                </div>
                <FileText className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">حالة النظام</p>
                  <p className="text-2xl font-bold text-green-400">{stats.systemStatus}</p>
                </div>
                <Database className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section, index) => (
            <Link key={index} href={section.link}>
              <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-all duration-200 cursor-pointer transform hover:scale-105">
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-lg ${section.color} flex items-center justify-center mb-4`}>
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-white text-lg">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {section.description}
                  </p>
                  
                  <div className="mt-4 flex items-center text-slate-300">
                    <Eye className="w-4 h-4 mr-2" />
                    <span className="text-sm">عرض التفاصيل</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-slate-800 rounded-lg border border-slate-700 p-6">
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            إجراءات سريعة
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              asChild
              className="bg-red-600 hover:bg-red-700 text-white h-12"
              data-testid="button-security-access"
            >
              <Link href="/admin/security-dashboard">
                <Shield className="w-4 h-4 mr-2" />
                الوصول الأمني
              </Link>
            </Button>
            
            <Button
              asChild
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 h-12"
              data-testid="button-system-monitoring"
            >
              <Link href="/admin/simple-analytics">
                <BarChart3 className="w-4 h-4 mr-2" />
                مراقبة النظام
              </Link>
            </Button>
            
            <Button
              asChild
              variant="outline" 
              className="border-slate-600 text-slate-300 hover:bg-slate-700 h-12"
              data-testid="button-user-management"
            >
              <Link href="/admin/users">
                <Users className="w-4 h-4 mr-2" />
                إدارة المستخدمين
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}