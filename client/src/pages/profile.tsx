import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/header';
import BottomNav from '@/components/layout/bottom-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

export default function Profile() {
  const { user, signOut, updateProfile } = useAuth();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    is_teacher: user?.is_teacher || false,
  });

  // Fetch user statistics
  const { data: userStats } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const [printJobs, orders, redemptions] = await Promise.all([
        supabase
          .from('print_jobs')
          .select('count')
          .eq('user_id', user.id)
          .eq('status', 'completed'),
        
        supabase
          .from('orders')
          .select('count, total_amount')
          .eq('user_id', user.id)
          .eq('status', 'delivered'),
        
        supabase
          .from('reward_redemptions')
          .select('count')
          .eq('user_id', user.id)
      ]);

      return {
        completedPrints: printJobs.count || 0,
        completedOrders: orders.count || 0,
        totalSpent: orders.data?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0,
        redemptions: redemptions.count || 0,
      };
    },
    enabled: !!user,
  });

  const handleSaveProfile = async () => {
    try {
      const result = await updateProfile(formData);
      
      if (result.success) {
        setIsEditing(false);
        toast({
          title: 'تم التحديث بنجاح',
          description: 'تم حفظ بيانات الملف الشخصي',
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: 'خطأ في التحديث',
        description: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'تم تسجيل الخروج',
      description: 'نراك قريباً!',
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <Card>
            <CardContent className="py-12 text-center">
              <i className="fas fa-user-slash text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-semibold mb-2">غير مسجل الدخول</h3>
              <p className="text-muted-foreground mb-4">يجب تسجيل الدخول لعرض الملف الشخصي</p>
              <Button>تسجيل الدخول</Button>
            </CardContent>
          </Card>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">الملف الشخصي</h1>
          <p className="text-muted-foreground">إدارة بيانات حسابك وإعداداتك</p>
        </div>

        {/* Profile Info */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>البيانات الشخصية</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <i className={`fas ${isEditing ? 'fa-times' : 'fa-edit'} ml-1`}></i>
              {isEditing ? 'إلغاء' : 'تعديل'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4 space-x-reverse mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/10 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-accent">
                  {user.full_name.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{user.full_name}</h3>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="flex items-center space-x-2 space-x-reverse mt-2">
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                    المستوى {user.level}
                  </Badge>
                  {user.is_teacher && (
                    <Badge className="bg-blue-600 text-white">
                      معلم
                    </Badge>
                  )}
                  {user.teacher_subscription && (
                    <Badge className="bg-purple-600 text-white">
                      اشتراك مميز
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name">الاسم الكامل</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="01xxxxxxxxx"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_teacher">حساب معلم</Label>
                  <Switch
                    id="is_teacher"
                    checked={formData.is_teacher}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_teacher: checked })}
                  />
                </div>
                
                <Button onClick={handleSaveProfile} className="w-full">
                  <i className="fas fa-save ml-2"></i>
                  حفظ التغييرات
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">رقم الهاتف:</span>
                  <span className="arabic-nums">{user.phone || 'غير محدد'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تاريخ الانضمام:</span>
                  <span className="arabic-nums">
                    {new Date(user.created_at).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">نقاط المكافآت:</span>
                  <span className="font-bold text-accent arabic-nums">
                    {user.bounty_points.toLocaleString('ar-EG')}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-chart-line text-blue-600 ml-2"></i>
              الإحصائيات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <i className="fas fa-print text-blue-600 text-2xl mb-2"></i>
                <div className="text-2xl font-bold text-blue-600 arabic-nums">
                  {user.total_prints}
                </div>
                <div className="text-sm text-muted-foreground">إجمالي الطباعات</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <i className="fas fa-shopping-bag text-green-600 text-2xl mb-2"></i>
                <div className="text-2xl font-bold text-green-600 arabic-nums">
                  {user.total_purchases}
                </div>
                <div className="text-sm text-muted-foreground">المشتريات</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <i className="fas fa-users text-purple-600 text-2xl mb-2"></i>
                <div className="text-2xl font-bold text-purple-600 arabic-nums">
                  {user.total_referrals}
                </div>
                <div className="text-sm text-muted-foreground">الإحالات</div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <i className="fas fa-gift text-orange-600 text-2xl mb-2"></i>
                <div className="text-2xl font-bold text-orange-600 arabic-nums">
                  {userStats?.redemptions || 0}
                </div>
                <div className="text-sm text-muted-foreground">المكافآت المستبدلة</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-cog text-gray-600 ml-2"></i>
              الإعدادات
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">الإشعارات</div>
                <div className="text-sm text-muted-foreground">تلقي إشعارات الطباعة والعروض</div>
              </div>
              <Switch defaultChecked />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">الوضع الليلي</div>
                <div className="text-sm text-muted-foreground">تغيير مظهر التطبيق</div>
              </div>
              <Switch />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">حفظ البيانات</div>
                <div className="text-sm text-muted-foreground">تقليل استهلاك البيانات</div>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Teacher Subscription */}
        {user.is_teacher && !user.teacher_subscription && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center ml-3">
                    <i className="fas fa-crown text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900">اشتراك المعلم المميز</h3>
                    <p className="text-sm text-blue-700">احصل على مميزات إضافية وطباعة مجانية</p>
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-blue-600 arabic-nums">٩٩</div>
                  <div className="text-xs text-blue-700">جنيه/شهرياً</div>
                </div>
              </div>
              <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                اشترك الآن
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Sign Out */}
        <Card>
          <CardContent className="p-6">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleSignOut}
            >
              <i className="fas fa-sign-out-alt ml-2"></i>
              تسجيل الخروج
            </Button>
          </CardContent>
        </Card>
      </main>
      
      <BottomNav />
    </div>
  );
}
