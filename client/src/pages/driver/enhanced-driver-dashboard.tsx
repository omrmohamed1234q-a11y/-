import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  getOrderStatusText, 
  getOrderStatusColor, 
  getOrderStatusIcon 
} from '@/lib/order-utils';
import { 
  Package, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2,
  Navigation,
  Truck,
  AlertCircle,
  RefreshCw,
  User,
  Edit,
  LogOut,
  Save
} from 'lucide-react';

interface DriverStats {
  totalOrders: number;
  completedToday: number;
  ongoingOrders: number;
  todayEarnings: number;
}

export default function EnhancedDriverDashboard() {
  const [driverStatus, setDriverStatus] = useState<'online' | 'offline' | 'busy'>('offline');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [editingProfile, setEditingProfile] = useState(false);
  const [driverProfile, setDriverProfile] = useState({
    name: 'أحمد محمد السائق',
    phone: '01777666555',
    email: 'ahmed.driver@example.com',
    vehicleType: 'دراجة نارية',
    vehicleNumber: 'ق أ ه 1234',
    workingHours: '9:00 ص - 9:00 م',
    status: 'نشط'
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get driver stats (simulated data)
  const { data: stats } = useQuery<DriverStats>({
    queryKey: ['/api/driver/stats'],
    queryFn: async () => {
      // Simulated stats - replace with real API
      return {
        totalOrders: 127,
        completedToday: 8,
        ongoingOrders: 2,
        todayEarnings: 45
      };
    }
  });

  // Get available orders for driver (simulated)
  const { data: availableOrders = [], refetch: refetchOrders } = useQuery({
    queryKey: ['/api/driver/available-orders'],
    queryFn: async () => {
      if (driverStatus !== 'online') return [];
      
      // Simulated available orders data - replace with real API call
      return [
        {
          id: 'available-001',
          orderNumber: 'ORD-2024-003',
          customerName: 'سارة أحمد',
          customerPhone: '01234567890',
          deliveryAddress: '456 شارع الجامعة، المهندسين، الجيزة',
          totalAmount: 25,
          estimatedDelivery: 30,
          createdAt: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
          status: 'confirmed'
        },
        {
          id: 'available-002', 
          orderNumber: 'ORD-2024-004',
          customerName: 'محمد علي',
          customerPhone: '01111222333',
          deliveryAddress: '789 شارع التحرير، وسط البلد، القاهرة',
          totalAmount: 18,
          estimatedDelivery: 25,
          createdAt: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
          status: 'confirmed'
        }
      ];
    },
    enabled: driverStatus === 'online',
    refetchInterval: 10000 // Refetch every 10 seconds when online
  });

  // Get assigned orders (orders the driver has accepted)
  const { data: assignedOrders = [] } = useQuery({
    queryKey: ['/api/driver/assigned-orders'],
    queryFn: async () => {
      // Simulated assigned orders - replace with real API call
      return [
        {
          id: 'assigned-001',
          orderNumber: 'ORD-2024-002',
          customerName: 'فاطمة أحمد',
          customerPhone: '01555666777',
          deliveryAddress: '789 شارع البرج، الجيزة',
          totalAmount: 30,
          status: 'driver_assigned',
          createdAt: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
        }
      ];
    }
  });

  // Accept order mutation
  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      // Simulate API call to accept order
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const order = availableOrders.find((o: any) => o.id === orderId);
      if (!order) throw new Error('Order not found');
      
      // Update driver status to busy
      setDriverStatus('busy');
      
      return {
        ...order,
        status: 'driver_assigned',
        driverAssignedAt: new Date().toISOString()
      };
    },
    onSuccess: (data) => {
      toast({
        title: "تم استلام الطلب",
        description: `تم استلام طلب ${data.orderNumber} بنجاح`,
      });
      // Refresh both queries
      queryClient.invalidateQueries({ queryKey: ['/api/driver/available-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/driver/assigned-orders'] });
    },
    onError: (error: any) => {
      toast({
        title: "فشل في استلام الطلب",
        description: error.message || "حدث خطأ أثناء استلام الطلب",
        variant: "destructive",
      });
    }
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string, status: string }) => {
      // Get current location if updating to out_for_delivery or delivered
      let currentLocation = null;
      if ((status === 'out_for_delivery' || status === 'delivered') && navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 60000
            });
          });
          currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
        } catch (error) {
          console.log('Could not get location:', error);
        }
      }

      // Simulate API call with location
      const response = await apiRequest('PATCH', `/api/driver/orders/${orderId}/status`, {
        status,
        driverId: 'driver-001',
        location: currentLocation
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "تم تحديث حالة الطلب",
        description: `تم تحديث الطلب إلى: ${getOrderStatusText(data.status as any)}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/driver/assigned-orders'] });
      
      // Update driver status based on remaining orders
      if (data.status === 'delivered' || data.status === 'cancelled') {
        // Check if there are more assigned orders
        if (assignedOrders.length <= 1) {
          setDriverStatus('online');
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "فشل في تحديث الطلب",
        description: error.message || "حدث خطأ أثناء تحديث الطلب",
        variant: "destructive",
      });
    }
  });

  // Get current location
  useEffect(() => {
    if (navigator.geolocation && driverStatus === 'online') {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, [driverStatus]);

  const toggleDriverStatus = () => {
    if (driverStatus === 'offline') {
      setDriverStatus('online');
      toast({
        title: "أصبحت متاح",
        description: "يمكنك الآن استلام الطلبات",
      });
    } else if (driverStatus === 'online') {
      setDriverStatus('offline');
      toast({
        title: "أصبحت غير متاح",
        description: "لن تتلقى طلبات جديدة",
      });
    }
  };

  const openGoogleMaps = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
  };

  // Save profile changes
  const saveProfile = () => {
    setEditingProfile(false);
    toast({
      title: "تم حفظ البيانات",
      description: "تم تحديث بيانات البروفايل بنجاح",
    });
  };

  const logout = () => {
    toast({
      title: "تسجيل الخروج",
      description: "تم تسجيل الخروج بنجاح",
    });
    window.location.href = '/driver/secure-login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">لوحة السائق</h1>
            <p className="text-gray-600 mt-1">مرحباً {driverProfile.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge 
              variant={driverStatus === 'online' ? 'default' : driverStatus === 'busy' ? 'secondary' : 'outline'}
              className="px-4 py-2"
            >
              {driverStatus === 'online' ? '🟢 متاح' : driverStatus === 'busy' ? '🟡 مشغول' : '🔴 غير متاح'}
            </Badge>
            <Button 
              onClick={toggleDriverStatus}
              variant={driverStatus === 'offline' ? 'default' : 'outline'}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              {driverStatus === 'offline' ? 'تسجيل الحضور' : 'تغيير الحالة'}
            </Button>
            <Button 
              onClick={logout}
              variant="outline"
              className="gap-2 text-red-600 hover:text-red-700"
            >
              <LogOut className="w-4 h-4" />
              خروج
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="dashboard" className="gap-2">
              <Truck className="w-4 h-4" />
              الطلبات
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              البروفايل
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
                      <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">{stats?.completedToday || 0}</p>
                      <p className="text-xs text-muted-foreground">تم اليوم</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-2xl font-bold">{assignedOrders?.length || 0}</p>
                      <p className="text-xs text-muted-foreground">طلبات حالية</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-xl">💰</span>
                    <div>
                      <p className="text-2xl font-bold">{stats?.todayEarnings || 0}</p>
                      <p className="text-xs text-muted-foreground">كسب اليوم (جنيه)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Offline Status Warning */}
            {driverStatus === 'offline' && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-800">غير متاح للطلبات</p>
                      <p className="text-sm text-orange-700">اضغط "تسجيل الحضور" لتصبح متاح لاستقبال الطلبات</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assigned Orders */}
            {assignedOrders && assignedOrders.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">طلباتك الحالية ({assignedOrders.length})</h2>
                  <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries()}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    تحديث
                  </Button>
                </div>

                <div className="space-y-3">
                  {assignedOrders.map((order: any) => (
                    <Card key={order.id} className="border-blue-200 bg-blue-50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getOrderStatusIcon(order.status)}</span>
                            <div>
                              <CardTitle className="text-lg">طلب #{order.orderNumber}</CardTitle>
                              <CardDescription>
                                العميل: {order.customerName || 'العميل'} • {order.customerPhone || 'لا يوجد'}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className={getOrderStatusColor(order.status)}>
                            {getOrderStatusText(order.status)}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">عنوان التوصيل:</p>
                            <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openGoogleMaps(order.deliveryAddress)}
                          >
                            <Navigation className="w-3 h-3 mr-1" />
                            فتح الخريطة
                          </Button>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-4 w-4" />
                            <span>مُرّ {Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)} دقيقة</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                            <span>💰</span>
                            <span>{order.totalAmount} جنيه</span>
                          </div>
                        </div>

                        {/* Action buttons based on status */}
                        <div className="flex gap-2 pt-2 border-t">
                          {order.status === 'driver_assigned' && (
                            <Button
                              onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'out_for_delivery' })}
                              disabled={updateOrderStatusMutation.isPending}
                              className="flex-1"
                            >
                              <Truck className="w-4 h-4 mr-1" />
                              بدء التوصيل
                            </Button>
                          )}

                          {order.status === 'out_for_delivery' && (
                            <>
                              <Button
                                onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'delivered' })}
                                disabled={updateOrderStatusMutation.isPending}
                                className="flex-1"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                تم التسليم
                              </Button>
                              <Button
                                onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'cancelled' })}
                                disabled={updateOrderStatusMutation.isPending}
                                variant="destructive"
                                className="flex-1"
                              >
                                إلغاء
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Available Orders */}
            {driverStatus === 'online' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">طلبات متاحة ({availableOrders.length})</h2>
                  <Button variant="outline" size="sm" onClick={() => refetchOrders()}>
                    <RefreshCw className="w-4 h-4 mr-1" />
                    تحديث
                  </Button>
                </div>

                {availableOrders.length === 0 ? (
                  <Card className="border-gray-200">
                    <CardContent className="p-6 text-center">
                      <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">لا توجد طلبات متاحة حالياً</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {availableOrders.map((order: any) => (
                      <Card key={order.id} className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">📦</span>
                              <div>
                                <h3 className="font-semibold">طلب #{order.orderNumber}</h3>
                                <p className="text-sm text-gray-600">العميل: {order.customerName}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 mb-3">
                            <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">عنوان التوصيل:</p>
                              <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="h-4 w-4" />
                                <span>مُرّ {Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)} دقيقة</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                                <span>💰</span>
                                <span>{order.totalAmount} جنيه</span>
                              </div>
                            </div>

                            <Button
                              onClick={() => acceptOrderMutation.mutate(order.id)}
                              disabled={acceptOrderMutation.isPending}
                            >
                              {acceptOrderMutation.isPending ? 'جاري الاستلام...' : 'استلم الطلب'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    بيانات السائق
                  </CardTitle>
                  <Button
                    onClick={() => setEditingProfile(!editingProfile)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {editingProfile ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                    {editingProfile ? 'حفظ' : 'تعديل'}
                  </Button>
                </div>
                <CardDescription>
                  إدارة البيانات الشخصية ومعلومات المركبة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">الاسم الكامل</Label>
                    {editingProfile ? (
                      <Input
                        id="name"
                        value={driverProfile.name}
                        onChange={(e) => setDriverProfile({...driverProfile, name: e.target.value})}
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded-md">{driverProfile.name}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف</Label>
                    {editingProfile ? (
                      <Input
                        id="phone"
                        value={driverProfile.phone}
                        onChange={(e) => setDriverProfile({...driverProfile, phone: e.target.value})}
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded-md">{driverProfile.phone}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    {editingProfile ? (
                      <Input
                        id="email"
                        type="email"
                        value={driverProfile.email}
                        onChange={(e) => setDriverProfile({...driverProfile, email: e.target.value})}
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded-md">{driverProfile.email}</p>
                    )}
                  </div>

                  {/* Vehicle Type */}
                  <div className="space-y-2">
                    <Label htmlFor="vehicleType">نوع المركبة</Label>
                    {editingProfile ? (
                      <Input
                        id="vehicleType"
                        value={driverProfile.vehicleType}
                        onChange={(e) => setDriverProfile({...driverProfile, vehicleType: e.target.value})}
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded-md">{driverProfile.vehicleType}</p>
                    )}
                  </div>

                  {/* Vehicle Number */}
                  <div className="space-y-2">
                    <Label htmlFor="vehicleNumber">رقم المركبة</Label>
                    {editingProfile ? (
                      <Input
                        id="vehicleNumber"
                        value={driverProfile.vehicleNumber}
                        onChange={(e) => setDriverProfile({...driverProfile, vehicleNumber: e.target.value})}
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded-md">{driverProfile.vehicleNumber}</p>
                    )}
                  </div>

                  {/* Working Hours */}
                  <div className="space-y-2">
                    <Label htmlFor="workingHours">ساعات العمل</Label>
                    {editingProfile ? (
                      <Input
                        id="workingHours"
                        value={driverProfile.workingHours}
                        onChange={(e) => setDriverProfile({...driverProfile, workingHours: e.target.value})}
                      />
                    ) : (
                      <p className="p-2 bg-gray-50 rounded-md">{driverProfile.workingHours}</p>
                    )}
                  </div>
                </div>

                {editingProfile && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button onClick={saveProfile} className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      حفظ التغييرات
                    </Button>
                    <Button 
                      onClick={() => setEditingProfile(false)} 
                      variant="outline" 
                      className="flex-1"
                    >
                      إلغاء
                    </Button>
                  </div>
                )}

                {/* Status Info */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">معلومات الحساب</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">حالة الحساب:</span>
                      <span className="font-medium text-green-600 mr-2">نشط</span>
                    </div>
                    <div>
                      <span className="text-gray-600">تاريخ التسجيل:</span>
                      <span className="font-medium mr-2">15 أغسطس 2024</span>
                    </div>
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