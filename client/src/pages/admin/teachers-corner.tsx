import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  BookOpen, 
  GraduationCap, 
  School,
  Award,
  Eye,
  Search,
  Filter,
  Home,
  Package,
  Store,
  BarChart3,
  FileText
} from 'lucide-react';
import { Link } from 'wouter';
import { TeacherEditForm } from '@/components/TeacherEditForm';

export default function TeachersCorner() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch teachers data
  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['/api/admin/teachers'],
  });

  // Type the teachers array properly
  const typedTeachers = teachers as any[];

  // Save teacher mutation (create or update)
  const saveTeacherMutation = useMutation({
    mutationFn: (data: any) => {
      if (selectedTeacher?.id) {
        return apiRequest('PUT', `/api/admin/teachers/${selectedTeacher.id}`, data);
      } else {
        return apiRequest('POST', '/api/admin/teachers', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teachers'] });
      toast({ title: selectedTeacher?.id ? "تم تحديث بيانات المعلم بنجاح" : "تم إضافة المعلم بنجاح" });
      setIsEditDialogOpen(false);
      setSelectedTeacher(null);
    },
    onError: () => {
      toast({ title: "خطأ في حفظ بيانات المعلم", variant: "destructive" });
    }
  });

  // Delete teacher mutation
  const deleteTeacherMutation = useMutation({
    mutationFn: (teacherId: string) => apiRequest('DELETE', `/api/admin/teachers/${teacherId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teachers'] });
      toast({ title: "تم حذف المعلم بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ في حذف المعلم", variant: "destructive" });
    }
  });

  // Filter teachers based on search term and status
  const filteredTeachers = typedTeachers.filter((teacher: any) => {
    const matchesSearch = teacher.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || teacher.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'inactive': return 'غير نشط';
      case 'pending': return 'في الانتظار';
      case 'suspended': return 'معلق';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Admin Navigation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5" />
              لوحة التحكم الإدارية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Link href="/admin">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50">
                  <Home className="w-6 h-6 text-blue-600" />
                  <span className="text-xs">الرئيسية</span>
                </Button>
              </Link>
              
              <Link href="/admin/store">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-green-50">
                  <Store className="w-6 h-6 text-green-600" />
                  <span className="text-xs">المتجر</span>
                </Button>
              </Link>
              
              <Link href="/admin/products">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50">
                  <Package className="w-6 h-6 text-purple-600" />
                  <span className="text-xs">المنتجات</span>
                </Button>
              </Link>
              
              <Button variant="default" className="h-20 flex flex-col items-center justify-center space-y-2 bg-orange-600 hover:bg-orange-700">
                <GraduationCap className="w-6 h-6 text-white" />
                <span className="text-xs">ركن المعلم</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-orange-50">
                <BarChart3 className="w-6 h-6 text-orange-600" />
                <span className="text-xs">التقارير</span>
              </Button>
              
              <Link href="/cloudinary-test">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2 hover:bg-indigo-50">
                  <FileText className="w-6 h-6 text-indigo-600" />
                  <span className="text-xs">اختبار Cloudinary</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ركن المعلم</h1>
            <p className="text-gray-600">إدارة بيانات المعلمين والأساتذة</p>
          </div>
          
          <Button 
            onClick={() => {
              setSelectedTeacher(null);
              setIsEditDialogOpen(true);
            }}
            className="bg-purple-600 hover:bg-purple-700"
            data-testid="button-add-teacher"
          >
            <Plus className="w-4 h-4 mr-2" />
            إضافة معلم جديد
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="البحث عن معلم..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-teachers"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-48">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger data-testid="select-filter-status">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المعلمين</SelectItem>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
                    <SelectItem value="suspended">معلق</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي المعلمين</p>
                  <p className="text-2xl font-bold">{typedTeachers.length}</p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">المعلمين النشطين</p>
                  <p className="text-2xl font-bold">
                    {typedTeachers.filter((t: any) => t.status === 'active').length}
                  </p>
                </div>
                <GraduationCap className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">المعلمين المتميزين</p>
                  <p className="text-2xl font-bold">
                    {typedTeachers.filter((t: any) => t.rating >= 4.5).length}
                  </p>
                </div>
                <Award className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">المواد التعليمية</p>
                  <p className="text-2xl font-bold">
                    {typedTeachers.reduce((sum: number, t: any) => sum + (t.materialsCount || 0), 0)}
                  </p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teachers List */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة المعلمين</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">جاري تحميل بيانات المعلمين...</p>
                </div>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">لا يوجد معلمين</p>
                <p className="text-gray-400">ابدأ بإضافة المعلمين الأوائل</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeachers.map((teacher: any) => (
                  <Card key={teacher.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{teacher.fullName}</h3>
                          <p className="text-sm text-gray-600 mb-2">{teacher.email}</p>
                          <div className="flex items-center gap-2 mb-2">
                            <School className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{teacher.school || 'غير محدد'}</span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(teacher.status)}>
                          {getStatusText(teacher.status)}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">التخصص:</span>
                          <span className="font-medium">{teacher.specialization || 'غير محدد'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">سنوات الخبرة:</span>
                          <span className="font-medium">{teacher.yearsOfExperience || 0} سنة</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">التقييم:</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="font-medium">{teacher.rating || 0}/5</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">عدد الطلاب:</span>
                          <span className="font-medium">{teacher.studentsCount || 0}</span>
                        </div>
                      </div>

                      <div className="flex justify-between gap-2">
                        <Button
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setIsEditDialogOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                          data-testid={`button-edit-teacher-${teacher.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذا المعلم؟')) {
                              deleteTeacherMutation.mutate(teacher.id);
                            }
                          }}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          data-testid={`button-delete-teacher-${teacher.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teacher Edit Form */}
        <TeacherEditForm
          teacher={selectedTeacher}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedTeacher(null);
          }}
          onSave={saveTeacherMutation.mutate}
        />
      </div>
    </div>
  );
}