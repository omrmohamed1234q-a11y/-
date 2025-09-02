import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, Activity, Plus, Eye, EyeOff, UserCheck, UserX, Clock } from 'lucide-react';

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
}

interface SecurityLog {
  id: string;
  user_id: string;
  action: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
  timestamp: string;
  details?: string;
}

export default function SecureSecurityDashboard() {
  const [users, setUsers] = useState<SecurityUser[]>([]);
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    role: 'admin',
    username: '',
    email: '',
    password: '',
    fullName: '',
    driverCode: '',
    vehicleType: '',
    workingArea: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const [usersResponse, logsResponse] = await Promise.all([
        fetch('/api/admin/security/users', {
          headers: { 'Authorization': 'Bearer admin-token' }
        }),
        fetch('/api/admin/security/logs', {
          headers: { 'Authorization': 'Bearer admin-token' }
        })
      ]);

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }

      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setLogs(logsData);
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات الأمان",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password || !newUser.fullName) {
      toast({
        title: "خطأ",
        description: "جميع الحقول مطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (newUser.role === 'driver' && !newUser.driverCode) {
      toast({
        title: "خطأ",
        description: "رقم السائق مطلوب",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/security/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "نجح",
          description: `تم إنشاء ${newUser.role === 'admin' ? 'المدير' : 'السائق'} بنجاح`,
        });
        setNewUser({
          role: 'admin',
          username: '',
          email: '',
          password: '',
          fullName: '',
          driverCode: '',
          vehicleType: '',
          workingArea: ''
        });
        setShowCreateForm(false);
        fetchSecurityData();
      } else {
        throw new Error(data.error || 'فشل في إنشاء المستخدم');
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : 'فشل في إنشاء المستخدم',
        variant: "destructive",
      });
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/security/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        toast({
          title: "نجح",
          description: `تم ${!currentStatus ? 'تفعيل' : 'إلغاء تفعيل'} المستخدم`,
        });
        fetchSecurityData();
      } else {
        throw new Error('فشل في تحديث حالة المستخدم');
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: error instanceof Error ? error.message : 'فشل في تحديث حالة المستخدم',
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل لوحة الأمان...</p>
        </div>
      </div>
    );
  }

  const adminUsers = users.filter(u => u.role === 'admin');
  const driverUsers = users.filter(u => u.role === 'driver');
  const recentLogs = logs.slice(0, 10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-600" />
                إدارة السائقين والمديرين
              </h1>
              <p className="text-gray-600 mt-2">إدارة المديرين والسائقين ومراقبة النشاط الأمني</p>
            </div>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-create-user"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة مستخدم جديد
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي المديرين</p>
                  <p className="text-2xl font-bold text-blue-600" data-testid="text-admin-count">{adminUsers.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">إجمالي السائقين</p>
                  <p className="text-2xl font-bold text-green-600" data-testid="text-driver-count">{driverUsers.length}</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">المستخدمين النشطين</p>
                  <p className="text-2xl font-bold text-purple-600" data-testid="text-active-count">
                    {users.filter(u => u.isActive).length}
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">أحداث الأمان اليوم</p>
                  <p className="text-2xl font-bold text-orange-600" data-testid="text-events-count">{logs.length}</p>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">إدارة المستخدمين</TabsTrigger>
            <TabsTrigger value="logs">سجل الأمان</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            {/* Admins Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  المديرين
                </CardTitle>
                <CardDescription>إدارة حسابات المديرين</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adminUsers.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`admin-${admin.id}`}>
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold">{admin.fullName}</h3>
                          <p className="text-sm text-gray-600">@{admin.username}</p>
                          <p className="text-sm text-gray-600">{admin.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={admin.isActive ? "default" : "secondary"}>
                          {admin.isActive ? "نشط" : "معطل"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatus(admin.id, admin.isActive)}
                          data-testid={`button-toggle-admin-${admin.id}`}
                        >
                          {admin.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Drivers Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  السائقين
                </CardTitle>
                <CardDescription>إدارة حسابات السائقين</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {driverUsers.map((driver) => (
                    <div key={driver.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`driver-${driver.id}`}>
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold">{driver.fullName}</h3>
                          <p className="text-sm text-gray-600">@{driver.username}</p>
                          <p className="text-sm text-gray-600">{driver.email}</p>
                          {driver.driverCode && (
                            <p className="text-sm text-blue-600">رقم السائق: {driver.driverCode}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={driver.isActive ? "default" : "secondary"}>
                          {driver.isActive ? "نشط" : "معطل"}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatus(driver.id, driver.isActive)}
                          data-testid={`button-toggle-driver-${driver.id}`}
                        >
                          {driver.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  سجل الأمان
                </CardTitle>
                <CardDescription>آخر الأحداث الأمنية</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`log-${log.id}`}>
                      <div className="flex items-center gap-4">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">{log.action}</p>
                          <p className="text-sm text-gray-600">IP: {log.ip_address}</p>
                          <p className="text-sm text-gray-600">{new Date(log.timestamp).toLocaleString('ar-EG')}</p>
                        </div>
                      </div>
                      <Badge variant={log.success ? "default" : "destructive"}>
                        {log.success ? "نجح" : "فشل"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create User Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="modal-create-user">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>إضافة مستخدم جديد</CardTitle>
                <CardDescription>إنشاء حساب مدير أو سائق جديد</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="role">النوع</Label>
                  <Select value={newUser.role} onValueChange={(value: 'admin' | 'driver') => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">مدير</SelectItem>
                      <SelectItem value="driver">سائق</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="username">اسم المستخدم</Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    data-testid="input-username"
                  />
                </div>

                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    data-testid="input-email"
                  />
                </div>

                <div>
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    data-testid="input-password"
                  />
                </div>

                <div>
                  <Label htmlFor="fullName">الاسم الكامل</Label>
                  <Input
                    id="fullName"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                    data-testid="input-fullname"
                  />
                </div>

                {newUser.role === 'driver' && (
                  <>
                    <div>
                      <Label htmlFor="driverCode">رقم السائق</Label>
                      <Input
                        id="driverCode"
                        value={newUser.driverCode}
                        onChange={(e) => setNewUser({ ...newUser, driverCode: e.target.value })}
                        data-testid="input-driver-code"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vehicleType">نوع المركبة</Label>
                      <Input
                        id="vehicleType"
                        value={newUser.vehicleType}
                        onChange={(e) => setNewUser({ ...newUser, vehicleType: e.target.value })}
                        data-testid="input-vehicle-type"
                      />
                    </div>
                    <div>
                      <Label htmlFor="workingArea">منطقة العمل</Label>
                      <Input
                        id="workingArea"
                        value={newUser.workingArea}
                        onChange={(e) => setNewUser({ ...newUser, workingArea: e.target.value })}
                        data-testid="input-working-area"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateUser} className="flex-1" data-testid="button-save-user">
                    إنشاء
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)} className="flex-1" data-testid="button-cancel">
                    إلغاء
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}