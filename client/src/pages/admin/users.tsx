import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Search, 
  Filter,
  User,
  Phone,
  Mail,
  Calendar,
  ShoppingCart,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  AlertCircle,
  Package,
  Home,
  Store,
  BookOpen,
  BarChart3,
  FileText
} from 'lucide-react';
import { Link } from 'wouter';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  age?: number;
  gradeLevel?: string;
  countryCode?: string;
  role: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLoginAt?: string;
  totalOrders: number;
  totalSpent: number;
  bountyPoints: number;
  accountLevel: number;
  orders?: Array<{
    id: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  // Fetch users data
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
  });

  // Get grade level label
  const getGradeLevelLabel = (grade?: string) => {
    const gradeMap: { [key: string]: string } = {
      'kg_1': 'روضة أولى',
      'kg_2': 'روضة ثانية', 
      'primary_1': 'الأول الابتدائي',
      'primary_2': 'الثاني الابتدائي',
      'primary_3': 'الثالث الابتدائي',
      'primary_4': 'الرابع الابتدائي',
      'primary_5': 'الخامس الابتدائي',
      'primary_6': 'السادس الابتدائي',
      'preparatory_1': 'الأول الإعدادي',
      'preparatory_2': 'الثاني الإعدادي',
      'preparatory_3': 'الثالث الإعدادي',
      'secondary_1': 'الأول الثانوي',
      'secondary_2': 'الثاني الثانوي',
      'secondary_3': 'الثالث الثانوي',
      'university': 'طالب جامعي',
      'teacher': 'معلم/مدرس',
      'parent': 'ولي أمر'
    };
    return grade ? gradeMap[grade] || grade : 'غير محدد';
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'inactive': return 'غير نشط';
      case 'suspended': return 'معلق';
      default: return status;
    }
  };

  // Get role label
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'مدير';
      case 'teacher': return 'معلم';
      case 'student': return 'طالب';
      case 'parent': return 'ولي أمر';
      default: return role;
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.phone && user.phone.includes(searchTerm));
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} جنيه`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show user details
  const showUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsDetailsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">جاري تحميل بيانات المستخدمين...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Admin Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">لوحة التحكم الإدارية</h2>
              <Badge className="bg-purple-100 text-purple-800">المستخدمين</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Link href="/admin">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50">
                  <Home className="w-6 h-6 text-blue-600" />
                  <span className="text-xs">الرئيسية</span>
                </Button>
              </Link>
              
              <Link href="/admin-products">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-green-50">
                  <Package className="w-6 h-6 text-green-600" />
                  <span className="text-xs">المنتجات</span>
                </Button>
              </Link>
              
              <Link href="/admin/store">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-green-50">
                  <Store className="w-6 h-6 text-green-600" />
                  <span className="text-xs">المتجر</span>
                </Button>
              </Link>
              
              <Link href="/admin/teachers-corner">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  <span className="text-xs">ركن المعلم</span>
                </Button>
              </Link>
              
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg h-20 flex flex-col items-center justify-center space-y-2">
                <Users className="w-6 h-6 text-purple-600" />
                <span className="text-xs text-purple-800 font-medium">المستخدمين</span>
              </div>
              
              <Link href="/admin">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-orange-50">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                  <span className="text-xs">التقارير</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/">
              <Button variant="outline" className="flex items-center space-x-2 space-x-reverse">
                <Home className="w-4 h-4" />
                <span>العودة للرئيسية</span>
              </Button>
            </Link>
            <div className="flex items-center space-x-4 space-x-reverse">
              <Badge variant="outline" className="px-4 py-2">
                إجمالي المستخدمين: {users.length}
              </Badge>
              <Badge variant="outline" className="px-4 py-2">
                النشطين: {users.filter(u => u.status === 'active').length}
              </Badge>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المستخدمين</h1>
            <p className="text-gray-600">عرض وإدارة جميع حسابات المستخدمين في النظام</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث بالاسم، البريد، أو الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue placeholder="فلترة حسب الدور" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأدوار</SelectItem>
                  <SelectItem value="admin">مدير</SelectItem>
                  <SelectItem value="teacher">معلم</SelectItem>
                  <SelectItem value="student">طالب</SelectItem>
                  <SelectItem value="parent">ولي أمر</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="فلترة حسب الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                  <SelectItem value="suspended">معلق</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" className="flex items-center space-x-2 space-x-reverse">
                <Filter className="w-4 h-4" />
                <span>تصفية متقدمة</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse">
              <Users className="w-5 h-5" />
              <span>قائمة المستخدمين ({filteredUsers.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-3 font-semibold">المستخدم</th>
                    <th className="text-right p-3 font-semibold">البيانات</th>
                    <th className="text-right p-3 font-semibold">الدور</th>
                    <th className="text-right p-3 font-semibold">الحالة</th>
                    <th className="text-right p-3 font-semibold">الطلبات</th>
                    <th className="text-right p-3 font-semibold">المصروف</th>
                    <th className="text-right p-3 font-semibold">النقاط</th>
                    <th className="text-right p-3 font-semibold">آخر دخول</th>
                    <th className="text-right p-3 font-semibold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center space-x-3 space-x-reverse">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {user.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{user.fullName}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm space-y-1">
                          {user.phone && (
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                          {user.age && (
                            <div className="text-gray-500">العمر: {user.age} سنة</div>
                          )}
                          {user.gradeLevel && (
                            <div className="text-gray-500">{getGradeLevelLabel(user.gradeLevel)}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {getRoleLabel(user.role)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={getStatusColor(user.status)}>
                          {getStatusLabel(user.status)}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <ShoppingCart className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold">{user.totalOrders}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-green-600">
                          {formatCurrency(user.totalSpent)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-yellow-600">{user.accountLevel}</span>
                          </div>
                          <span className="text-sm font-medium">{user.bountyPoints}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-gray-500">
                          {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'لم يسجل دخول'}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => showUserDetails(user)}
                            className="p-2"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="p-2">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="p-2 text-red-600">
                            <Ban className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">لا توجد مستخدمين مطابقين للفلترة المحددة</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3 space-x-reverse">
                <User className="w-6 h-6" />
                <span>تفاصيل المستخدم: {selectedUser?.fullName}</span>
              </DialogTitle>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">المعلومات الأساسية</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">الاسم الكامل</label>
                        <p className="text-lg font-semibold">{selectedUser.fullName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">البريد الإلكتروني</label>
                        <p className="text-lg">{selectedUser.email}</p>
                      </div>
                      {selectedUser.phone && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">رقم الهاتف</label>
                          <p className="text-lg">{selectedUser.phone}</p>
                        </div>
                      )}
                      {selectedUser.age && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">العمر</label>
                          <p className="text-lg">{selectedUser.age} سنة</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-500">المرحلة التعليمية</label>
                        <p className="text-lg">{getGradeLevelLabel(selectedUser.gradeLevel)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">الدور</label>
                        <Badge className="bg-blue-100 text-blue-800">{getRoleLabel(selectedUser.role)}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">حالة الحساب</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <Badge className={getStatusColor(selectedUser.status)}>
                          {getStatusLabel(selectedUser.status)}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-2">حالة الحساب</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{selectedUser.bountyPoints}</div>
                        <p className="text-sm text-gray-500">نقاط المكافآت</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">المستوى {selectedUser.accountLevel}</div>
                        <p className="text-sm text-gray-500">مستوى الحساب</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">إحصائيات الطلبات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{selectedUser.totalOrders}</div>
                        <p className="text-sm text-gray-500">إجمالي الطلبات</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{formatCurrency(selectedUser.totalSpent)}</div>
                        <p className="text-sm text-gray-500">إجمالي المصروف</p>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600">
                          {selectedUser.totalOrders > 0 ? formatCurrency(selectedUser.totalSpent / selectedUser.totalOrders) : '0.00 جنيه'}
                        </div>
                        <p className="text-sm text-gray-500">متوسط قيمة الطلب</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Dates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">تواريخ مهمة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">تاريخ إنشاء الحساب</label>
                        <p className="text-lg">{formatDate(selectedUser.createdAt)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">آخر تسجيل دخول</label>
                        <p className="text-lg">
                          {selectedUser.lastLoginAt ? formatDate(selectedUser.lastLoginAt) : 'لم يسجل دخول بعد'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Orders */}
                {selectedUser.orders && selectedUser.orders.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">آخر الطلبات</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedUser.orders.slice(0, 5).map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-semibold">طلب #{order.id}</p>
                              <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600">{formatCurrency(order.total)}</p>
                              <Badge variant="outline">{order.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}