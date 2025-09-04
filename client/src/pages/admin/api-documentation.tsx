import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Code, 
  Shield, 
  ShoppingCart, 
  Package, 
  Users, 
  Truck, 
  CreditCard, 
  FileText,
  Settings,
  Database,
  Upload,
  Bell,
  MessageCircle,
  Tag,
  Copy,
  ExternalLink
} from 'lucide-react';

const apiEndpoints = [
  // Authentication & User Management
  {
    category: 'Authentication & Users',
    icon: Shield,
    color: 'bg-blue-500',
    apis: [
      {
        method: 'GET',
        path: '/api/auth/user',
        description: 'الحصول على معلومات المستخدم المسجل',
        auth: 'Bearer Token',
        response: 'User object'
      },
      {
        method: 'GET',
        path: '/api/profile',
        description: 'الحصول على الملف الشخصي للمستخدم',
        auth: 'Bearer Token',
        response: 'User profile data'
      },
      {
        method: 'PUT',
        path: '/api/profile',
        description: 'تحديث الملف الشخصي للمستخدم',
        auth: 'Bearer Token',
        response: 'Updated user profile'
      },
      {
        method: 'POST',
        path: '/api/users/sync',
        description: 'مزامنة بيانات المستخدم مع Supabase',
        auth: 'Bearer Token',
        response: 'Sync status'
      },
      {
        method: 'POST',
        path: '/api/auth/admin/secure-login',
        description: 'تسجيل دخول آمن للأدمن',
        auth: 'None',
        response: 'Admin session'
      },
      {
        method: 'POST',
        path: '/api/auth/driver/secure-login',
        description: 'تسجيل دخول آمن للكابتن',
        auth: 'None',
        response: 'Driver session'
      }
    ]
  },
  
  // Admin Management
  {
    category: 'Admin Management',
    icon: Settings,
    color: 'bg-purple-500',
    apis: [
      {
        method: 'GET',
        path: '/api/admin/stats',
        description: 'إحصائيات لوحة الأدمن',
        auth: 'Admin Token',
        response: 'Dashboard statistics'
      },
      {
        method: 'GET',
        path: '/api/admin/security-dashboard/users',
        description: 'جميع المستخدمين الآمنين (أدمن + كباتن)',
        auth: 'Admin Token',
        response: 'Security users list'
      },
      {
        method: 'POST',
        path: '/api/admin/secure-admins',
        description: 'إنشاء حساب أدمن جديد',
        auth: 'Admin Token',
        response: 'New admin account'
      },
      {
        method: 'POST',
        path: '/api/admin/secure-drivers',
        description: 'إنشاء حساب كابتن جديد',
        auth: 'Admin Token',
        response: 'New driver account'
      },
      {
        method: 'GET',
        path: '/api/admin/security-logs',
        description: 'سجلات الأمان والنشاط',
        auth: 'Admin Token',
        response: 'Security logs'
      },
      {
        method: 'PUT',
        path: '/api/admin/security-dashboard/users/:id/status',
        description: 'تغيير حالة المستخدم (نشط/معطل)',
        auth: 'Admin Token',
        response: 'Updated user status'
      }
    ]
  },
  
  // Products Management
  {
    category: 'Products Management',
    icon: Package,
    color: 'bg-green-500',
    apis: [
      {
        method: 'GET',
        path: '/api/products',
        description: 'جميع المنتجات المتاحة',
        auth: 'None',
        response: 'Products list'
      },
      {
        method: 'GET',
        path: '/api/admin/products',
        description: 'جميع المنتجات (للأدمن)',
        auth: 'Admin Token',
        response: 'Products list with admin data'
      },
      {
        method: 'POST',
        path: '/api/admin/products',
        description: 'إنشاء منتج جديد',
        auth: 'Admin Token',
        response: 'New product'
      },
      {
        method: 'PUT',
        path: '/api/admin/products/:id',
        description: 'تحديث منتج موجود',
        auth: 'Admin Token',
        response: 'Updated product'
      },
      {
        method: 'DELETE',
        path: '/api/admin/products/:id',
        description: 'حذف منتج',
        auth: 'Admin Token',
        response: 'Deletion status'
      }
    ]
  },
  
  // Cart & Orders
  {
    category: 'Cart & Orders',
    icon: ShoppingCart,
    color: 'bg-orange-500',
    apis: [
      {
        method: 'GET',
        path: '/api/cart',
        description: 'السلة الحالية للمستخدم',
        auth: 'Bearer Token',
        response: 'Cart data with items'
      },
      {
        method: 'GET',
        path: '/api/cart/count',
        description: 'عدد العناصر في السلة',
        auth: 'Bearer Token',
        response: 'Items count'
      },
      {
        method: 'POST',
        path: '/api/cart/add',
        description: 'إضافة عنصر للسلة',
        auth: 'Bearer Token',
        response: 'Added item'
      },
      {
        method: 'PUT',
        path: '/api/cart/items/:itemId',
        description: 'تحديث كمية عنصر في السلة',
        auth: 'Bearer Token',
        response: 'Updated item'
      },
      {
        method: 'DELETE',
        path: '/api/cart/items/:itemId',
        description: 'حذف عنصر من السلة',
        auth: 'Bearer Token',
        response: 'Deletion status'
      },
      {
        method: 'DELETE',
        path: '/api/cart/clear',
        description: 'مسح جميع عناصر السلة',
        auth: 'Bearer Token',
        response: 'Clear status'
      },
      {
        method: 'POST',
        path: '/api/checkout',
        description: 'إنشاء طلب من السلة',
        auth: 'Bearer Token',
        response: 'New order'
      }
    ]
  },
  
  // Orders Management
  {
    category: 'Orders Management',
    icon: FileText,
    color: 'bg-indigo-500',
    apis: [
      {
        method: 'GET',
        path: '/api/orders',
        description: 'جميع طلبات المستخدم',
        auth: 'Bearer Token',
        response: 'User orders list'
      },
      {
        method: 'GET',
        path: '/api/orders/active',
        description: 'الطلبات النشطة للمستخدم',
        auth: 'Bearer Token',
        response: 'Active orders'
      },
      {
        method: 'GET',
        path: '/api/orders/:id',
        description: 'تفاصيل طلب محدد',
        auth: 'Bearer Token',
        response: 'Order details'
      },
      {
        method: 'GET',
        path: '/api/admin/orders',
        description: 'جميع الطلبات (للأدمن)',
        auth: 'Admin Token',
        response: 'All orders'
      },
      {
        method: 'PUT',
        path: '/api/admin/orders/:id/status',
        description: 'تحديث حالة الطلب',
        auth: 'Admin Token',
        response: 'Updated order'
      },
      {
        method: 'POST',
        path: '/api/admin/orders/:orderId/assign-driver',
        description: 'تعيين كابتن للطلب',
        auth: 'Admin Token',
        response: 'Assignment status'
      }
    ]
  },
  
  // Driver Management
  {
    category: 'Driver Management',
    icon: Truck,
    color: 'bg-yellow-500',
    apis: [
      {
        method: 'GET',
        path: '/api/driver/secure-orders',
        description: 'الطلبات المعينة للكابتن',
        auth: 'Driver Token',
        response: 'Driver orders'
      },
      {
        method: 'PUT',
        path: '/api/driver/status',
        description: 'تحديث حالة الكابتن (متاح/مشغول)',
        auth: 'Driver Token',
        response: 'Status update'
      },
      {
        method: 'POST',
        path: '/api/driver/accept-order',
        description: 'قبول طلب من الكابتن',
        auth: 'Driver Token',
        response: 'Acceptance status'
      },
      {
        method: 'PUT',
        path: '/api/driver/orders/:orderId/status',
        description: 'تحديث حالة الطلب (تم التسليم)',
        auth: 'Driver Token',
        response: 'Order status update'
      }
    ]
  },
  
  // Payment Systems
  {
    category: 'Payment Systems',
    icon: CreditCard,
    color: 'bg-red-500',
    apis: [
      {
        method: 'GET',
        path: '/api/payments/paymob/methods',
        description: 'طرق الدفع المتاحة عبر Paymob',
        auth: 'None',
        response: 'Available payment methods'
      },
      {
        method: 'POST',
        path: '/api/payments/paymob/payment',
        description: 'معالجة الدفع عبر Paymob',
        auth: 'Bearer Token',
        response: 'Payment result'
      },
      {
        method: 'GET',
        path: '/api/google-pay/config',
        description: 'إعدادات Google Pay',
        auth: 'None',
        response: 'Google Pay configuration'
      },
      {
        method: 'POST',
        path: '/api/google-pay/payment',
        description: 'معالجة الدفع عبر Google Pay',
        auth: 'Bearer Token',
        response: 'Payment result'
      },
      {
        method: 'POST',
        path: '/api/vodafone-cash/payment',
        description: 'معالجة الدفع عبر Vodafone Cash',
        auth: 'Bearer Token',
        response: 'Payment result'
      }
    ]
  },
  
  // File Management
  {
    category: 'File Management',
    icon: Upload,
    color: 'bg-cyan-500',
    apis: [
      {
        method: 'GET',
        path: '/api/upload-status',
        description: 'حالة خدمة رفع الملفات',
        auth: 'None',
        response: 'Upload service status'
      },
      {
        method: 'POST',
        path: '/api/upload-file',
        description: 'تتبع رفع الملفات',
        auth: 'Bearer Token',
        response: 'Upload confirmation'
      },
      {
        method: 'POST',
        path: '/api/print-jobs',
        description: 'إنشاء مهمة طباعة جديدة',
        auth: 'Bearer Token',
        response: 'Print job details'
      },
      {
        method: 'GET',
        path: '/api/admin/print-jobs',
        description: 'جميع مهام الطباعة (للأدمن)',
        auth: 'Admin Token',
        response: 'All print jobs'
      },
      {
        method: 'PUT',
        path: '/api/admin/print-jobs/:id/status',
        description: 'تحديث حالة مهمة الطباعة',
        auth: 'Admin Token',
        response: 'Updated print job'
      }
    ]
  },
  
  // Partners & Announcements
  {
    category: 'Partners & Announcements',
    icon: Users,
    color: 'bg-pink-500',
    apis: [
      {
        method: 'GET',
        path: '/api/partners/featured',
        description: 'الشركاء المميزين',
        auth: 'None',
        response: 'Featured partners'
      },
      {
        method: 'GET',
        path: '/api/partners',
        description: 'جميع الشركاء',
        auth: 'None',
        response: 'All partners'
      },
      {
        method: 'GET',
        path: '/api/partners/:id',
        description: 'تفاصيل شريك محدد',
        auth: 'None',
        response: 'Partner details'
      },
      {
        method: 'GET',
        path: '/api/announcements',
        description: 'الإعلانات النشطة',
        auth: 'None',
        response: 'Active announcements'
      },
      {
        method: 'GET',
        path: '/api/announcements/homepage',
        description: 'إعلانات الصفحة الرئيسية',
        auth: 'None',
        response: 'Homepage announcements'
      },
      {
        method: 'GET',
        path: '/api/announcements/:id',
        description: 'تفاصيل إعلان محدد',
        auth: 'None',
        response: 'Announcement details'
      }
    ]
  },
  
  // System & Testing
  {
    category: 'System & Testing',
    icon: Database,
    color: 'bg-gray-500',
    apis: [
      {
        method: 'GET',
        path: '/api/test-connection',
        description: 'اختبار الاتصال بالخادم',
        auth: 'None',
        response: 'Connection status'
      },
      {
        method: 'GET',
        path: '/api/test-setup',
        description: 'اختبار إعداد النظام',
        auth: 'None',
        response: 'Setup status'
      },
      {
        method: 'GET',
        path: '/api/test-security-tables',
        description: 'اختبار جداول الأمان',
        auth: 'None',
        response: 'Security tables status'
      },
      {
        method: 'GET',
        path: '/api/supabase-info',
        description: 'معلومات اتصال Supabase',
        auth: 'None',
        response: 'Supabase connection info'
      },
      {
        method: 'GET',
        path: '/api/get-setup-sql',
        description: 'الحصول على SQL للإعداد',
        auth: 'None',
        response: 'SQL setup scripts'
      },
      {
        method: 'POST',
        path: '/api/create-test-accounts',
        description: 'إنشاء حسابات تجريبية',
        auth: 'None',
        response: 'Test accounts creation status'
      }
    ]
  }
];

const getMethodColor = (method: string) => {
  const colors = {
    'GET': 'bg-green-100 text-green-800 border-green-200',
    'POST': 'bg-blue-100 text-blue-800 border-blue-200',
    'PUT': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'DELETE': 'bg-red-100 text-red-800 border-red-200'
  };
  return colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
};

const getAuthColor = (auth: string) => {
  const colors = {
    'None': 'bg-gray-100 text-gray-600',
    'Bearer Token': 'bg-blue-100 text-blue-600',
    'Admin Token': 'bg-purple-100 text-purple-600',
    'Driver Token': 'bg-orange-100 text-orange-600'
  };
  return colors[auth as keyof typeof colors] || 'bg-gray-100 text-gray-600';
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
};

export default function ApiDocumentation() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredEndpoints = apiEndpoints.filter(category => 
    selectedCategory === 'all' || category.category === selectedCategory
  ).map(category => ({
    ...category,
    apis: category.apis.filter(api => 
      api.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      api.description.includes(searchTerm) ||
      api.method.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.apis.length > 0);

  const totalAPIs = apiEndpoints.reduce((sum, category) => sum + category.apis.length, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Code className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">وثائق الـ APIs</h1>
              <p className="text-gray-600">جميع نقاط النهاية المتاحة في التطبيق</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-lg px-4 py-2">
                {totalAPIs} API متاح
              </Badge>
              <Badge variant="outline" className="text-lg px-4 py-2">
                {apiEndpoints.length} فئة
              </Badge>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="البحث في الـ APIs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="api-search"
              />
            </div>
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid grid-cols-5 lg:grid-cols-10 gap-1 h-auto">
              <TabsTrigger value="all" className="text-xs px-2 py-1">الكل</TabsTrigger>
              {apiEndpoints.map(category => (
                <TabsTrigger 
                  key={category.category} 
                  value={category.category} 
                  className="text-xs px-2 py-1"
                >
                  {category.category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* API Categories */}
        <div className="space-y-8">
          {filteredEndpoints.map((category) => (
            <Card key={category.category} className="overflow-hidden">
              <CardHeader className={`${category.color} text-white`}>
                <CardTitle className="flex items-center gap-3">
                  <category.icon className="h-6 w-6" />
                  {category.category}
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {category.apis.length} APIs
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-right p-4 font-medium">Method</th>
                        <th className="text-right p-4 font-medium">Endpoint</th>
                        <th className="text-right p-4 font-medium">الوصف</th>
                        <th className="text-right p-4 font-medium">المصادقة</th>
                        <th className="text-right p-4 font-medium">الاستجابة</th>
                        <th className="text-right p-4 font-medium">أدوات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {category.apis.map((api, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <Badge className={`${getMethodColor(api.method)} font-mono text-xs border`}>
                              {api.method}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                              {api.path}
                            </code>
                          </td>
                          <td className="p-4 text-gray-700">
                            {api.description}
                          </td>
                          <td className="p-4">
                            <Badge className={`${getAuthColor(api.auth)} text-xs`}>
                              {api.auth}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {api.response}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(api.path)}
                                data-testid={`copy-${api.method.toLowerCase()}-${api.path.replace(/[^a-zA-Z0-9]/g, '-')}`}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`${window.location.origin}${api.path}`, '_blank')}
                                data-testid={`test-${api.method.toLowerCase()}-${api.path.replace(/[^a-zA-Z0-9]/g, '-')}`}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEndpoints.length === 0 && (
          <Card className="p-12 text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد نتائج</h3>
            <p className="text-gray-600">جرب تغيير مصطلح البحث أو الفئة</p>
          </Card>
        )}

        {/* Footer Info */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900 mb-2">ملاحظات مهمة</h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• جميع الـ APIs التي تتطلب مصادقة تحتاج إلى Authorization Header</li>
                  <li>• تأكد من إرسال Content-Type: application/json مع POST/PUT requests</li>
                  <li>• استخدم x-user-id header للاختبار السريع</li>
                  <li>• APIs الأدمن تتطلب x-admin-token أو x-user-role: admin</li>
                  <li>• جميع الاستجابات بتنسيق JSON</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}