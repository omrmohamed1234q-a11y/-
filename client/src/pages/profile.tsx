import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { User, Settings, Phone, Mail, MapPin, Calendar, Star, Package, CreditCard, LogOut } from 'lucide-react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';

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

export default function Profile() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>(mockUserProfile);

  // Simulate loading state
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API call delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Simulate update profile
  const handleUpdateProfile = async () => {
    // Simulate API call delay
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
                <h2 className="text-2xl font-bold text-gray-900">{userProfile?.name}</h2>
                <p className="text-gray-600 flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" />
                  {userProfile?.email}
                </p>
                {userProfile?.phone && (
                  <p className="text-gray-600 flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4" />
                    {userProfile?.phone}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    المستوى {userProfile?.level || 1}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CreditCard className="w-3 h-3" />
                    {userProfile?.bountyPoints || 0} نقطة
                  </Badge>
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{userProfile?.totalOrders || 0}</div>
                <div className="text-sm text-gray-600">إجمالي الطلبات</div>
                <div className="text-lg font-semibold text-green-600 mt-1">
                  {userProfile?.totalSpent || '0.00'} جنيه
                </div>
                <div className="text-xs text-gray-500">إجمالي الإنفاق</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">المعلومات الشخصية</TabsTrigger>
            <TabsTrigger value="orders">طلباتي</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="info">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>المعلومات الشخصية</CardTitle>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  onClick={() => setIsEditing(!isEditing)}
                  data-testid="button-edit-profile"
                >
                  <User className="w-4 h-4 mr-2" />
                  {isEditing ? 'إلغاء' : 'تعديل'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الاسم الكامل
                    </label>
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      disabled={!isEditing}
                      data-testid="input-name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      البريد الإلكتروني
                    </label>
                    <Input
                      value={formData.email || ''}
                      disabled={true}
                      className="bg-gray-50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      رقم الهاتف
                    </label>
                    <Input
                      value={formData.phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="01012345678"
                      data-testid="input-phone"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      العمر
                    </label>
                    <Input
                      type="number"
                      value={formData.age || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                      disabled={!isEditing}
                      placeholder="25"
                      data-testid="input-age"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المرحلة الدراسية
                    </label>
                    <Input
                      value={formData.gradeLevel || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, gradeLevel: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="الثانوية العامة"
                      data-testid="input-grade"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تاريخ الميلاد
                    </label>
                    <Input
                      type="date"
                      value={formData.birthDate || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                      disabled={!isEditing}
                      data-testid="input-birth-date"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    العنوان
                  </label>
                  <Input
                    value={formData.address || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    disabled={!isEditing}
                    placeholder="القاهرة، مصر"
                    data-testid="input-address"
                  />
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData(userProfile || {});
                      }}
                    >
                      إلغاء
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>طلباتي الأخيرة</CardTitle>
              </CardHeader>
              <CardContent>
                {userOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">لا توجد طلبات حتى الآن</p>
                    <Button 
                      className="mt-4" 
                      onClick={() => navigate('/store')}
                    >
                      تصفح المتجر
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userOrders.slice(0, 5).map((order: any) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">طلب رقم {order.orderNumber}</p>
                          <p className="text-sm text-gray-600">{order.createdAt}</p>
                        </div>
                        <div className="text-left">
                          <Badge 
                            variant={order.status === 'delivered' ? 'default' : 'secondary'}
                          >
                            {order.status === 'delivered' ? 'مكتمل' : 'قيد التنفيذ'}
                          </Badge>
                          <p className="text-sm font-medium mt-1">{order.totalAmount} جنيه</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات الحساب</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">إشعارات البريد الإلكتروني</h3>
                      <p className="text-sm text-gray-600">استقبال إشعارات حول الطلبات والعروض</p>
                    </div>
                    <Button variant="outline" size="sm">
                      تمكين
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">إشعارات push</h3>
                      <p className="text-sm text-gray-600">استقبال إشعارات فورية على الهاتف</p>
                    </div>
                    <Button variant="outline" size="sm">
                      تمكين
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">إشعارات تحديثات الطلبات</h3>
                      <p className="text-sm text-gray-600">تلقي تحديثات حالة الطلبات</p>
                    </div>
                    <Button variant="outline" size="sm">
                      تمكين
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium text-red-600">منطقة الخطر</h3>
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <h4 className="font-medium text-red-800">حذف الحساب</h4>
                    <p className="text-sm text-red-600 mt-1">
                      سيتم حذف جميع بياناتك نهائياً ولا يمكن استردادها
                    </p>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="mt-3"
                      data-testid="button-delete-account"
                    >
                      حذف الحساب
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}