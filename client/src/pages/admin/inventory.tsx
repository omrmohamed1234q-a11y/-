import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Search,
  Filter
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitPrice: number;
  costPrice: number;
  supplier: string;
  lastUpdated: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export default function AdminInventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    sku: '',
    category: '',
    currentStock: 0,
    minStock: 0,
    maxStock: 100,
    unitPrice: 0,
    costPrice: 0,
    supplier: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // محاكاة بيانات المخزون - سيتم ربطها بالـ API لاحقاً
  const mockInventoryData: InventoryItem[] = [
    {
      id: '1',
      name: 'ورق A4 عادي',
      sku: 'PAP-A4-001',
      category: 'paper',
      currentStock: 500,
      minStock: 100,
      maxStock: 1000,
      unitPrice: 0.5,
      costPrice: 0.3,
      supplier: 'مورد الورق الذهبي',
      lastUpdated: '2025-01-06',
      status: 'in_stock'
    },
    {
      id: '2',
      name: 'حبر أسود للطابعة',
      sku: 'INK-BLK-001',
      category: 'ink',
      currentStock: 25,
      minStock: 50,
      maxStock: 200,
      unitPrice: 120,
      costPrice: 80,
      supplier: 'مورد الأحبار المتميز',
      lastUpdated: '2025-01-05',
      status: 'low_stock'
    },
    {
      id: '3',
      name: 'ورق A3 لامع',
      sku: 'PAP-A3-002',
      category: 'paper',
      currentStock: 0,
      minStock: 25,
      maxStock: 500,
      unitPrice: 1.2,
      costPrice: 0.8,
      supplier: 'مورد الورق الذهبي',
      lastUpdated: '2025-01-04',
      status: 'out_of_stock'
    },
    {
      id: '4',
      name: 'ورق استيكر لامع',
      sku: 'STI-GLO-001',
      category: 'sticker',
      currentStock: 150,
      minStock: 30,
      maxStock: 300,
      unitPrice: 2.5,
      costPrice: 1.8,
      supplier: 'مورد المواد اللاصقة',
      lastUpdated: '2025-01-06',
      status: 'in_stock'
    }
  ];

  const { data: inventory = mockInventoryData, isLoading } = useQuery<InventoryItem[]>({
    queryKey: ['/api/admin/inventory'],
    queryFn: async () => {
      // سيتم تطبيق API endpoint لاحقاً
      return mockInventoryData;
    }
  });

  const categories = ['all', 'paper', 'ink', 'sticker', 'other'];
  const categoryLabels = {
    all: 'جميع الفئات',
    paper: 'الورق',
    ink: 'الأحبار',
    sticker: 'الاستيكرات',
    other: 'أخرى'
  };

  const statusLabels = {
    in_stock: 'متوفر',
    low_stock: 'مخزون منخفض',
    out_of_stock: 'غير متوفر'
  };

  const statusColors = {
    in_stock: 'bg-green-500',
    low_stock: 'bg-yellow-500',
    out_of_stock: 'bg-red-500'
  };

  // تصفية البيانات
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // إحصائيات المخزون
  const stats = {
    totalItems: inventory.length,
    inStock: inventory.filter(item => item.status === 'in_stock').length,
    lowStock: inventory.filter(item => item.status === 'low_stock').length,
    outOfStock: inventory.filter(item => item.status === 'out_of_stock').length,
    totalValue: inventory.reduce((sum, item) => sum + (item.currentStock * item.costPrice), 0)
  };

  const addItemMutation = useMutation({
    mutationFn: async (itemData: Partial<InventoryItem>) => {
      // سيتم تطبيق API endpoint لاحقاً
      return { ...itemData, id: Date.now().toString(), lastUpdated: new Date().toISOString() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inventory'] });
      setIsAddModalOpen(false);
      setNewItem({
        name: '',
        sku: '',
        category: '',
        currentStock: 0,
        minStock: 0,
        maxStock: 100,
        unitPrice: 0,
        costPrice: 0,
        supplier: ''
      });
      toast({
        title: 'تمت الإضافة',
        description: 'تم إضافة المنتج للمخزون بنجاح'
      });
    }
  });

  const handleAddItem = () => {
    if (!newItem.name || !newItem.sku) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال اسم المنتج ورقم SKU',
        variant: 'destructive'
      });
      return;
    }

    const status = newItem.currentStock === 0 ? 'out_of_stock' : 
                  (newItem.currentStock! <= newItem.minStock!) ? 'low_stock' : 'in_stock';

    addItemMutation.mutate({
      ...newItem,
      status
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">جاري تحميل المخزون...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6" dir="rtl">
      {/* العنوان والإحصائيات */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة المخزون</h1>
          <p className="text-gray-600 mt-2">إدارة المنتجات والمواد الخام والمخزون</p>
        </div>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 ml-2" />
              إضافة منتج جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة منتج جديد للمخزون</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">اسم المنتج *</Label>
                  <Input
                    id="name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="مثل: ورق A4 عادي"
                  />
                </div>
                <div>
                  <Label htmlFor="sku">رقم SKU *</Label>
                  <Input
                    id="sku"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                    placeholder="مثل: PAP-A4-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">الفئة</Label>
                  <select
                    id="category"
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">اختر الفئة</option>
                    <option value="paper">الورق</option>
                    <option value="ink">الأحبار</option>
                    <option value="sticker">الاستيكرات</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="supplier">المورد</Label>
                  <Input
                    id="supplier"
                    value={newItem.supplier}
                    onChange={(e) => setNewItem({ ...newItem, supplier: e.target.value })}
                    placeholder="اسم المورد"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="currentStock">المخزون الحالي</Label>
                  <Input
                    id="currentStock"
                    type="number"
                    value={newItem.currentStock}
                    onChange={(e) => setNewItem({ ...newItem, currentStock: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="minStock">الحد الأدنى</Label>
                  <Input
                    id="minStock"
                    type="number"
                    value={newItem.minStock}
                    onChange={(e) => setNewItem({ ...newItem, minStock: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxStock">الحد الأقصى</Label>
                  <Input
                    id="maxStock"
                    type="number"
                    value={newItem.maxStock}
                    onChange={(e) => setNewItem({ ...newItem, maxStock: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="costPrice">سعر التكلفة (جنيه)</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    value={newItem.costPrice}
                    onChange={(e) => setNewItem({ ...newItem, costPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="unitPrice">سعر البيع (جنيه)</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-2 space-x-reverse pt-4">
              <Button onClick={handleAddItem} disabled={addItemMutation.isPending}>
                {addItemMutation.isPending ? 'جاري الحفظ...' : 'حفظ المنتج'}
              </Button>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                إلغاء
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المنتجات</p>
                <p className="text-2xl font-bold arabic-nums">{stats.totalItems}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">متوفر</p>
                <p className="text-2xl font-bold text-green-600 arabic-nums">{stats.inStock}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">مخزون منخفض</p>
                <p className="text-2xl font-bold text-yellow-600 arabic-nums">{stats.lowStock}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">غير متوفر</p>
                <p className="text-2xl font-bold text-red-600 arabic-nums">{stats.outOfStock}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">قيمة المخزون</p>
                <p className="text-2xl font-bold text-purple-600 arabic-nums">{stats.totalValue.toFixed(2)} جنيه</p>
              </div>
              <Package className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* البحث والفلترة */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4 space-x-reverse">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث عن منتج أو رقم SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* جدول المخزون */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse">
            <Package className="w-5 h-5" />
            <span>قائمة المخزون ({filteredInventory.length} منتج)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right p-4 font-semibold">المنتج</th>
                  <th className="text-right p-4 font-semibold">رقم SKU</th>
                  <th className="text-right p-4 font-semibold">الفئة</th>
                  <th className="text-right p-4 font-semibold">المخزون</th>
                  <th className="text-right p-4 font-semibold">الحالة</th>
                  <th className="text-right p-4 font-semibold">السعر</th>
                  <th className="text-right p-4 font-semibold">المورد</th>
                  <th className="text-right p-4 font-semibold">آخر تحديث</th>
                  <th className="text-right p-4 font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">التكلفة: {item.costPrice} جنيه</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">{item.sku}</code>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">
                        {categoryLabels[item.category as keyof typeof categoryLabels]}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="text-center">
                        <div className="font-bold arabic-nums">{item.currentStock}</div>
                        <div className="text-xs text-gray-500">
                          ({item.minStock} - {item.maxStock})
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge 
                        variant="outline" 
                        className={`${statusColors[item.status]} text-white border-0`}
                      >
                        {statusLabels[item.status]}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="font-bold arabic-nums">{item.unitPrice} جنيه</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">{item.supplier || 'غير محدد'}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">{new Date(item.lastUpdated).toLocaleDateString('ar-EG')}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2 space-x-reverse">
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredInventory.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">لا توجد منتجات تطابق البحث</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}