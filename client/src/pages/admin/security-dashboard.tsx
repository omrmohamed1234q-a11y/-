import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Users, 
  UserPlus, 
  Truck, 
  Settings, 
  AlertTriangle, 
  Eye, 
  Lock, 
  Unlock,
  Activity,
  Calendar,
  MapPin,
  Phone
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface SecurityUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'driver';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  driverCode?: string;
  vehicleType?: string;
  workingArea?: string;
  permissions?: string[];
}

interface SecurityLog {
  id: string;
  userId: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
  details?: string;
}

export default function SecurityDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'admin' as 'admin' | 'driver',
    driverCode: '',
    vehicleType: '',
    workingArea: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch security users
  const { data: users = [], isLoading: usersLoading } = useQuery<SecurityUser[]>({
    queryKey: ['/api/admin/security/users']
  });

  // Fetch security logs
  const { data: logs = [], isLoading: logsLoading } = useQuery<SecurityLog[]>({
    queryKey: ['/api/admin/security/logs']
  });

  // Create new user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const response = await apiRequest('POST', '/api/admin/security/create-user', userData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ تم إنشاء المستخدم بنجاح",
        description: "تم إضافة المستخدم الجديد إلى النظام الآمن"
      });
      setNewUser({
        username: '',
        email: '',
        password: '',
        fullName: '',
        role: 'admin',
        driverCode: '',
        vehicleType: '',
        workingArea: ''
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/security/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء المستخدم",
        description: error.message || "حدث خطأ أثناء إنشاء المستخدم",
        variant: "destructive"
      });
    }
  });

  // Toggle user status mutation
  const toggleUserMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await apiRequest('PUT', `/api/admin/security/users/${userId}/status`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تحديث حالة المستخدم",
        description: "تم تغيير حالة المستخدم بنجاح"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/security/users'] });
    }
  });

  const handleCreateUser = () => {
    if (!newUser.username || !newUser.email || !newUser.password || !newUser.fullName) {
      toast({
        title: "خطأ في البيانات",
        description: "جميع الحقول الأساسية مطلوبة",
        variant: "destructive"
      });
      return;
    }

    if (newUser.role === 'driver' && (!newUser.driverCode || !newUser.vehicleType || !newUser.workingArea)) {
      toast({
        title: "خطأ في بيانات السائق",
        description: "جميع بيانات السائق مطلوبة",
        variant: "destructive"
      });
      return;
    }

    createUserMutation.mutate(newUser);
  };

  const adminUsers = users.filter(user => user.role === 'admin');
  const driverUsers = users.filter(user => user.role === 'driver');

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-600" />
            لوحة الأمان المتقدمة
          </h1>
          <p className="text-gray-600 mt-2">إدارة شاملة لحسابات النظام وسجلات الأمان</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-4 py-2">
            <Activity className="w-4 h-4 ml-2" />
            {users.length} مستخدم نشط
          </Badge>
          <Badge variant="outline" className="px-4 py-2">
            <Calendar className="w-4 h-4 ml-2" />
            {logs.length} عملية أمان
          </Badge>
        </div>
      </div>

      {/* Security Alert */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          هذه منطقة أمان عالية المستوى. جميع العمليات يتم تسجيلها ومراقبتها.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="admins">إدارة المديرين</TabsTrigger>
          <TabsTrigger value="drivers">إدارة السائقين</TabsTrigger>
          <TabsTrigger value="logs">سجلات الأمان</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">المديرين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{adminUsers.length}</div>
                <p className="text-xs text-gray-500">مدير نشط</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">السائقين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{driverUsers.length}</div>
                <p className="text-xs text-gray-500">سائق نشط</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">عمليات الأمان</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{logs.length}</div>
                <p className="text-xs text-gray-500">عملية مسجلة</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>النشاط الأخير</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${log.success ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-gray-600">{log.ipAddress}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString('ar-EG')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admins Tab */}
        <TabsContent value="admins" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Add New Admin */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  إضافة مدير جديد
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>اسم المستخدم</Label>
                  <Input
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    placeholder="أدخل اسم المستخدم"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="أدخل البريد الإلكتروني"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>كلمة المرور</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="أدخل كلمة مرور قوية"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>الاسم الكامل</Label>
                  <Input
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                    placeholder="أدخل الاسم الكامل"
                  />
                </div>
                
                <Button 
                  onClick={() => {
                    setNewUser({...newUser, role: 'admin'});
                    handleCreateUser();
                  }}
                  disabled={createUserMutation.isPending}
                  className="w-full"
                >
                  {createUserMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء حساب مدير'}
                </Button>
              </CardContent>
            </Card>

            {/* Current Admins */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  المديرين الحاليين ({adminUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {adminUsers.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{admin.fullName}</p>
                        <p className="text-sm text-gray-600">{admin.email}</p>
                        <p className="text-xs text-gray-500">آخر دخول: {admin.lastLogin ? new Date(admin.lastLogin).toLocaleString('ar-EG') : 'لم يسجل دخول'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={admin.isActive}
                          onCheckedChange={(checked) => toggleUserMutation.mutate({ userId: admin.id, isActive: checked })}
                        />
                        <Badge variant={admin.isActive ? "default" : "secondary"}>
                          {admin.isActive ? 'نشط' : 'معطل'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent value="drivers" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Add New Driver */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  إضافة سائق جديد
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم المستخدم</Label>
                    <Input
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      placeholder="اسم المستخدم"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>كود السائق</Label>
                    <Input
                      value={newUser.driverCode}
                      onChange={(e) => setNewUser({...newUser, driverCode: e.target.value})}
                      placeholder="DR001"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="البريد الإلكتروني"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>كلمة المرور</Label>
                  <Input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="كلمة المرور"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>الاسم الكامل</Label>
                  <Input
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                    placeholder="الاسم الكامل"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>نوع المركبة</Label>
                    <Select value={newUser.vehicleType} onValueChange={(value) => setNewUser({...newUser, vehicleType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع المركبة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="motorcycle">دراجة نارية</SelectItem>
                        <SelectItem value="car">سيارة</SelectItem>
                        <SelectItem value="van">فان</SelectItem>
                        <SelectItem value="truck">شاحنة صغيرة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>منطقة العمل</Label>
                    <Input
                      value={newUser.workingArea}
                      onChange={(e) => setNewUser({...newUser, workingArea: e.target.value})}
                      placeholder="القاهرة - مدينة نصر"
                    />
                  </div>
                </div>
                
                <Button 
                  onClick={() => {
                    setNewUser({...newUser, role: 'driver'});
                    handleCreateUser();
                  }}
                  disabled={createUserMutation.isPending}
                  className="w-full"
                >
                  {createUserMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء حساب سائق'}
                </Button>
              </CardContent>
            </Card>

            {/* Current Drivers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  السائقين الحاليين ({driverUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {driverUsers.map((driver) => (
                    <div key={driver.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{driver.fullName}</p>
                        <p className="text-sm text-gray-600">{driver.email}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span>كود: {driver.driverCode}</span>
                          <span className="flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            {driver.vehicleType}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {driver.workingArea}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={driver.isActive}
                          onCheckedChange={(checked) => toggleUserMutation.mutate({ userId: driver.id, isActive: checked })}
                        />
                        <Badge variant={driver.isActive ? "default" : "secondary"}>
                          {driver.isActive ? 'نشط' : 'معطل'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                سجلات الأمان والمراقبة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${log.success ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="font-medium">{log.action}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>IP: {log.ipAddress}</span>
                            <span>المستخدم: {log.userId}</span>
                          </div>
                          {log.details && (
                            <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleString('ar-EG')}
                      </div>
                    </div>
                  ))}
                  
                  {logs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      لا توجد سجلات أمان حتى الآن
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}