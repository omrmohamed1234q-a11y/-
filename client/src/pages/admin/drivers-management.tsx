import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Truck, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  UserCheck, 
  UserX, 
  Phone, 
  MapPin,
  Star,
  DollarSign,
  Package,
  Clock,
  ArrowLeft,
  Users
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import type { Driver } from '@shared/schema';

const driverFormSchema = z.object({
  name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().email('البريد الإلكتروني غير صحيح'),
  phone: z.string().min(10, 'رقم الهاتف غير صحيح'),
  vehicleType: z.string().min(1, 'نوع المركبة مطلوب'),
  vehiclePlate: z.string().optional(),
  workingArea: z.string().min(1, 'منطقة العمل مطلوبة'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

type DriverForm = z.infer<typeof driverFormSchema>;

export default function DriversManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<DriverForm>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      vehicleType: '',
      vehiclePlate: '',
      workingArea: '',
      password: '',
    },
  });

  // Fetch drivers
  const { data: drivers = [], isLoading } = useQuery<Driver[]>({
    queryKey: ['/api/admin/drivers'],
  });

  // Create driver mutation
  const createDriverMutation = useMutation({
    mutationFn: async (data: DriverForm) => {
      const response = await apiRequest('POST', '/api/admin/drivers', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'تم إنشاء حساب الكابتن بنجاح',
        description: 'يمكن للكابتن الآن تسجيل الدخول وبدء العمل',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/drivers'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: 'خطأ في إنشاء الحساب',
        description: 'حدث خطأ أثناء إنشاء حساب الكابتن',
        variant: 'destructive',
      });
    },
  });

  // Update driver status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ driverId, status }: { driverId: string; status: string }) => {
      const response = await apiRequest('PUT', `/api/admin/drivers/${driverId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'تم تحديث حالة الكابتن',
        description: 'تم تحديث حالة الكابتن بنجاح',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/drivers'] });
    },
  });

  const filteredDrivers = drivers.filter((driver: Driver) => {
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusMap = {
      online: { label: 'متاح', color: 'bg-green-100 text-green-800' },
      offline: { label: 'غير متاح', color: 'bg-gray-100 text-gray-800' },
      busy: { label: 'مشغول', color: 'bg-yellow-100 text-yellow-800' },
      suspended: { label: 'موقوف', color: 'bg-red-100 text-red-800' },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.offline;
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  const onSubmit = (data: DriverForm) => {
    createDriverMutation.mutate(data);
  };

  const getTotalStats = () => {
    return drivers.reduce((acc: any, driver: Driver) => {
      acc.total += 1;
      acc.online += driver.status === 'online' ? 1 : 0;
      acc.totalDeliveries += driver.totalDeliveries || 0;
      acc.totalEarnings += parseFloat(driver.earnings || '0');
      return acc;
    }, { total: 0, online: 0, totalDeliveries: 0, totalEarnings: 0 });
  };

  const stats = getTotalStats();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
              data-testid="link-back-dashboard"
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              <span>العودة للوحة التحكم</span>
            </Link>
            
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-gray-800">إدارة الكباتن</span>
            </div>
            
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-add-driver">
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة كابتن جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>إضافة كابتن جديد</DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الاسم</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="اسم الكابتن" data-testid="input-driver-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>البريد الإلكتروني</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="driver@example.com" data-testid="input-driver-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم الهاتف</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="01012345678" data-testid="input-driver-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vehicleType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع المركبة</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-vehicle-type">
                                <SelectValue placeholder="اختر نوع المركبة" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="motorcycle">دراجة نارية</SelectItem>
                              <SelectItem value="car">سيارة</SelectItem>
                              <SelectItem value="bicycle">دراجة</SelectItem>
                              <SelectItem value="walking">سير على الأقدام</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="vehiclePlate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم اللوحة (اختياري)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="أ ب ج 123" data-testid="input-vehicle-plate" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="workingArea"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>منطقة العمل</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="مدينة نصر، القاهرة" data-testid="input-working-area" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>كلمة المرور</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="كلمة المرور" data-testid="input-driver-password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2 pt-4">
                      <Button
                        type="submit"
                        disabled={createDriverMutation.isPending}
                        className="flex-1"
                        data-testid="button-submit-driver"
                      >
                        {createDriverMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                        data-testid="button-cancel-driver"
                      >
                        إلغاء
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">إجمالي الكباتن</p>
                  <p className="text-2xl font-bold" data-testid="stat-total-drivers">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">متاح حالياً</p>
                  <p className="text-2xl font-bold" data-testid="stat-online-drivers">{stats.online}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">إجمالي التوصيلات</p>
                  <p className="text-2xl font-bold" data-testid="stat-total-deliveries">{stats.totalDeliveries}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">إجمالي الأرباح</p>
                  <p className="text-2xl font-bold" data-testid="stat-total-earnings">{stats.totalEarnings.toFixed(2)} جنيه</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث بالاسم، البريد الإلكتروني، أو رقم الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                  data-testid="input-search-drivers"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48" data-testid="select-status-filter">
                  <Filter className="w-4 h-4 ml-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="online">متاح</SelectItem>
                  <SelectItem value="offline">غير متاح</SelectItem>
                  <SelectItem value="busy">مشغول</SelectItem>
                  <SelectItem value="suspended">موقوف</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Drivers List */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة الكباتن</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">جاري تحميل بيانات الكباتن...</p>
              </div>
            ) : filteredDrivers.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">لا توجد كباتن مطابقة للبحث</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDrivers.map((driver: Driver) => (
                  <Card key={driver.id} className="border" data-testid={`driver-card-${driver.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-blue-600 text-white">
                              {driver.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <h3 className="font-semibold text-lg">{driver.name}</h3>
                            <p className="text-gray-600">{driver.email}</p>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {driver.phone}
                              </span>
                              <span className="flex items-center gap-1">
                                <Truck className="w-3 h-3" />
                                {driver.vehicleType}
                              </span>
                              {driver.workingArea && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {driver.workingArea}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right space-y-1">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(driver.status)}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500" />
                                {driver.rating || '0.0'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Package className="w-3 h-3" />
                                {driver.totalDeliveries || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                {driver.earnings || '0'} جنيه
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid={`button-view-driver-${driver.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid={`button-edit-driver-${driver.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            {driver.status === 'suspended' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateStatusMutation.mutate({ driverId: driver.id, status: 'offline' })}
                                disabled={updateStatusMutation.isPending}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                data-testid={`button-activate-driver-${driver.id}`}
                              >
                                <UserCheck className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateStatusMutation.mutate({ driverId: driver.id, status: 'suspended' })}
                                disabled={updateStatusMutation.isPending}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                data-testid={`button-suspend-driver-${driver.id}`}
                              >
                                <UserX className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}