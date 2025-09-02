import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  Truck, 
  Package, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle, 
  XCircle,
  Star,
  Navigation,
  DollarSign,
  Timer,
  User,
  LogOut,
  RefreshCw,
  Shield,
  Activity,
  AlertTriangle
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface SecureOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  totalAmount: string;
  status: string;
  deliveryNotes?: string;
  estimatedDelivery?: number;
  priority: 'normal' | 'high' | 'urgent';
  securityLevel: 'standard' | 'high' | 'critical';
  createdAt: string;
}

interface SecureDriver {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  vehicleType: string;
  driverCode: string;
  workingArea: string;
  rating: string;
  totalDeliveries: number;
  status: 'online' | 'offline' | 'busy';
  earnings: string;
  securityClearance: 'basic' | 'standard' | 'high';
  lastLoginTime: string;
  sessionToken: string;
}

export default function SecureDriverDashboard() {
  const [, setLocation] = useLocation();
  const [isOnline, setIsOnline] = useState(false);
  const [driverData, setDriverData] = useState<SecureDriver | null>(null);
  const [securityMode, setSecurityMode] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Check for secure driver authentication
    const secureAuth = localStorage.getItem('driverAuth');
    if (secureAuth) {
      try {
        const authData = JSON.parse(secureAuth);
        if (authData.securityLevel === 'high' && authData.user) {
          setDriverData(authData.user);
          setIsOnline(authData.user.status === 'online');
        } else {
          // Redirect to secure login if security level is insufficient
          setLocation('/driver/secure-login');
        }
      } catch (error) {
        console.error('Invalid authentication data');
        setLocation('/driver/secure-login');
      }
    } else {
      setLocation('/driver/secure-login');
    }
  }, [setLocation]);

  // Fetch secure orders
  const { data: orders = [], isLoading, refetch } = useQuery<SecureOrder[]>({
    queryKey: ['/api/driver/secure-orders'],
    enabled: !!driverData && isOnline && securityMode,
  });

  // Update driver status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: 'online' | 'offline' | 'busy') => {
      const response = await apiRequest('PUT', `/api/driver/status`, { 
        status,
        securityToken: driverData?.sessionToken 
      });
      return response.json();
    },
    onSuccess: (data) => {
      setIsOnline(data.status === 'online');
      toast({
        title: "تم تحديث الحالة",
        description: `حالتك الآن: ${data.status === 'online' ? 'متاح' : data.status === 'busy' ? 'مشغول' : 'غير متاح'}`
      });
    }
  });

  // Accept order mutation
  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest('POST', `/api/driver/accept-order`, { 
        orderId,
        driverId: driverData?.id,
        securityToken: driverData?.sessionToken 
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم قبول الطلب",
        description: "تم تخصيص الطلب لك بنجاح"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/driver/secure-orders'] });
    }
  });

  // Mark order as delivered mutation
  const deliverOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest('POST', `/api/driver/deliver-order`, { 
        orderId,
        deliveredAt: new Date().toISOString(),
        securityToken: driverData?.sessionToken 
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "تم تسليم الطلب",
        description: "تم تأكيد تسليم الطلب بنجاح"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/driver/secure-orders'] });
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('driverAuth');
    localStorage.removeItem('driverData');
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل الخروج بأمان من النظام"
    });
    setLocation('/');
  };

  const handleToggleOnline = () => {
    const newStatus = isOnline ? 'offline' : 'online';
    updateStatusMutation.mutate(newStatus);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'accepted': return 'bg-blue-500';
      case 'picked_up': return 'bg-purple-500';
      case 'out_for_delivery': return 'bg-orange-500';
      case 'delivered': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار';
      case 'accepted': return 'مقبول';
      case 'picked_up': return 'تم الاستلام';
      case 'out_for_delivery': return 'في الطريق';
      case 'delivered': return 'تم التسليم';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  if (!driverData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Security Header */}
        <Alert className="border-red-200 bg-red-50">
          <Shield className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 flex items-center justify-between">
            <span>لوحة تحكم آمنة للسائقين - مستوى الأمان: عالي</span>
            <Badge variant="outline" className="bg-red-100 text-red-800">
              جلسة آمنة نشطة
            </Badge>
          </AlertDescription>
        </Alert>

        {/* Driver Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-blue-600 text-white text-xl">
                    {driverData.fullName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{driverData.fullName}</h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>كود السائق: {driverData.driverCode}</span>
                    <span className="flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      {driverData.vehicleType}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {driverData.workingArea}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className={getSecurityLevelColor(driverData.securityClearance)}>
                      مستوى الأمان: {driverData.securityClearance}
                    </Badge>
                    <Badge variant="outline">
                      <Star className="w-3 h-3 ml-1" />
                      {driverData.rating} نجمة
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{driverData.totalDeliveries}</div>
                  <div className="text-sm text-gray-600">توصيلة</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{driverData.earnings}</div>
                  <div className="text-sm text-gray-600">الأرباح (جنيه)</div>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isOnline}
                      onCheckedChange={handleToggleOnline}
                      disabled={updateStatusMutation.isPending}
                    />
                    <span className="text-sm font-medium">
                      {isOnline ? 'متاح للتوصيل' : 'غير متاح'}
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    تسجيل الخروج
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Status Controls */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4" />
                حالة النظام الآمن
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span>الوضع الآمن</span>
                <Switch
                  checked={securityMode}
                  onCheckedChange={setSecurityMode}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {securityMode ? 'تم تفعيل المراقبة الآمنة' : 'المراقبة الآمنة معطلة'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Timer className="w-4 h-4" />
                وقت الجلسة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {driverData.lastLoginTime ? 
                  new Date(driverData.lastLoginTime).toLocaleString('ar-EG') : 
                  'غير محدد'
                }
              </div>
              <p className="text-xs text-gray-500">آخر تسجيل دخول</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <RefreshCw className="w-4 h-4" />
                تحديث الطلبات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => refetch()} 
                disabled={isLoading}
                className="w-full"
                size="sm"
              >
                {isLoading ? 'جاري التحديث...' : 'تحديث الطلبات'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Available Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                الطلبات المتاحة ({orders.length})
              </span>
              <Badge variant="outline" className={isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {isOnline ? 'متاح للتوصيل' : 'غير متاح'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!isOnline ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  يجب تفعيل حالة "متاح للتوصيل" لرؤية الطلبات المتاحة
                </AlertDescription>
              </Alert>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                لا توجد طلبات متاحة حالياً
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">#{order.orderNumber}</h3>
                          <Badge className={`${getStatusColor(order.status)} text-white`}>
                            {getStatusText(order.status)}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(order.priority)}>
                            أولوية {order.priority}
                          </Badge>
                          <Badge variant="outline" className={getSecurityLevelColor(order.securityLevel)}>
                            أمان {order.securityLevel}
                          </Badge>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <User className="w-4 h-4" />
                              {order.customerName}
                            </p>
                            <p className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                              <Phone className="w-4 h-4" />
                              {order.customerPhone}
                            </p>
                            <p className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              {order.deliveryAddress}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600 mb-2">المنتجات:</p>
                            <div className="space-y-1">
                              {order.items.map((item, index) => (
                                <p key={index} className="text-sm">
                                  {item.name} × {item.quantity} - {item.price} جنيه
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>المجموع: {order.totalAmount} جنيه</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {order.estimatedDelivery} دقيقة
                          </span>
                          <span>{new Date(order.createdAt).toLocaleString('ar-EG')}</span>
                        </div>
                        
                        {order.deliveryNotes && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-sm text-yellow-800">
                              <strong>ملاحظات التوصيل:</strong> {order.deliveryNotes}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 mr-4">
                        {order.status === 'pending' && (
                          <Button
                            onClick={() => acceptOrderMutation.mutate(order.id)}
                            disabled={acceptOrderMutation.isPending}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <CheckCircle className="w-4 h-4 ml-1" />
                            قبول الطلب
                          </Button>
                        )}
                        
                        {order.status === 'out_for_delivery' && (
                          <Button
                            onClick={() => deliverOrderMutation.mutate(order.id)}
                            disabled={deliverOrderMutation.isPending}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 ml-1" />
                            تأكيد التسليم
                          </Button>
                        )}
                        
                        <Button variant="outline" size="sm">
                          <Navigation className="w-4 h-4 ml-1" />
                          خريطة
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}