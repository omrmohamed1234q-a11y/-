import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Users, Package, ShoppingCart, Star, Plus, Edit, Trash2, Eye, Settings, BarChart3, 
  TrendingUp, Gift, Trophy, Percent, Calendar, DollarSign, Tag, Image, Save, X
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check localStorage for admin user if auth hook hasn't loaded yet
  const [localUser, setLocalUser] = useState(null);
  
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setLocalUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
      }
    }
  }, []);

  const currentUser = user || localUser;
  const isMainAdmin = currentUser?.email === 'printformead1@gmail.com';
  const isAdmin = currentUser?.role === 'admin' || isMainAdmin;
  
  // Show loading if still checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل لوحة الإدارة...</p>
        </div>
      </div>
    );
  }
  
  if (!currentUser || !isAdmin) {
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
            <Button onClick={() => window.location.href = '/auth/login'}>
              تسجيل الدخول كمدير
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

  const { data: products } = useQuery({
    queryKey: ['/api/admin/products'],
  });

  const { data: offers } = useQuery({
    queryKey: ['/api/admin/offers'],
  });

  const { data: awards } = useQuery({
    queryKey: ['/api/admin/awards'],
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/admin/categories'],
  });

  const { data: orders } = useQuery({
    queryKey: ['/api/admin/orders'],
  });

  const { data: users } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  // Product Management Component
  const ProductsManagement = () => {
    const [editingProduct, setEditingProduct] = useState(null);
    const [newProduct, setNewProduct] = useState({
      name: '',
      nameEn: '',
      description: '',
      descriptionEn: '',
      price: '',
      category: '',
      imageUrl: '',
      stock: '',
      isDigital: false
    });

    const addProductMutation = useMutation({
      mutationFn: (product: any) => apiRequest('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify(product)
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
        setNewProduct({
          name: '', nameEn: '', description: '', descriptionEn: '', 
          price: '', category: '', imageUrl: '', stock: '', isDigital: false
        });
        toast({ title: "تم إضافة المنتج بنجاح" });
      }
    });

    const updateProductMutation = useMutation({
      mutationFn: (product: any) => apiRequest(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify(product)
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
        setEditingProduct(null);
        toast({ title: "تم تحديث المنتج بنجاح" });
      }
    });

    const deleteProductMutation = useMutation({
      mutationFn: (id: string) => apiRequest(`/api/admin/products/${id}`, {
        method: 'DELETE'
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
        toast({ title: "تم حذف المنتج بنجاح" });
      }
    });

    return (
      <div className="space-y-6">
        {/* Add New Product */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Plus className="w-5 h-5" />
              <span>إضافة منتج جديد</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>اسم المنتج (عربي)</Label>
                <Input
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder="اسم المنتج بالعربية"
                  data-testid="input-product-name"
                />
              </div>
              <div>
                <Label>اسم المنتج (English)</Label>
                <Input
                  value={newProduct.nameEn}
                  onChange={(e) => setNewProduct({...newProduct, nameEn: e.target.value})}
                  placeholder="Product name in English"
                  data-testid="input-product-name-en"
                />
              </div>
              <div>
                <Label>السعر</Label>
                <Input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  placeholder="0.00"
                  data-testid="input-product-price"
                />
              </div>
              <div>
                <Label>الكمية المتاحة</Label>
                <Input
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                  placeholder="100"
                  data-testid="input-product-stock"
                />
              </div>
              <div className="md:col-span-2">
                <Label>الوصف (عربي)</Label>
                <Textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="وصف المنتج بالعربية"
                  data-testid="textarea-product-description"
                />
              </div>
              <div className="md:col-span-2">
                <Label>رابط الصورة</Label>
                <Input
                  value={newProduct.imageUrl}
                  onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                  data-testid="input-product-image"
                />
              </div>
            </div>
            <Button 
              className="mt-4 w-full"
              onClick={() => addProductMutation.mutate(newProduct)}
              disabled={addProductMutation.isPending}
              data-testid="button-add-product"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة المنتج
            </Button>
          </CardContent>
        </Card>

        {/* Products List */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة المنتجات</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المنتج</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>المخزون</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(products as any[])?.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded object-cover" />
                        <div>
                          <div className="font-medium" data-testid={`product-name-${product.id}`}>
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">{product.nameEn}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`product-price-${product.id}`}>
                      {product.price} ر.س
                    </TableCell>
                    <TableCell data-testid={`product-stock-${product.id}`}>
                      {product.stock}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                        {product.stock > 0 ? "متوفر" : "نفد المخزون"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2 space-x-reverse">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setEditingProduct(product)}
                          data-testid={`button-edit-product-${product.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => deleteProductMutation.mutate(product.id)}
                          data-testid={`button-delete-product-${product.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Offers Management Component
  const OffersManagement = () => {
    const [newOffer, setNewOffer] = useState({
      title: '',
      titleEn: '',
      description: '',
      descriptionEn: '',
      discountType: 'percentage',
      discountValue: '',
      startDate: '',
      endDate: '',
      isActive: true,
      imageUrl: ''
    });

    const addOfferMutation = useMutation({
      mutationFn: (offer: any) => apiRequest('/api/admin/offers', {
        method: 'POST',
        body: JSON.stringify(offer)
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/offers'] });
        setNewOffer({
          title: '', titleEn: '', description: '', descriptionEn: '',
          discountType: 'percentage', discountValue: '', startDate: '', 
          endDate: '', isActive: true, imageUrl: ''
        });
        toast({ title: "تم إضافة العرض بنجاح" });
      }
    });

    const toggleOfferMutation = useMutation({
      mutationFn: (offer: any) => apiRequest(`/api/admin/offers/${offer.id}`, {
        method: 'PUT',
        body: JSON.stringify({...offer, isActive: !offer.isActive})
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/offers'] });
        toast({ title: "تم تحديث حالة العرض" });
      }
    });

    return (
      <div className="space-y-6">
        {/* Add New Offer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Percent className="w-5 h-5" />
              <span>إضافة عرض جديد</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>عنوان العرض (عربي)</Label>
                <Input
                  value={newOffer.title}
                  onChange={(e) => setNewOffer({...newOffer, title: e.target.value})}
                  placeholder="عنوان العرض"
                  data-testid="input-offer-title"
                />
              </div>
              <div>
                <Label>عنوان العرض (English)</Label>
                <Input
                  value={newOffer.titleEn}
                  onChange={(e) => setNewOffer({...newOffer, titleEn: e.target.value})}
                  placeholder="Offer title"
                  data-testid="input-offer-title-en"
                />
              </div>
              <div>
                <Label>نوع الخصم</Label>
                <Select value={newOffer.discountType} onValueChange={(value) => setNewOffer({...newOffer, discountType: value})}>
                  <SelectTrigger data-testid="select-discount-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">نسبة مئوية</SelectItem>
                    <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>قيمة الخصم</Label>
                <Input
                  type="number"
                  value={newOffer.discountValue}
                  onChange={(e) => setNewOffer({...newOffer, discountValue: e.target.value})}
                  placeholder={newOffer.discountType === 'percentage' ? '20' : '50'}
                  data-testid="input-discount-value"
                />
              </div>
              <div>
                <Label>تاريخ البداية</Label>
                <Input
                  type="date"
                  value={newOffer.startDate}
                  onChange={(e) => setNewOffer({...newOffer, startDate: e.target.value})}
                  data-testid="input-start-date"
                />
              </div>
              <div>
                <Label>تاريخ الانتهاء</Label>
                <Input
                  type="date"
                  value={newOffer.endDate}
                  onChange={(e) => setNewOffer({...newOffer, endDate: e.target.value})}
                  data-testid="input-end-date"
                />
              </div>
              <div className="md:col-span-2">
                <Label>وصف العرض</Label>
                <Textarea
                  value={newOffer.description}
                  onChange={(e) => setNewOffer({...newOffer, description: e.target.value})}
                  placeholder="تفاصيل العرض"
                  data-testid="textarea-offer-description"
                />
              </div>
            </div>
            <Button 
              className="mt-4 w-full"
              onClick={() => addOfferMutation.mutate(newOffer)}
              disabled={addOfferMutation.isPending}
              data-testid="button-add-offer"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة العرض
            </Button>
          </CardContent>
        </Card>

        {/* Offers List */}
        <Card>
          <CardHeader>
            <CardTitle>العروض الحالية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {(offers as any[])?.map((offer) => (
                <div key={offer.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Percent className="w-8 h-8 text-green-600" />
                      <div>
                        <h3 className="font-semibold" data-testid={`offer-title-${offer.id}`}>
                          {offer.title}
                        </h3>
                        <p className="text-sm text-gray-600">{offer.titleEn}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Badge variant={offer.isActive ? "default" : "secondary"}>
                        {offer.isActive ? "نشط" : "غير نشط"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleOfferMutation.mutate(offer)}
                        data-testid={`button-toggle-offer-${offer.id}`}
                      >
                        {offer.isActive ? "إيقاف" : "تفعيل"}
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-2">{offer.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>خصم: {offer.discountValue}{offer.discountType === 'percentage' ? '%' : ' ر.س'}</span>
                    <span>من {offer.startDate} إلى {offer.endDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Awards Management Component
  const AwardsManagement = () => {
    const [newAward, setNewAward] = useState({
      name: '',
      nameEn: '',
      description: '',
      descriptionEn: '',
      pointsCost: '',
      type: 'discount',
      value: '',
      imageUrl: '',
      isActive: true,
      stock: ''
    });

    const addAwardMutation = useMutation({
      mutationFn: (award: any) => apiRequest('/api/admin/awards', {
        method: 'POST',
        body: JSON.stringify(award)
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/awards'] });
        setNewAward({
          name: '', nameEn: '', description: '', descriptionEn: '',
          pointsCost: '', type: 'discount', value: '', imageUrl: '',
          isActive: true, stock: ''
        });
        toast({ title: "تم إضافة المكافأة بنجاح" });
      }
    });

    const toggleAwardMutation = useMutation({
      mutationFn: (award: any) => apiRequest(`/api/admin/awards/${award.id}`, {
        method: 'PUT',
        body: JSON.stringify({...award, isActive: !award.isActive})
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/admin/awards'] });
        toast({ title: "تم تحديث حالة المكافأة" });
      }
    });

    return (
      <div className="space-y-6">
        {/* Add New Award */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Trophy className="w-5 h-5" />
              <span>إضافة مكافأة جديدة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>اسم المكافأة (عربي)</Label>
                <Input
                  value={newAward.name}
                  onChange={(e) => setNewAward({...newAward, name: e.target.value})}
                  placeholder="اسم المكافأة"
                  data-testid="input-award-name"
                />
              </div>
              <div>
                <Label>اسم المكافأة (English)</Label>
                <Input
                  value={newAward.nameEn}
                  onChange={(e) => setNewAward({...newAward, nameEn: e.target.value})}
                  placeholder="Award name"
                  data-testid="input-award-name-en"
                />
              </div>
              <div>
                <Label>نوع المكافأة</Label>
                <Select value={newAward.type} onValueChange={(value) => setNewAward({...newAward, type: value})}>
                  <SelectTrigger data-testid="select-award-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">خصم</SelectItem>
                    <SelectItem value="freeprint">طباعة مجانية</SelectItem>
                    <SelectItem value="voucher">قسيمة شراء</SelectItem>
                    <SelectItem value="gift">هدية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>قيمة المكافأة</Label>
                <Input
                  value={newAward.value}
                  onChange={(e) => setNewAward({...newAward, value: e.target.value})}
                  placeholder="القيمة"
                  data-testid="input-award-value"
                />
              </div>
              <div>
                <Label>تكلفة النقاط</Label>
                <Input
                  type="number"
                  value={newAward.pointsCost}
                  onChange={(e) => setNewAward({...newAward, pointsCost: e.target.value})}
                  placeholder="100"
                  data-testid="input-points-cost"
                />
              </div>
              <div>
                <Label>الكمية المتاحة</Label>
                <Input
                  type="number"
                  value={newAward.stock}
                  onChange={(e) => setNewAward({...newAward, stock: e.target.value})}
                  placeholder="50"
                  data-testid="input-award-stock"
                />
              </div>
              <div className="md:col-span-2">
                <Label>وصف المكافأة</Label>
                <Textarea
                  value={newAward.description}
                  onChange={(e) => setNewAward({...newAward, description: e.target.value})}
                  placeholder="تفاصيل المكافأة"
                  data-testid="textarea-award-description"
                />
              </div>
            </div>
            <Button 
              className="mt-4 w-full"
              onClick={() => addAwardMutation.mutate(newAward)}
              disabled={addAwardMutation.isPending}
              data-testid="button-add-award"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة المكافأة
            </Button>
          </CardContent>
        </Card>

        {/* Awards List */}
        <Card>
          <CardHeader>
            <CardTitle>المكافآت المتاحة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {(awards as any[])?.map((award) => (
                <div key={award.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <Trophy className="w-8 h-8 text-yellow-600" />
                      <div>
                        <h3 className="font-semibold" data-testid={`award-name-${award.id}`}>
                          {award.name}
                        </h3>
                        <p className="text-sm text-gray-600">{award.nameEn}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Badge variant={award.isActive ? "default" : "secondary"}>
                        {award.isActive ? "متاح" : "غير متاح"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAwardMutation.mutate(award)}
                        data-testid={`button-toggle-award-${award.id}`}
                      >
                        {award.isActive ? "إيقاف" : "تفعيل"}
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-2">{award.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>التكلفة: {award.pointsCost} نقطة</span>
                    <span>المتاح: {award.stock}</span>
                    <span>النوع: {award.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Admin Management Component (only for main admin)
  const AdminManagement = () => {
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [adminUsers, setAdminUsers] = useState([]);

    // Fetch admin users
    useEffect(() => {
      const fetchAdminUsers = async () => {
        try {
          const response = await apiRequest('/api/admin/admin-users');
          setAdminUsers(response);
        } catch (error) {
          console.error('Error fetching admin users:', error);
        }
      };
      fetchAdminUsers();
    }, []);

    const addAdminMutation = useMutation({
      mutationFn: (email: string) => apiRequest('/api/admin/add-admin', {
        method: 'POST',
        body: JSON.stringify({ email })
      }),
      onSuccess: () => {
        setNewAdminEmail('');
        toast({ title: "تم إضافة المدير بنجاح" });
        // Refresh admin users list
        window.location.reload();
      },
      onError: (error: any) => {
        toast({ 
          title: "خطأ", 
          description: error.message || "فشل في إضافة المدير",
          variant: "destructive" 
        });
      }
    });

    const removeAdminMutation = useMutation({
      mutationFn: (email: string) => apiRequest('/api/admin/remove-admin', {
        method: 'POST',
        body: JSON.stringify({ email })
      }),
      onSuccess: () => {
        toast({ title: "تم إزالة المدير بنجاح" });
        // Refresh admin users list
        window.location.reload();
      },
      onError: (error: any) => {
        toast({ 
          title: "خطأ", 
          description: error.message || "فشل في إزالة المدير",
          variant: "destructive" 
        });
      }
    });

    return (
      <div className="space-y-6">
        {/* Add New Admin */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Plus className="w-5 h-5" />
              <span>إضافة مدير جديد</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="admin-email">البريد الإلكتروني للمدير</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="example@domain.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  data-testid="input-admin-email"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={() => addAdminMutation.mutate(newAdminEmail)}
                  disabled={!newAdminEmail || addAdminMutation.isPending}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  data-testid="button-add-admin"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة مدير
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Admins List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Settings className="w-5 h-5" />
              <span>المديرين الحاليين</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {adminUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>لا يوجد مديرين مضافين بعد</p>
              </div>
            ) : (
              <div className="space-y-4">
                {adminUsers.map((admin: any, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                    data-testid={`admin-item-${index}`}
                  >
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{admin.email}</p>
                        <p className="text-sm text-gray-500">
                          {admin.firstName && admin.lastName ? 
                            `${admin.firstName} ${admin.lastName}` : 
                            'لم يتم تعيين الاسم بعد'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        مدير
                      </Badge>
                      {admin.email !== 'printformead1@gmail.com' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeAdminMutation.mutate(admin.email)}
                          disabled={removeAdminMutation.isPending}
                          data-testid={`button-remove-admin-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Privileges Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Eye className="w-5 h-5" />
              <span>صلاحيات المديرين</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">✓</Badge>
                <span className="text-sm">إدارة المنتجات (إضافة، تحديث، حذف)</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">✓</Badge>
                <span className="text-sm">إدارة العروض والمكافآت</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">✓</Badge>
                <span className="text-sm">عرض الإحصائيات والتقارير</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">✓</Badge>
                <span className="text-sm">إدارة الطلبات والمستخدمين</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">×</Badge>
                <span className="text-sm">إضافة أو إزالة مديرين آخرين (محصور على المدير الرئيسي)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-3 rounded-xl">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">لوحة إدارة اطبعلي</h1>
                <p className="text-gray-600">إدارة المتجر والعروض والمكافآت</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              data-testid="button-back-home"
            >
              العودة للرئيسية
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">إجمالي المستخدمين</p>
                  <p className="text-3xl font-bold" data-testid="stat-total-users">
                    {(stats as any)?.totalUsers || 0}
                  </p>
                </div>
                <Users className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">إجمالي المنتجات</p>
                  <p className="text-3xl font-bold" data-testid="stat-total-products">
                    {(stats as any)?.totalProducts || 0}
                  </p>
                </div>
                <Package className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">إجمالي الطلبات</p>
                  <p className="text-3xl font-bold" data-testid="stat-total-orders">
                    {(stats as any)?.totalOrders || 0}
                  </p>
                </div>
                <ShoppingCart className="w-12 h-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">النقاط المُوزعة</p>
                  <p className="text-3xl font-bold" data-testid="stat-total-points">
                    {(stats as any)?.totalPointsDistributed || 0}
                  </p>
                </div>
                <Star className="w-12 h-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className={`grid w-full ${isMainAdmin ? 'grid-cols-7' : 'grid-cols-6'}`}>
            <TabsTrigger value="products">المنتجات</TabsTrigger>
            <TabsTrigger value="offers">العروض</TabsTrigger>
            <TabsTrigger value="awards">المكافآت</TabsTrigger>
            <TabsTrigger value="categories">الفئات</TabsTrigger>
            <TabsTrigger value="orders">الطلبات</TabsTrigger>
            <TabsTrigger value="users">المستخدمين</TabsTrigger>
            {isMainAdmin && (
              <TabsTrigger value="admin-management">إدارة المديرين</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="products">
            <ProductsManagement />
          </TabsContent>

          <TabsContent value="offers">
            <OffersManagement />
          </TabsContent>

          <TabsContent value="awards">
            <AwardsManagement />
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>إدارة الفئات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">إدارة فئات المنتجات قريباً...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>إدارة الطلبات</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">إدارة الطلبات قريباً...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>إدارة المستخدمين</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">إدارة المستخدمين قريباً...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {isMainAdmin && (
            <TabsContent value="admin-management">
              <AdminManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}