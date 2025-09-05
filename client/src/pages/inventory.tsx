import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  Plus,
  Minus,
  History,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Package2,
  Truck
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

interface InventoryStats {
  totalProducts: number;
  inStockProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalStockValue: number;
  averageStockLevel: number;
  topSellingProducts: Array<{
    id: string;
    name: string;
    totalSold: number;
    currentStock: number;
  }>;
  recentMovements: any[];
  activeAlerts: any[];
}

export default function InventoryPage() {
  const [selectedTab, setSelectedTab] = useState('dashboard');

  const { data: inventoryStats, isLoading, refetch } = useQuery<{ success: boolean; data: InventoryStats }>({
    queryKey: ['/api/inventory/dashboard'],
    refetchInterval: 30000,
  });

  const { data: alerts } = useQuery({
    queryKey: ['/api/inventory/alerts'],
    refetchInterval: 10000,
  });

  const { data: movements } = useQuery({
    queryKey: ['/api/inventory/movements'],
    enabled: selectedTab === 'movements',
  });

  const stats = inventoryStats?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const createSampleData = async () => {
    try {
      const response = await apiRequest('POST', '/api/inventory/create-sample-data');
      const result = await response.json();
      if (result.success) {
        toast({
          title: "تم إنشاء البيانات التجريبية",
          description: "تم إنشاء بيانات المخزون التجريبية بنجاح",
        });
        refetch();
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء البيانات التجريبية",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة المخزون</h1>
            <p className="text-gray-600 mt-1">تتبع وإدارة مستويات المخزون والتنبيهات</p>
          </div>
          <Button onClick={createSampleData} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            إنشاء بيانات تجريبية
          </Button>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              لوحة التحكم
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              إدارة المخزون
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              التنبيهات ({alerts?.data?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="movements" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              تحركات المخزون
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">إجمالي المنتجات</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats?.totalProducts || 0}
                      </p>
                    </div>
                    <Package2 className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">متوفرة في المخزون</p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats?.inStockProducts || 0}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">مخزون منخفض</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {stats?.lowStockProducts || 0}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">نفد المخزون</p>
                      <p className="text-2xl font-bold text-red-600">
                        {stats?.outOfStockProducts || 0}
                      </p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    قيمة المخزون الإجمالية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {(stats?.totalStockValue || 0).toLocaleString('ar-EG')} جنيه
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    متوسط مستوى المخزون: {stats?.averageStockLevel || 0} قطعة
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    أكثر المنتجات مبيعاً
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.topSellingProducts?.slice(0, 3).map((product) => (
                      <div key={product.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-gray-600">
                            تم بيع {product.totalSold} قطعة
                          </p>
                        </div>
                        <Badge variant={product.currentStock > 10 ? 'default' : 'destructive'}>
                          {product.currentStock} متبقي
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Movements */}
            {stats?.recentMovements && stats.recentMovements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    آخر تحركات المخزون
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats.recentMovements.slice(0, 5).map((movement, index) => (
                      <div key={movement.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {movement.movementType === 'in' ? (
                            <Plus className="w-4 h-4 text-green-500" />
                          ) : (
                            <Minus className="w-4 h-4 text-red-500" />
                          )}
                          <div>
                            <p className="font-medium text-sm">{movement.productId}</p>
                            <p className="text-xs text-gray-600">{movement.reason}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            movement.movementType === 'in' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {movement.movementType === 'in' ? '+' : ''}{movement.quantity}
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(movement.createdAt).toLocaleString('ar-EG')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="stock">
            <StockManagementTab />
          </TabsContent>

          <TabsContent value="alerts">
            <AlertsTab alerts={alerts?.data || []} />
          </TabsContent>

          <TabsContent value="movements">
            <MovementsTab movements={movements?.data || []} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StockManagementTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة المخزون</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">سيتم إضافة واجهة إدارة المخزون قريباً</p>
          <p className="text-sm text-gray-400 mt-2">
            يمكنك تحديث كميات المنتجات وإدارة المخزون من هنا
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsTab({ alerts }: { alerts: any[] }) {
  return (
    <div className="space-y-4">
      {alerts.length > 0 ? (
        alerts.map((alert) => (
          <Card key={alert.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-5 h-5 ${
                    alert.alertLevel === 'critical' ? 'text-red-500' : 
                    alert.alertLevel === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                  }`} />
                  <div>
                    <p className="font-medium">{alert.productId}</p>
                    <p className="text-sm text-gray-600">
                      المخزون الحالي: {alert.currentStock} | الحد الأدنى: {alert.threshold}
                    </p>
                  </div>
                </div>
                <Badge variant={
                  alert.alertLevel === 'critical' ? 'destructive' : 
                  alert.alertLevel === 'warning' ? 'secondary' : 'default'
                }>
                  {alert.alertType === 'low_stock' ? 'مخزون منخفض' :
                   alert.alertType === 'out_of_stock' ? 'نفد المخزون' : 
                   alert.alertType}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد تنبيهات مخزون حالياً</p>
            <p className="text-sm text-gray-400 mt-2">جميع المنتجات في حالة جيدة</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MovementsTab({ movements }: { movements: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>تحركات المخزون</CardTitle>
      </CardHeader>
      <CardContent>
        {movements.length > 0 ? (
          <div className="space-y-3">
            {movements.map((movement, index) => (
              <div key={movement.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {movement.movementType === 'in' ? (
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Plus className="w-4 h-4 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <Minus className="w-4 h-4 text-red-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{movement.productId}</p>
                    <p className="text-sm text-gray-600">{movement.reason}</p>
                    {movement.notes && (
                      <p className="text-xs text-gray-500">{movement.notes}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    movement.movementType === 'in' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {movement.movementType === 'in' ? '+' : ''}{movement.quantity}
                  </p>
                  <p className="text-xs text-gray-600">
                    {new Date(movement.createdAt).toLocaleString('ar-EG')}
                  </p>
                  {movement.performedBy && (
                    <p className="text-xs text-gray-500">بواسطة: {movement.performedBy}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد تحركات مخزون مسجلة</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}