import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { LogoPresets } from '@/components/AnimatedLogo';
import { motion } from 'framer-motion';
import { 
  Truck, 
  ShieldCheck, 
  Users, 
  ArrowRight,
  UserPlus,
  LogIn,
  Home
} from 'lucide-react';

export default function QuickAccess() {
  const [, navigate] = useLocation();

  const accessOptions = [
    {
      title: 'حساب عميل جديد',
      description: 'إنشاء حساب جديد للعملاء',
      icon: UserPlus,
      route: '/auth/signup',
      color: 'purple',
      requiresAuth: false
    },
    {
      title: 'تسجيل دخول العملاء',
      description: 'تسجيل دخول للعملاء الحاليين',
      icon: LogIn,
      route: '/auth/login',
      color: 'orange',
      requiresAuth: false
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-500',
          hover: 'hover:bg-blue-600',
          border: 'border-blue-200',
          icon: 'bg-blue-100 text-blue-600'
        };
      case 'green':
        return {
          bg: 'bg-green-500',
          hover: 'hover:bg-green-600',
          border: 'border-green-200',
          icon: 'bg-green-100 text-green-600'
        };
      case 'purple':
        return {
          bg: 'bg-purple-500',
          hover: 'hover:bg-purple-600',
          border: 'border-purple-200',
          icon: 'bg-purple-100 text-purple-600'
        };
      case 'orange':
        return {
          bg: 'bg-orange-500',
          hover: 'hover:bg-orange-600',
          border: 'border-orange-200',
          icon: 'bg-orange-100 text-orange-600'
        };
      case 'red':
        return {
          bg: 'bg-red-500',
          hover: 'hover:bg-red-600',
          border: 'border-red-200',
          icon: 'bg-red-100 text-red-600'
        };
      default:
        return {
          bg: 'bg-gray-500',
          hover: 'hover:bg-gray-600',
          border: 'border-gray-200',
          icon: 'bg-gray-100 text-gray-600'
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <LogoPresets.Hero />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            مرحباً بك في اطبعلي
          </h1>
          <p className="text-lg text-gray-600">
            اختر نوع الحساب للدخول إلى النظام المناسب
          </p>
        </motion.div>

        {/* Quick Access Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {accessOptions.map((option, index) => {
            const colors = getColorClasses(option.color);
            const IconComponent = option.icon;
            
            return (
              <motion.div
                key={option.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className={`border-2 ${colors.border} hover:shadow-lg transition-all duration-200 cursor-pointer group`}>
                  <CardHeader className="text-center">
                    <div className={`w-16 h-16 rounded-full ${colors.icon} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}>
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-xl text-gray-900">
                      {option.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <p className="text-gray-600 text-sm">
                      {option.description}
                    </p>
                    <Button
                      onClick={() => navigate(option.route)}
                      className={`w-full ${colors.bg} ${colors.hover} text-white flex items-center justify-center gap-2`}
                      data-testid={`button-${option.route.replace('/', '')}`}
                    >
                      <span>الدخول</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Navigation Help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm p-6 border"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            إرشادات الوصول
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">للمديرين:</h4>
              <ul className="space-y-1">
                <li>• انقر على "لوحة الإدارة" للوصول المباشر</li>
                <li>• لا تحتاج تسجيل دخول منفصل</li>
                <li>• إدارة شاملة للنظام والمنتجات</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">للكباتن:</h4>
              <ul className="space-y-1">
                <li>• انقر على "لوحة الكابتن"</li>
                <li>• استخدم البيانات: ahmed@driver.com</li>
                <li>• كلمة المرور: password123</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">للعملاء الجدد:</h4>
              <ul className="space-y-1">
                <li>• انقر على "حساب عميل جديد"</li>
                <li>• اختر "كابتن توصيل" للانضمام كسائق</li>
                <li>• املأ البيانات المطلوبة</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">للعملاء الحاليين:</h4>
              <ul className="space-y-1">
                <li>• انقر على "تسجيل دخول العملاء"</li>
                <li>• استخدم بيانات حسابك المسجل</li>
                <li>• الوصول لجميع خدمات التطبيق</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-8"
        >
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            العودة للصفحة الرئيسية
          </Button>
        </motion.div>
      </div>
    </div>
  );
}