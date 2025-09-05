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
import { User, Settings, Phone, Mail, MapPin, Calendar, Star, Package, CreditCard, LogOut, Shield, Activity, Users } from 'lucide-react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  department?: string;
  joinDate?: string;
  profileImage?: string;
  permissions: string[];
  lastLogin?: string;
  totalActions: number;
  managedUsers: number;
  systemAccess: string[];
}

export default function AdminProfile() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<AdminProfile>>({});

  // Fetch admin profile from API
  const { data: adminProfile, isLoading } = useQuery<AdminProfile>({
    queryKey: ['/api/admin/profile'],
    initialData: {
      id: 'admin_1',
      name: 'أحمد إبراهيم',
      email: 'ahmed@admin.com',
      phone: '01012345678',
      role: 'مدير النظام',
      department: 'إدارة التقنية',
      joinDate: '2024-01-15',
      profileImage: '',
      permissions: ['إدارة المستخدمين', 'إدارة الطلبات', 'إدارة المنتجات', 'التقارير', 'النظام'],
      lastLogin: new Date().toISOString(),
      totalActions: 1250,
      managedUsers: 45,
      systemAccess: ['لوحة الإدارة', 'قاعدة البيانات', 'التقارير', 'النسخ الاحتياطي']
    }
  });

  useEffect(() => {
    if (adminProfile) {
      setFormData(adminProfile);
    }
  }, [adminProfile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<AdminProfile>) => {
      return apiRequest('PUT', '/api/admin/profile', updates);
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث الملف الشخصي",
        description: "تم حفظ التغييرات بنجاح",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في التحديث",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
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

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2"
            >
              ← العودة للوحة الإدارة
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">الملف الشخصي للمدير</h1>
          </div>
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            className="flex items-center gap-2"
            data-testid="button-admin-logout"
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
                <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
                  {formData?.name?.charAt(0) || 'أ'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{formData?.name}</h2>
                <p className="text-gray-600 flex items-center gap-2 mt-1">
                  <Shield className="w-4 h-4" />
                  {formData?.role} - {formData?.department}
                </p>
                <p className="text-gray-600 flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" />
                  {formData?.email}
                </p>
                {formData?.phone && (
                  <p className="text-gray-600 flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4" />
                    {formData?.phone}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    مدير النظام
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {formData?.totalActions || 0} إجراء
                  </Badge>
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{formData?.managedUsers || 0}</div>
                <div className="text-sm text-gray-600">مستخدم مُدار</div>
                <div className="text-lg font-semibold text-green-600 mt-1">
                  {formData?.permissions?.length || 0}
                </div>
                <div className="text-xs text-gray-500">صلاحية نشطة</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">المعلومات الشخصية</TabsTrigger>
            <TabsTrigger value="permissions">الصلاحيات</TabsTrigger>
            <TabsTrigger value="settings">إعدادات النظام</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="info">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>المعلومات الشخصية</CardTitle>
                <Button
                  variant={isEditing ? "outline" : "default"}
                  onClick={() => setIsEditing(!isEditing)}
                  data-testid="button-edit-admin-profile"
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
                      data-testid="input-admin-name"
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
                      data-testid="input-admin-phone"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المنصب
                    </label>
                    <Input
                      value={formData.role || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="مدير النظام"
                      data-testid="input-admin-role"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      القسم
                    </label>
                    <Input
                      value={formData.department || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      disabled={!isEditing}
                      placeholder="إدارة التقنية"
                      data-testid="input-admin-department"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      تاريخ الانضمام
                    </label>
                    <Input
                      type="date"
                      value={formData.joinDate || ''}
                      disabled={true}
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-admin-profile"
                    >
                      {updateProfileMutation.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData(adminProfile || {});
                      }}
                    >
                      إلغاء
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle>الصلاحيات والوصول</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">صلاحيات النظام</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {formData.permissions?.map((permission, index) => (
                        <Badge key={index} variant="outline" className="p-2 justify-center">
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">مستوى الوصول</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {formData.systemAccess?.map((access, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                          <Shield className="w-4 h-4 text-green-600" />
                          <span>{access}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">{formData.managedUsers}</div>
                      <div className="text-sm text-gray-600">مستخدم مُدار</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">{formData.totalActions}</div>
                      <div className="text-sm text-gray-600">إجراء منجز</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-lg font-bold text-purple-600">
                        {formData.lastLogin ? new Date(formData.lastLogin).toLocaleDateString('ar-EG') : 'غير محدد'}
                      </div>
                      <div className="text-sm text-gray-600">آخر دخول</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات النظام</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">تسجيل العمليات</h3>
                      <p className="text-sm text-gray-600">تسجيل جميع العمليات الإدارية</p>
                    </div>
                    <Button variant="outline" size="sm">
                      مفعل
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">إشعارات النظام</h3>
                      <p className="text-sm text-gray-600">استقبال إشعارات حول حالة النظام</p>
                    </div>
                    <Button variant="outline" size="sm">
                      تمكين
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">النسخ الاحتياطي التلقائي</h3>
                      <p className="text-sm text-gray-600">إنشاء نسخ احتياطية تلقائية يومياً</p>
                    </div>
                    <Button variant="outline" size="sm">
                      مفعل
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium text-red-600">إعدادات متقدمة</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="justify-start gap-2">
                      <Settings className="w-4 h-4" />
                      إعدادات قاعدة البيانات
                    </Button>
                    <Button variant="outline" className="justify-start gap-2">
                      <Activity className="w-4 h-4" />
                      مراقبة الأداء
                    </Button>
                    <Button variant="outline" className="justify-start gap-2">
                      <Package className="w-4 h-4" />
                      إدارة النسخ الاحتياطي
                    </Button>
                    <Button variant="outline" className="justify-start gap-2">
                      <Users className="w-4 h-4" />
                      إدارة الصلاحيات
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