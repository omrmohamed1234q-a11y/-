import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Users, Package, ShoppingCart, Star, Plus, Edit,
  Trash2, Eye, Settings, BarChart3, TrendingUp
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-600">غير مخول</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              ليس لديك صلاحية للوصول إلى لوحة الإدارة
            </p>
            <Button onClick={() => window.location.href = '/'}>
              العودة للرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch dashboard data
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/stats'],
  });

  const { data: users } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  const { data: products } = useQuery({
    queryKey: ['/api/admin/products'],
  });

  const { data: orders } = useQuery({
    queryKey: ['/api/admin/orders'],
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/admin/categories'],
  });

  const { data: bounties } = useQuery({
    queryKey: ['/api/admin/bounties'],
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-3 rounded-2xl">
                <Settings className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">لوحة الإدارة</h1>
                <p className="text-gray-600">إدارة منصة اطبعلي</p>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 text-lg">
              مدير
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="إجمالي المستخدمين"
            value={(stats as any)?.totalUsers || 0}
            icon={<Users className="w-8 h-8" />}
            color="from-blue-500 to-blue-600"
          />
          <StatsCard
            title="إجمالي المنتجات"
            value={(stats as any)?.totalProducts || 0}
            icon={<Package className="w-8 h-8" />}
            color="from-green-500 to-green-600"
          />
          <StatsCard
            title="إجمالي الطلبات"
            value={(stats as any)?.totalOrders || 0}
            icon={<ShoppingCart className="w-8 h-8" />}
            color="from-orange-500 to-orange-600"
          />
          <StatsCard
            title="النقاط المُوزعة"
            value={(stats as any)?.totalPointsDistributed || 0}
            icon={<Star className="w-8 h-8" />}
            color="from-purple-500 to-purple-600"
          />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="products">المنتجات</TabsTrigger>
            <TabsTrigger value="categories">التصنيفات</TabsTrigger>
            <TabsTrigger value="orders">الطلبات</TabsTrigger>
            <TabsTrigger value="users">المستخدمين</TabsTrigger>
            <TabsTrigger value="bounties">النقاط والمكافآت</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <ProductsManagement products={products as any[]} />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesManagement categories={categories as any[]} />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersManagement orders={orders as any[]} />
          </TabsContent>

          <TabsContent value="users">
            <UsersManagement users={users as any[]} />
          </TabsContent>

          <TabsContent value="bounties">
            <BountiesManagement bounties={bounties as any[]} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({ title, value, icon, color }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
          </div>
          <div className={`bg-gradient-to-r ${color} text-white p-3 rounded-xl`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Products Management Component
function ProductsManagement({ products }: { products: any[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>إدارة المنتجات</CardTitle>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-green-500 to-green-600"
        >
          <Plus className="w-4 h-4 ml-2" />
          إضافة منتج
        </Button>
      </CardHeader>
      <CardContent>
        {showForm && <ProductForm onClose={() => setShowForm(false)} />}
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-right p-4">الاسم</th>
                <th className="text-right p-4">السعر</th>
                <th className="text-right p-4">التصنيف</th>
                <th className="text-right p-4">المخزون</th>
                <th className="text-right p-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {products?.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{product.name}</td>
                  <td className="p-4">{product.price} ريال</td>
                  <td className="p-4">{product.category}</td>
                  <td className="p-4">{product.stockQuantity}</td>
                  <td className="p-4">
                    <div className="flex space-x-2 space-x-reverse">
                      <Button size="sm" variant="outline">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// Product Form Component
function ProductForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    description: '',
    price: '',
    category: '',
    stockQuantity: '',
    imageUrl: ''
  });

  return (
    <div className="bg-gray-50 p-6 rounded-lg mb-6">
      <h3 className="text-lg font-semibold mb-4">إضافة منتج جديد</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">اسم المنتج</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="أدخل اسم المنتج"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">السعر</label>
          <Input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="أدخل السعر"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">التصنيف</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="اختر التصنيف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="books">كتب المعلمين</SelectItem>
              <SelectItem value="vip">طباعة VIP</SelectItem>
              <SelectItem value="fast">طباعة سريعة</SelectItem>
              <SelectItem value="supplies">أدوات مكتبية</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">الكمية في المخزون</label>
          <Input
            type="number"
            value={formData.stockQuantity}
            onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
            placeholder="أدخل الكمية"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-2">الوصف</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="أدخل وصف المنتج"
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2 space-x-reverse mt-4">
        <Button variant="outline" onClick={onClose}>
          إلغاء
        </Button>
        <Button className="bg-gradient-to-r from-green-500 to-green-600">
          حفظ المنتج
        </Button>
      </div>
    </div>
  );
}

// Categories Management Component
function CategoriesManagement({ categories }: { categories: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة التصنيفات</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">إدارة تصنيفات المنتجات</p>
        {/* Categories management implementation */}
      </CardContent>
    </Card>
  );
}

// Orders Management Component
function OrdersManagement({ orders }: { orders: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة الطلبات</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">متابعة وإدارة الطلبات</p>
        {/* Orders management implementation */}
      </CardContent>
    </Card>
  );
}

// Users Management Component
function UsersManagement({ users }: { users: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة المستخدمين</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">إدارة المستخدمين والأدوار</p>
        {/* Users management implementation */}
      </CardContent>
    </Card>
  );
}

// Bounties Management Component
function BountiesManagement({ bounties }: { bounties: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة النقاط والمكافآت</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">إدارة نظام النقاط والمكافآت</p>
        {/* Bounties management implementation */}
      </CardContent>
    </Card>
  );
}