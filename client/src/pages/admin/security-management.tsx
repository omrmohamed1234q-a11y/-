import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Truck, Plus, Eye, UserPlus, Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface SecureAdmin {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

interface SecureCaptain {
  id: string;
  username: string;
  email: string;
  fullName: string;
  driverCode: string;
  phone: string;
  vehicleType: string;
  vehiclePlate: string;
  isActive: boolean;
  status: string;
  lastLogin: string | null;
  rating: number;
  totalDeliveries: number;
  createdAt: string;
}

interface SecurityLog {
  id: string;
  userId: string;
  userType: 'admin' | 'captain';
  action: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
}

export default function SecurityManagement() {
  const [secureAdmins, setSecureAdmins] = useState<SecureAdmin[]>([]);
  const [secureCaptains, setSecureCaptains] = useState<SecureCaptain[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'admins' | 'captains' | 'logs'>('admins');
  const { toast } = useToast();

  // Admin Form State
  const [adminForm, setAdminForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'admin',
    permissions: ['read', 'write']
  });

  // Captain Form State
  const [captainForm, setCaptainForm] = useState({
    username: '',
    email: '',
    password: '',
    driverCode: '',
    fullName: '',
    phone: '',
    licenseNumber: '',
    vehicleType: 'motorcycle',
    vehiclePlate: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [adminsRes, driversRes, logsRes] = await Promise.all([
        apiRequest('GET', '/api/admin/secure-admins'),
        apiRequest('GET', '/api/admin/secure-captains'),
        apiRequest('GET', '/api/admin/security-logs?limit=50')
      ]);

      setSecureAdmins(await adminsRes.json());
      setSecureCaptains(await driversRes.json());
      setSecurityLogs(await logsRes.json());
    } catch (error) {
      toast({
        title: 'خطأ في تحميل البيانات',
        description: 'فشل في تحميل بيانات الأمان',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!adminForm.username || !adminForm.email || !adminForm.password || !adminForm.fullName) {
      toast({
        title: 'خطأ في النموذج',
        description: 'جميع الحقول مطلوبة',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest('POST', '/api/admin/secure-admins', adminForm);
      const result = await response.json();

      if (result.success) {
        toast({
          title: 'تم إنشاء حساب الإدارة',
          description: `تم إنشاء حساب ${result.admin.username} بنجاح`
        });
        setAdminForm({
          username: '',
          email: '',
          password: '',
          fullName: '',
          role: 'admin',
          permissions: ['read', 'write']
        });
        fetchData();
      } else {
        toast({
          title: 'فشل في إنشاء الحساب',
          description: result.message || 'حدث خطأ غير متوقع',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ في الشبكة',
        description: 'فشل في إنشاء حساب الإدارة',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCaptain = async () => {
    if (!captainForm.username || !captainForm.email || !captainForm.password || 
        !captainForm.driverCode || !captainForm.fullName || !captainForm.phone ||
        !captainForm.licenseNumber || !captainForm.vehiclePlate) {
      toast({
        title: 'خطأ في النموذج',
        description: 'جميع الحقول مطلوبة',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest('POST', '/api/admin/secure-captains', captainForm);
      const result = await response.json();

      if (result.success) {
        toast({
          title: 'تم إنشاء حساب الكبتن',
          description: `تم إنشاء حساب ${result.captain.username} بنجاح`
        });
        setCaptainForm({
          username: '',
          email: '',
          password: '',
          driverCode: '',
          fullName: '',
          phone: '',
          licenseNumber: '',
          vehicleType: 'motorcycle',
          vehiclePlate: ''
        });
        fetchData();
      } else {
        toast({
          title: 'فشل في إنشاء الحساب',
          description: result.message || 'حدث خطأ غير متوقع',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ في الشبكة',
        description: 'فشل في إنشاء حساب الكبتن',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ar-EG');
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'successful_login':
        return <Badge variant="default" className="bg-green-100 text-green-800">دخول ناجح</Badge>;
      case 'failed_login':
        return <Badge variant="destructive">دخول فاشل</Badge>;
      case 'create_admin':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">إنشاء إدارة</Badge>;
      case 'create_driver':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">إنشاء سائق</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الأمان المتقدم</h1>
        <p className="text-gray-600">إدارة حسابات الإدارة والسائقين وسجلات الأمان</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-4 mb-6">
        <Button
          variant={activeTab === 'admins' ? 'default' : 'outline'}
          onClick={() => setActiveTab('admins')}
          className="flex items-center gap-2"
        >
          <Shield className="w-4 h-4" />
          حسابات الإدارة ({secureAdmins.length})
        </Button>
        <Button
          variant={activeTab === 'drivers' ? 'default' : 'outline'}
          onClick={() => setActiveTab('drivers')}
          className="flex items-center gap-2"
        >
          <Truck className="w-4 h-4" />
          حسابات السائقين ({secureDrivers.length})
        </Button>
        <Button
          variant={activeTab === 'logs' ? 'default' : 'outline'}
          onClick={() => setActiveTab('logs')}
          className="flex items-center gap-2"
        >
          <Activity className="w-4 h-4" />
          سجلات الأمان ({securityLogs.length})
        </Button>
      </div>

      {/* Admins Tab */}
      {activeTab === 'admins' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">حسابات الإدارة الآمنة</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  إضافة حساب إدارة جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>إنشاء حساب إدارة جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="admin-username">اسم المستخدم</Label>
                    <Input
                      id="admin-username"
                      value={adminForm.username}
                      onChange={(e) => setAdminForm({...adminForm, username: e.target.value})}
                      placeholder="أدخل اسم المستخدم"
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin-email">البريد الإلكتروني</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm({...adminForm, email: e.target.value})}
                      placeholder="أدخل البريد الإلكتروني"
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin-password">كلمة المرور</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({...adminForm, password: e.target.value})}
                      placeholder="كلمة مرور قوية (8 أحرف على الأقل)"
                      minLength={8}
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin-fullname">الاسم الكامل</Label>
                    <Input
                      id="admin-fullname"
                      value={adminForm.fullName}
                      onChange={(e) => setAdminForm({...adminForm, fullName: e.target.value})}
                      placeholder="أدخل الاسم الكامل"
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin-role">الدور</Label>
                    <Select value={adminForm.role} onValueChange={(value) => setAdminForm({...adminForm, role: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">مدير</SelectItem>
                        <SelectItem value="super_admin">مدير عام</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleCreateAdmin} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'جاري الإنشاء...' : 'إنشاء حساب الإدارة'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {secureAdmins.map((admin) => (
              <Card key={admin.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <Shield className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{admin.fullName}</h3>
                        <p className="text-gray-600">@{admin.username} • {admin.email}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{admin.role}</Badge>
                          {admin.isActive ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              نشط
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              معطل
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>آخر دخول: {admin.lastLogin ? formatDate(admin.lastLogin) : 'لم يدخل بعد'}</p>
                      <p>تاريخ الإنشاء: {formatDate(admin.createdAt)}</p>
                      <div className="flex gap-1 mt-2">
                        {admin.permissions.map((perm) => (
                          <Badge key={perm} variant="secondary" className="text-xs">{perm}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Drivers Tab */}
      {activeTab === 'drivers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">حسابات السائقين الآمنة</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  إضافة حساب سائق جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>إنشاء حساب سائق جديد</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="driver-username">اسم المستخدم</Label>
                    <Input
                      id="driver-username"
                      value={driverForm.username}
                      onChange={(e) => setDriverForm({...driverForm, username: e.target.value})}
                      placeholder="أدخل اسم المستخدم"
                    />
                  </div>
                  <div>
                    <Label htmlFor="driver-email">البريد الإلكتروني</Label>
                    <Input
                      id="driver-email"
                      type="email"
                      value={driverForm.email}
                      onChange={(e) => setDriverForm({...driverForm, email: e.target.value})}
                      placeholder="أدخل البريد الإلكتروني"
                    />
                  </div>
                  <div>
                    <Label htmlFor="driver-code">كود السائق</Label>
                    <Input
                      id="driver-code"
                      value={driverForm.driverCode}
                      onChange={(e) => setDriverForm({...driverForm, driverCode: e.target.value})}
                      placeholder="كود فريد للسائق (6 أحرف على الأقل)"
                      minLength={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="driver-password">كلمة المرور</Label>
                    <Input
                      id="driver-password"
                      type="password"
                      value={driverForm.password}
                      onChange={(e) => setDriverForm({...driverForm, password: e.target.value})}
                      placeholder="كلمة مرور قوية (8 أحرف على الأقل)"
                      minLength={8}
                    />
                  </div>
                  <div>
                    <Label htmlFor="driver-fullname">الاسم الكامل</Label>
                    <Input
                      id="driver-fullname"
                      value={driverForm.fullName}
                      onChange={(e) => setDriverForm({...driverForm, fullName: e.target.value})}
                      placeholder="أدخل الاسم الكامل"
                    />
                  </div>
                  <div>
                    <Label htmlFor="driver-phone">رقم الهاتف</Label>
                    <Input
                      id="driver-phone"
                      value={driverForm.phone}
                      onChange={(e) => setDriverForm({...driverForm, phone: e.target.value})}
                      placeholder="أدخل رقم الهاتف"
                    />
                  </div>
                  <div>
                    <Label htmlFor="driver-license">رقم الرخصة</Label>
                    <Input
                      id="driver-license"
                      value={driverForm.licenseNumber}
                      onChange={(e) => setDriverForm({...driverForm, licenseNumber: e.target.value})}
                      placeholder="أدخل رقم رخصة القيادة"
                    />
                  </div>
                  <div>
                    <Label htmlFor="driver-vehicle-type">نوع المركبة</Label>
                    <Select value={driverForm.vehicleType} onValueChange={(value) => setDriverForm({...driverForm, vehicleType: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="motorcycle">دراجة نارية</SelectItem>
                        <SelectItem value="car">سيارة</SelectItem>
                        <SelectItem value="truck">شاحنة صغيرة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="driver-plate">رقم اللوحة</Label>
                    <Input
                      id="driver-plate"
                      value={driverForm.vehiclePlate}
                      onChange={(e) => setDriverForm({...driverForm, vehiclePlate: e.target.value})}
                      placeholder="أدخل رقم لوحة المركبة"
                    />
                  </div>
                  <Button 
                    onClick={handleCreateDriver} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'جاري الإنشاء...' : 'إنشاء حساب السائق'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {secureDrivers.map((driver) => (
              <Card key={driver.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Truck className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{driver.fullName}</h3>
                        <p className="text-gray-600">@{driver.username} • {driver.driverCode}</p>
                        <p className="text-gray-500 text-sm">{driver.email} • {driver.phone}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{driver.vehicleType}</Badge>
                          <Badge variant="outline">{driver.vehiclePlate}</Badge>
                          {driver.isActive ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              نشط
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              معطل
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>الحالة: <Badge variant={driver.status === 'online' ? 'default' : 'secondary'}>{driver.status}</Badge></p>
                      <p>التقييم: ⭐ {driver.rating}/5.0</p>
                      <p>التوصيلات: {driver.totalDeliveries}</p>
                      <p>آخر دخول: {driver.lastLogin ? formatDate(driver.lastLogin) : 'لم يدخل بعد'}</p>
                      <p>تاريخ الإنشاء: {formatDate(driver.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Security Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">سجلات الأمان</h2>
            <Button onClick={fetchData} variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              تحديث السجلات
            </Button>
          </div>

          <div className="grid gap-3">
            {securityLogs.map((log) => (
              <Card key={log.id} className={`border-r-4 ${
                log.success ? 'border-r-green-500' : 'border-r-red-500'
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        log.success ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {log.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {getActionBadge(log.action)}
                          <Badge variant="outline">
                            {log.userType === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <Truck className="w-3 h-3 mr-1" />}
                            {log.userType === 'admin' ? 'إدارة' : 'سائق'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          IP: {log.ipAddress} • {log.userAgent?.substring(0, 50)}...
                        </p>
                        {log.errorMessage && (
                          <p className="text-sm text-red-600 mt-1">خطأ: {log.errorMessage}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>{formatDate(log.createdAt)}</p>
                      <p className="text-xs">المستخدم: {log.userId}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {securityLogs.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد سجلات أمان</h3>
                <p className="text-gray-500">لم يتم تسجيل أي أنشطة أمان حتى الآن</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <p className="mt-2 text-gray-600">جاري التحميل...</p>
        </div>
      )}
    </div>
  );
}