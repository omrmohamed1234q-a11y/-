import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { apiRequest } from '@/lib/queryClient';
import {
  Truck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Star,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Filter
} from 'lucide-react';
import { Link } from 'wouter';

interface Driver {
  id: string;
  name: string;
  username: string;
  email?: string; // Made optional
  phone: string;
  vehicleType: 'motorcycle' | 'car' | 'truck';
  vehiclePlate: string;
  status: 'online' | 'offline' | 'busy';
  isAvailable: boolean;
  rating: string;
  ratingCount: number;
  totalDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  earnings: string;
  workingArea: string;
  isVerified: boolean;
  documentsVerified: boolean;
  driverCode: string;
  createdAt: string;
}

interface NewDriverForm {
  name: string;
  username: string;
  email: string; // Optional
  phone: string;
  vehicleType: 'motorcycle' | 'car' | 'truck';
  vehiclePlate: string;
  workingArea: string;
  password: string;
}

export default function DriversManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDriver, setNewDriver] = useState<NewDriverForm>({
    name: '',
    username: '',
    email: '',
    phone: '',
    vehicleType: 'motorcycle',
    vehiclePlate: '',
    workingArea: 'القاهرة الكبرى',
    password: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch captains
  const { data: drivers = [], isLoading } = useQuery<Driver[]>({
    queryKey: ['/api/admin/captains'],
    retry: false
  });

  // Create captain mutation
  const createDriverMutation = useMutation({
    mutationFn: async (driverData: NewDriverForm) => {
      return apiRequest('POST', '/api/admin/captains', driverData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/captains'] });
      setShowAddDialog(false);
      setNewDriver({
        name: '',
        username: '',
        email: '',
        phone: '',
        vehicleType: 'motorcycle',
        vehiclePlate: '',
        workingArea: 'القاهرة الكبرى',
        password: ''
      });
      toast({
        title: "تم إنشاء حساب الكبتن",
        description: "تم إضافة الكبتن الجديد بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في إنشاء الحساب",
        description: error.message || "فشل في إنشاء حساب الكبتن",
        variant: "destructive",
      });
    }
  });

  // Delete captain mutation
  const deleteDriverMutation = useMutation({
    mutationFn: async (driverId: string) => {
      return apiRequest('DELETE', `/api/admin/captains/${driverId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/captains'] });
      toast({
        title: "تم حذف الكبتن",
        description: "تم حذف الكبتن بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في الحذف",
        description: error.message || "فشل في حذف الكبتن",
        variant: "destructive",
      });
    }
  });

  // Filter drivers
  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (driver.email && driver.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         driver.driverCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateDriver = () => {
    if (!newDriver.name || !newDriver.username || !newDriver.phone) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة (الاسم، اسم المستخدم، رقم الهاتف)",
        variant: "destructive",
      });
      return;
    }

    createDriverMutation.mutate(newDriver);
  };

  const getStatusBadge = (status: string, isAvailable: boolean) => {
    if (status === 'online' && isAvailable) {
      return <Badge className="bg-green-100 text-green-800">متاح</Badge>;
    } else if (status === 'online' && !isAvailable) {
      return <Badge className="bg-yellow-100 text-yellow-800">مشغول</Badge>;
    } else {
      return <Badge variant="secondary">غير متصل</Badge>;
    }
  };

  const getVehicleTypeText = (type: string) => {
    switch (type) {
      case 'motorcycle': return 'دراجة نارية';
      case 'car': return 'سيارة';
      case 'truck': return 'شاحنة';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل بيانات الكباتن...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              العودة للوحة التحكم
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
              <Truck className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">إدارة الكباتن والمديرين</h1>
              <p className="text-gray-600">نظام الأمان المتقدم لإدارة الحسابات الآمنة</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">إجمالي السائقين</p>
                  <p className="text-2xl font-bold text-gray-900">{drivers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">سائقين متاحين</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {drivers.filter(d => d.status === 'online' && d.isAvailable).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">سائقين مشغولين</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {drivers.filter(d => d.status === 'online' && !d.isAvailable).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">غير متصلين</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {drivers.filter(d => d.status === 'offline').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث بالاسم، اسم المستخدم، الإيميل، أو رقم السائق..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 ml-2" />
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="online">متصل</SelectItem>
                <SelectItem value="offline">غير متصل</SelectItem>
                <SelectItem value="busy">مشغول</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة سائق جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>إضافة سائق جديد</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">الاسم الكامل</Label>
                  <Input
                    id="name"
                    value={newDriver.name}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="أدخل اسم السائق"
                  />
                </div>

                <div>
                  <Label htmlFor="username">اسم المستخدم</Label>
                  <Input
                    id="username"
                    value={newDriver.username}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="اسم المستخدم للسائق (للدخول للنظام)"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newDriver.email}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="example@email.com (اختياري)"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    value={newDriver.phone}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="01xxxxxxxxx"
                  />
                </div>

                <div>
                  <Label htmlFor="vehicleType">نوع المركبة</Label>
                  <Select 
                    value={newDriver.vehicleType} 
                    onValueChange={(value: 'motorcycle' | 'car' | 'truck') => 
                      setNewDriver(prev => ({ ...prev, vehicleType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="motorcycle">دراجة نارية</SelectItem>
                      <SelectItem value="car">سيارة</SelectItem>
                      <SelectItem value="truck">شاحنة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="vehiclePlate">رقم اللوحة</Label>
                  <Input
                    id="vehiclePlate"
                    value={newDriver.vehiclePlate}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, vehiclePlate: e.target.value }))}
                    placeholder="أ ب ج 123"
                  />
                </div>

                <div>
                  <Label htmlFor="workingArea">منطقة العمل</Label>
                  <Input
                    id="workingArea"
                    value={newDriver.workingArea}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, workingArea: e.target.value }))}
                    placeholder="القاهرة الكبرى"
                  />
                </div>

                <div>
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newDriver.password}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="كلمة مرور قوية"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleCreateDriver}
                    disabled={createDriverMutation.isPending}
                    className="flex-1"
                  >
                    {createDriverMutation.isPending ? "جاري الإنشاء..." : "إنشاء الحساب"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddDialog(false)}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Drivers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDrivers.map((driver, index) => (
          <motion.div
            key={driver.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Truck className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-right">{driver.name}</CardTitle>
                      <p className="text-sm text-gray-500">{driver.driverCode}</p>
                    </div>
                  </div>
                  {getStatusBadge(driver.status, driver.isAvailable)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-4 h-4 text-gray-400 text-center">@</span>
                    <span className="text-gray-600">{driver.username}</span>
                  </div>
                  
                  {driver.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{driver.email}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{driver.phone}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{driver.workingArea}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">نوع المركبة</p>
                    <p className="font-medium">{getVehicleTypeText(driver.vehicleType)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">رقم اللوحة</p>
                    <p className="font-medium">{driver.vehiclePlate || 'غير محدد'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-medium">{driver.rating}</span>
                    </div>
                    <p className="text-gray-500">التقييم</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{driver.completedDeliveries}</p>
                    <p className="text-gray-500">مكتملة</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{driver.earnings} جنيه</p>
                    <p className="text-gray-500">الأرباح</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Edit2 className="w-4 h-4" />
                    تعديل
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 text-red-600 hover:text-red-700"
                    onClick={() => deleteDriverMutation.mutate(driver.id)}
                    disabled={deleteDriverMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredDrivers.length === 0 && (
        <div className="text-center py-12">
          <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد سائقين</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'لا توجد نتائج تطابق البحث' 
              : 'ابدأ بإضافة سائقين جدد لفريق التوصيل'}
          </p>
          {(!searchTerm && statusFilter === 'all') && (
            <Button onClick={() => setShowAddDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              إضافة أول سائق
            </Button>
          )}
        </div>
      )}
    </div>
  );
}