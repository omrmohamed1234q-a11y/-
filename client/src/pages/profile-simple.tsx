import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { User, Settings, Phone, Mail, MapPin, Calendar, Star, Package, CreditCard, LogOut } from 'lucide-react';
import { useLocation } from 'wouter';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  birthDate?: string;
  gradeLevel?: string;
  age?: number;
  profileImage?: string;
  bountyPoints: number;
  level: number;
  totalOrders: number;
  totalSpent: string;
  memberSince: string;
}

// Mock data for demo
const mockUserProfile: UserProfile = {
  id: "user_123",
  name: "أحمد محمد علي",
  email: "ahmed.mohamed@example.com",
  phone: "+20 1234567890",
  address: "شارع النصر، المعادي، القاهرة",
  birthDate: "1995-03-15",
  gradeLevel: "جامعي",
  age: 28,
  profileImage: "/placeholder-avatar.jpg",
  bountyPoints: 1250,
  level: 5,
  totalOrders: 23,
  totalSpent: "3,450.00",
  memberSince: "يناير 2023"
};

const mockOrders = [
  {
    id: "order_001",
    orderNumber: "ORD-2024-001",
    date: "2024-01-15",
    status: "مكتمل",
    total: "150.00",
    items: ["طباعة ملفات PDF", "تصوير مستندات"]
  },
  {
    id: "order_002", 
    orderNumber: "ORD-2024-002",
    date: "2024-01-10",
    status: "قيد التجهيز",
    total: "85.50",
    items: ["مسح ضوئي", "طباعة ملونة"]
  }
];

export default function ProfileSimple() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>(mockUserProfile);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdateProfile = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "تم تحديث الملف الشخصي",
      description: "تم حفظ التغييرات بنجاح",
    });
    setIsEditing(false);
  };

  const handleSave = () => {
    handleUpdateProfile();
  };

  const handleLogout = async () => {
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل الخروج بنجاح",
    });
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir="rtl">
        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              ← العودة للرئيسية
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">الملف الشخصي</h1>
          </div>
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            className="flex items-center gap-2"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </Button>
        </div>

        {/* Profile Overview Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={formData?.profileImage} />
                <AvatarFallback className="text-2xl">
                  {formData?.name?.charAt(0) || 'ع'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{formData?.name}</h2>
                <p className="text-gray-600">{formData?.email}</p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    المستوى {formData?.level}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    {formData?.bountyPoints} نقطة
                  </Badge>
                </div>
              </div>

              <div className="text-right">
                <Button
                  variant={isEditing ? "default" : "outline"}
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2"
                  data-testid="button-edit-profile"
                >
                  <Settings className="w-4 h-4" />
                  {isEditing ? 'إلغاء التعديل' : 'تعديل الملف'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">المعلومات الشخصية</TabsTrigger>
            <TabsTrigger value="orders">الطلبات</TabsTrigger>
            <TabsTrigger value="stats">الإحصائيات</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  المعلومات الأساسية
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">الاسم الكامل</label>
                    <Input
                      value={formData?.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">البريد الإلكتروني</label>
                    <Input
                      value={formData?.email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">رقم الهاتف</label>
                    <Input
                      value={formData?.phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">العنوان</label>
                    <Input
                      value={formData?.address || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      disabled={!isEditing}
                      className="mt-1"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleSave} className="flex items-center gap-2">
                      حفظ التغييرات
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                    >
                      إلغاء
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  آخر الطلبات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{order.orderNumber}</h3>
                          <p className="text-sm text-gray-600">{order.date}</p>
                        </div>
                        <Badge variant={order.status === 'مكتمل' ? 'default' : 'secondary'}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {order.items.join(' • ')}
                      </div>
                      <div className="text-lg font-semibold text-red-600">
                        {order.total} جنيه
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6 text-center">
                  <Package className="w-8 h-8 mx-auto text-red-500 mb-2" />
                  <div className="text-2xl font-bold">{formData?.totalOrders}</div>
                  <div className="text-sm text-gray-600">إجمالي الطلبات</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <CreditCard className="w-8 h-8 mx-auto text-green-500 mb-2" />
                  <div className="text-2xl font-bold">{formData?.totalSpent} جنيه</div>
                  <div className="text-sm text-gray-600">إجمالي المصروفات</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <Star className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
                  <div className="text-2xl font-bold">{formData?.bountyPoints}</div>
                  <div className="text-sm text-gray-600">النقاط المكتسبة</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}