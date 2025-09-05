import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, AlertTriangle, TrendingUp } from 'lucide-react';

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

export default function InventorySimple() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/inventory/dashboard');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      } else {
        throw new Error('Failed to load inventory data');
      }
    } catch (err) {
      console.error('Error fetching inventory data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  if (loading) {
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800">خطأ في تحميل البيانات</h3>
                  <p className="text-red-600">{error}</p>
                  <Button 
                    onClick={fetchInventoryData} 
                    variant="outline" 
                    className="mt-3"
                    size="sm"
                  >
                    إعادة المحاولة
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">إدارة المخزون</h1>
            <p className="text-gray-600 mt-1">تتبع وإدارة مستويات المخزون والتنبيهات</p>
          </div>
          <Button onClick={fetchInventoryData} variant="outline">
            <Package className="w-4 h-4 mr-2" />
            تحديث البيانات
          </Button>
        </div>

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
                <Package className="w-8 h-8 text-blue-500" />
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
                <Package className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">مخزون منخفض</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats?.lowStockProducts || 0}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">نفد من المخزون</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats?.outOfStockProducts || 0}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              أكثر المنتجات مبيعاً
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.topSellingProducts?.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">#{index + 1}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-600">ID: {product.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{product.totalSold} مبيع</p>
                    <p className="text-sm text-gray-600">متوفر: {product.currentStock}</p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  لا توجد بيانات مبيعات متاحة
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>إحصائيات سريعة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">إجمالي قيمة المخزون</span>
                  <span className="font-semibold">{stats?.totalStockValue || 0} جنيه</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">متوسط مستوى المخزون</span>
                  <span className="font-semibold">{stats?.averageStockLevel || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">التنبيهات النشطة</span>
                  <span className="font-semibold text-orange-600">{stats?.activeAlerts?.length || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>حالة المخزون</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-green-600">● متوفر</span>
                  <span className="font-semibold">{stats?.inStockProducts || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-orange-600">● منخفض</span>
                  <span className="font-semibold">{stats?.lowStockProducts || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-red-600">● نفد</span>
                  <span className="font-semibold">{stats?.outOfStockProducts || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}