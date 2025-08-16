import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Header from '@/components/layout/header';
import BottomNav from '@/components/layout/bottom-nav';
import { useToast } from '@/hooks/use-toast';
import {
  User, Star, Award, Printer, ShoppingBag, LogOut, Settings,
  Phone, Mail, Calendar, MapPin, Edit, Save, X, Trophy,
  Gift, Zap, Target, TrendingUp
} from 'lucide-react';

export default function Profile() {
  const { user, signOut } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "تم تسجيل الخروج بنجاح",
        description: "شكراً لاستخدام منصة اطبعلي",
      });
      setLocation('/');
    } catch (error) {
      toast({
        title: "خطأ في تسجيل الخروج",
        description: "حدث خطأ أثناء تسجيل الخروج، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    }
  };

  const handleSaveProfile = () => {
    // Here you would typically save to the backend
    toast({
      title: "تم حفظ البيانات",
      description: "تم تحديث بياناتك الشخصية بنجاح",
    });
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    if (!name || name.length === 0) return 'م';
    return name.split(' ').map(n => n && n.length > 0 ? n.charAt(0) : '').join('').slice(0, 2).toUpperCase() || 'م';
  };

  const achievements = [
    { title: 'مستخدم نشط', description: 'أكمل 10 طلبات طباعة', icon: Printer, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { title: 'عضو ذهبي', description: 'وصل للمستوى 5', icon: Trophy, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { title: 'صديق المنصة', description: 'دعا 3 أصدقاء', icon: User, color: 'text-green-600', bgColor: 'bg-green-50' },
  ];

  const stats = [
    { label: 'نقاط البونص', value: user?.bountyPoints || 0, icon: Star, color: 'text-yellow-500' },
    { label: 'المستوى', value: user?.level || 1, icon: Award, color: 'text-blue-500' },
    { label: 'إجمالي الطباعة', value: user?.totalPrints || 0, icon: Printer, color: 'text-green-500' },
    { label: 'المشتريات', value: user?.totalPurchases || 0, icon: ShoppingBag, color: 'text-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
      <Header />
      
      <div className="container mx-auto px-4 py-6 pb-20">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 space-x-reverse mb-6">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user?.profileImageUrl} />
                <AvatarFallback className="text-2xl bg-gradient-to-r from-red-500 to-red-600 text-white">
                  {getInitials(user?.fullName || 'مستخدم')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">
                  {user?.fullName || 'مستخدم عزيز'}
                </h1>
                <p className="text-gray-600 mb-2">{user?.email}</p>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'}>
                    {user?.role === 'admin' ? 'مدير' : 'عضو'}
                  </Badge>
                  {user?.isTeacher && (
                    <Badge className="bg-green-100 text-green-800">معلم</Badge>
                  )}
                  {user?.teacherSubscription && (
                    <Badge className="bg-yellow-100 text-yellow-800">اشتراك مميز</Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  data-testid="button-edit-profile"
                >
                  {isEditing ? <X className="w-4 h-4 ml-2" /> : <Edit className="w-4 h-4 ml-2" />}
                  {isEditing ? 'إلغاء' : 'تعديل'}
                </Button>
              </div>
            </div>

            {/* Logout Button */}
            <div className="border-t pt-4">
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 ml-2" />
                تسجيل الخروج
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <User className="w-5 h-5" />
              <span>المعلومات الشخصية</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">الاسم الكامل</Label>
                  <Input
                    id="fullName"
                    value={editedProfile.fullName}
                    onChange={(e) => setEditedProfile({...editedProfile, fullName: e.target.value})}
                    data-testid="input-fullname"
                  />
                </div>
                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editedProfile.email}
                    onChange={(e) => setEditedProfile({...editedProfile, email: e.target.value})}
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={editedProfile.phone}
                    onChange={(e) => setEditedProfile({...editedProfile, phone: e.target.value})}
                    placeholder="مثال: +966501234567"
                    data-testid="input-phone"
                  />
                </div>
                <Button onClick={handleSaveProfile} className="w-full" data-testid="button-save-profile">
                  <Save className="w-4 h-4 ml-2" />
                  حفظ التغييرات
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">البريد الإلكتروني:</span>
                  <span className="font-medium" data-testid="text-email">{user?.email}</span>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">رقم الهاتف:</span>
                  <span className="font-medium" data-testid="text-phone">
                    {user?.phone || 'غير محدد'}
                  </span>
                </div>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">تاريخ الانضمام:</span>
                  <span className="font-medium" data-testid="text-join-date">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-4">
                <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold text-gray-800" data-testid={`stat-${stat.label.replace(/\s+/g, '-')}`}>
                  {stat.value.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Achievements */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Trophy className="w-5 h-5" />
              <span>الإنجازات</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {achievements.map((achievement, index) => (
                <div key={index} className={`p-4 rounded-lg ${achievement.bgColor}`}>
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <achievement.icon className={`w-8 h-8 ${achievement.color}`} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800" data-testid={`achievement-${index}`}>
                        {achievement.title}
                      </h4>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                    </div>
                    <Badge className="bg-white bg-opacity-80">✓</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Settings className="w-5 h-5" />
              <span>الإعدادات السريعة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" data-testid="button-notifications">
                <Gift className="w-4 h-4 ml-2" />
                إعدادات الإشعارات
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-privacy">
                <Settings className="w-4 h-4 ml-2" />
                إعدادات الخصوصية
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-help">
                <Target className="w-4 h-4 ml-2" />
                الدعم والمساعدة
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <TrendingUp className="w-5 h-5" />
              <span>التقدم نحو المستوى التالي</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">المستوى {user?.level || 1}</span>
                <span className="text-sm text-gray-600">المستوى {(user?.level || 1) + 1}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${((user?.bountyPoints || 0) % 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                تحتاج إلى {100 - ((user?.bountyPoints || 0) % 100)} نقطة للوصول للمستوى التالي
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}