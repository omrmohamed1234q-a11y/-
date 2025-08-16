import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/header';
import BottomNav from '@/components/layout/bottom-nav';
import {
  Printer, Star, Clock, Gift, BookOpen, Zap,
  Users, TrendingUp, Award, ShoppingBag
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 18) return 'مساء الخير';
    return 'مساء الخير';
  };

  const quickActions = [
    {
      title: 'طباعة سريعة',
      description: 'ارفع ملفك واطبع فوراً',
      icon: <Printer className="w-8 h-8" />,
      link: '/print',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'المتجر الرقمي',
      description: 'تسوق المنتجات التعليمية',
      icon: <ShoppingBag className="w-8 h-8" />,
      link: '/store',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'المكافآت',
      description: 'استبدل نقاطك بجوائز',
      icon: <Gift className="w-8 h-8" />,
      link: '/rewards',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'الملف الشخصي',
      description: 'إدارة حسابك ونقاطك',
      icon: <Users className="w-8 h-8" />,
      link: '/profile',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const stats = [
    { label: 'نقاط البونص', value: user?.bountyPoints || 0, icon: Star, color: 'text-yellow-600' },
    { label: 'المستوى', value: user?.level || 1, icon: Award, color: 'text-blue-600' },
    { label: 'مجموع الطباعة', value: user?.totalPrints || 0, icon: Printer, color: 'text-green-600' },
    { label: 'إجمالي المشتريات', value: user?.totalPurchases || 0, icon: TrendingUp, color: 'text-purple-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
      <Header />
      
      <div className="container mx-auto px-4 py-6 pb-20">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-xl mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  {greeting()}، {user?.fullName || 'مستخدم عزيز'}!
                </h1>
                <p className="text-gray-600">
                  مرحباً بك في منصة اطبعلي للطباعة الذكية
                </p>
              </div>
              <div className="text-5xl">📄</div>
            </div>
            
            {user?.role === 'admin' && (
              <div className="mt-4 p-4 bg-gradient-to-r from-red-500 to-red-600 rounded-xl">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h3 className="font-semibold">لوحة الإدارة</h3>
                    <p className="text-sm opacity-90">إدارة المنصة والمستخدمين</p>
                  </div>
                  <Link href="/admin">
                    <Button variant="secondary" size="sm">
                      فتح لوحة الإدارة
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-4">
                <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold text-gray-800">{stat.value.toLocaleString()}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">الإجراءات السريعة</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.link}>
                <Card className={`hover:shadow-lg transition-all duration-200 cursor-pointer ${action.bgColor}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className={`bg-gradient-to-r ${action.color} text-white p-3 rounded-xl`}>
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">{action.title}</h3>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Daily Challenges Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Clock className="w-6 h-6 text-orange-500" />
                <span>التحديات اليومية</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
                  <div>
                    <h4 className="font-semibold text-gray-800">اطبع 5 صفحات اليوم</h4>
                    <p className="text-sm text-gray-600">احصل على 50 نقطة بونص</p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-600">2/5</Badge>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                  <div>
                    <h4 className="font-semibold text-gray-800">ادع صديقاً جديداً</h4>
                    <p className="text-sm text-gray-600">احصل على 100 نقطة بونص</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-600">0/1</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <TrendingUp className="w-6 h-6 text-green-500" />
                <span>النشاط الأخير</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 space-x-reverse p-3 bg-gray-50 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">تم طباعة ملف "اختبار الرياضيات" بنجاح</p>
                    <p className="text-xs text-gray-500">منذ ساعتين</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 space-x-reverse p-3 bg-gray-50 rounded-lg">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">حصلت على 25 نقطة بونص</p>
                    <p className="text-xs text-gray-500">منذ 3 ساعات</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 space-x-reverse p-3 bg-gray-50 rounded-lg">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">انضممت إلى برنامج المكافآت</p>
                    <p className="text-xs text-gray-500">أمس</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Special Offers */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 space-x-reverse">
                <Zap className="w-6 h-6" />
                <span>عروض خاصة</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-white bg-opacity-20 rounded-xl p-4">
                  <h4 className="font-semibold mb-2">خصم 50% على الطباعة الملونة</h4>
                  <p className="text-sm opacity-90 mb-3">
                    احصل على خصم 50% على جميع خدمات الطباعة الملونة لفترة محدودة
                  </p>
                  <Button variant="secondary" size="sm">
                    استفد الآن
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}