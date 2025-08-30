import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus, Edit, Trash2, Users, Crown, GraduationCap } from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  gradeLevel?: string;
  age?: number;
  phone?: string;
  role?: string;
  status?: string;
  createdAt: string;
  lastSignIn?: string;
  emailConfirmed?: boolean;
}

export default function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users from Supabase
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: () => apiRequest("/api/admin/users").then(res => res.json()),
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<User> & { id: string }) => {
      const response = await apiRequest("PUT", `/api/admin/users/${userData.id}`, userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowEditDialog(false);
      setSelectedUser(null);
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث بيانات المستخدم بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في التحديث",
        description: "حدث خطأ أثناء تحديث بيانات المستخدم",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف المستخدم بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في الحذف",
        description: "حدث خطأ أثناء حذف المستخدم",
        variant: "destructive",
      });
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const response = await apiRequest("POST", "/api/admin/users", userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowEditDialog(false);
      setSelectedUser(null);
      toast({
        title: "تم الإنشاء بنجاح",
        description: "تم إنشاء المستخدم الجديد بنجاح",
      });
    },
    onError: () => {
      toast({
        title: "خطأ في الإنشاء",
        description: "حدث خطأ أثناء إنشاء المستخدم الجديد",
        variant: "destructive",
      });
    },
  });

  // Filter users based on search and filters
  const filteredUsers = users.filter((user: User) => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditDialog(true);
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowEditDialog(true);
  };

  const handleSaveUser = (userData: Partial<User>) => {
    if (selectedUser) {
      updateUserMutation.mutate({ ...userData, id: selectedUser.id });
    } else {
      createUserMutation.mutate(userData);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "admin": return <Crown className="w-4 h-4" />;
      case "teacher": return <GraduationCap className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case "admin": return "bg-red-500";
      case "teacher": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusBadgeColor = (status?: string, emailConfirmed?: boolean) => {
    if (!emailConfirmed) return "bg-yellow-500";
    switch (status) {
      case "active": return "bg-green-500";
      case "suspended": return "bg-red-500";
      case "pending": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة المستخدمين</h1>
          <p className="text-gray-600 mt-2">إدارة وتحكم في جميع المستخدمين المسجلين</p>
        </div>
        <Button onClick={handleCreateUser} className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          إضافة مستخدم جديد
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">إجمالي المستخدمين</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المدرسين</p>
                <p className="text-2xl font-bold">{users.filter((u: User) => u.role === 'teacher').length}</p>
              </div>
              <GraduationCap className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المدراء</p>
                <p className="text-2xl font-bold">{users.filter((u: User) => u.role === 'admin').length}</p>
              </div>
              <Crown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">المستخدمين النشطين</p>
                <p className="text-2xl font-bold">{users.filter((u: User) => u.status === 'active').length}</p>
              </div>
              <div className="w-8 h-8 bg-green-500 rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="البحث بالاسم أو البريد الإلكتروني..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
                data-testid="input-search-users"
              />
            </div>
            
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-filter-role">
                <SelectValue placeholder="فلترة بالدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأدوار</SelectItem>
                <SelectItem value="admin">مدير</SelectItem>
                <SelectItem value="teacher">مدرس</SelectItem>
                <SelectItem value="student">طالب</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-filter-status">
                <SelectValue placeholder="فلترة بالحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="pending">في الانتظار</SelectItem>
                <SelectItem value="suspended">معلق</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة المستخدمين ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right p-3">المستخدم</th>
                  <th className="text-right p-3">البريد الإلكتروني</th>
                  <th className="text-right p-3">الدور</th>
                  <th className="text-right p-3">الحالة</th>
                  <th className="text-right p-3">المرحلة الدراسية</th>
                  <th className="text-right p-3">تاريخ التسجيل</th>
                  <th className="text-right p-3">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user: User) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">
                          {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'غير محدد'}
                        </div>
                        <div className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <div>{user.email}</div>
                        {!user.emailConfirmed && (
                          <Badge className="text-xs bg-yellow-500">غير مؤكد</Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={`flex items-center gap-1 w-fit ${getRoleBadgeColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        {user.role === 'admin' ? 'مدير' : user.role === 'teacher' ? 'مدرس' : 'طالب'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Badge className={`${getStatusBadgeColor(user.status, user.emailConfirmed)}`}>
                        {!user.emailConfirmed ? 'غير مؤكد' : 
                         user.status === 'active' ? 'نشط' : 
                         user.status === 'suspended' ? 'معلق' : 
                         user.status === 'pending' ? 'في الانتظار' : 'غير محدد'}
                      </Badge>
                    </td>
                    <td className="p-3">{user.gradeLevel || 'غير محدد'}</td>
                    <td className="p-3">
                      {new Date(user.createdAt).toLocaleDateString('ar-EG')}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUser(user)}
                          data-testid={`button-edit-user-${user.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(user.id)}
                          data-testid={`button-delete-user-${user.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                لا توجد مستخدمين مطابقين للبحث
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit/Create User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
            </DialogTitle>
          </DialogHeader>
          
          <UserForm
            user={selectedUser}
            onSave={handleSaveUser}
            onCancel={() => setShowEditDialog(false)}
            isLoading={updateUserMutation.isPending || createUserMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface UserFormProps {
  user: User | null;
  onSave: (userData: Partial<User>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function UserForm({ user, onSave, onCancel, isLoading }: UserFormProps) {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    fullName: user?.fullName || '',
    role: user?.role || 'student',
    status: user?.status || 'active',
    gradeLevel: user?.gradeLevel || '',
    age: user?.age || '',
    phone: user?.phone || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
          disabled={!!user} // Disable email editing for existing users
          data-testid="input-user-email"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">الاسم الأول</label>
          <Input
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
            data-testid="input-user-first-name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">الاسم الأخير</label>
          <Input
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
            data-testid="input-user-last-name"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">الاسم الكامل</label>
        <Input
          value={formData.fullName}
          onChange={(e) => setFormData({...formData, fullName: e.target.value})}
          data-testid="input-user-full-name"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">الدور</label>
          <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
            <SelectTrigger data-testid="select-user-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">طالب</SelectItem>
              <SelectItem value="teacher">مدرس</SelectItem>
              <SelectItem value="admin">مدير</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">الحالة</label>
          <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
            <SelectTrigger data-testid="select-user-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="pending">في الانتظار</SelectItem>
              <SelectItem value="suspended">معلق</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">المرحلة الدراسية</label>
          <Input
            value={formData.gradeLevel}
            onChange={(e) => setFormData({...formData, gradeLevel: e.target.value})}
            placeholder="مثل: الصف الثالث الثانوي"
            data-testid="input-user-grade-level"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">العمر</label>
          <Input
            type="number"
            value={formData.age}
            onChange={(e) => setFormData({...formData, age: parseInt(e.target.value) || ''})}
            data-testid="input-user-age"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">رقم الهاتف</label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
          placeholder="+20 123 456 7890"
          data-testid="input-user-phone"
        />
      </div>
      
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isLoading} data-testid="button-save-user">
          {isLoading ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-user">
          إلغاء
        </Button>
      </div>
    </form>
  );
}