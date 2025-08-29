import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

export default function TeachersCorner() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Fetch teachers data
  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['/api/admin/teachers'],
  });

  // Type the teachers array properly
  const typedTeachers = teachers as any[];

  // Create teacher mutation
  const createTeacherMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/admin/teachers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teachers'] });
      toast({ title: "تم إضافة المعلم بنجاح" });
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({ title: "خطأ في إضافة المعلم", variant: "destructive" });
    }
  });

  // Update teacher mutation
  const updateTeacherMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', `/api/admin/teachers/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teachers'] });
      toast({ title: "تم تحديث بيانات المعلم بنجاح" });
      setIsEditDialogOpen(false);
    },
    onError: () => {
      toast({ title: "خطأ في تحديث بيانات المعلم", variant: "destructive" });
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
                         teacher.teacherCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || teacher.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const TeacherForm = ({ teacher = null, onSubmit, isLoading: formLoading }: any) => {
    const [formData, setFormData] = useState({
      fullName: teacher?.fullName || '',
      email: teacher?.email || '',
      phone: teacher?.phone || '',
      countryCode: teacher?.countryCode || '+20',
      specialization: teacher?.specialization || '',
      school: teacher?.school || '',
      educationLevel: teacher?.educationLevel || '',
      university: teacher?.university || '',
      graduationYear: teacher?.graduationYear || '',
      yearsOfExperience: teacher?.yearsOfExperience || '0',
      gradesTaught: teacher?.gradesTaught || [],
      subjectsSpecialty: teacher?.subjectsSpecialty || [],
      bio: teacher?.bio || '',
      isVerified: teacher?.isVerified || false,
      status: teacher?.status || 'active'
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(teacher ? { ...formData, id: teacher.id } : formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">الاسم الكامل</label>
            <Input
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
              placeholder="اسم المعلم"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="البريد الإلكتروني"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">رقم الهاتف</label>
            <div className="flex gap-2">
              <Select 
                value={formData.countryCode} 
                onValueChange={(value) => setFormData({...formData, countryCode: value})}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+20">🇪🇬 +20</SelectItem>
                  <SelectItem value="+966">🇸🇦 +966</SelectItem>
                  <SelectItem value="+971">🇦🇪 +971</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="رقم الهاتف"
                className="flex-1"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">التخصص</label>
            <Select 
              value={formData.specialization} 
              onValueChange={(value) => setFormData({...formData, specialization: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر التخصص" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="arabic">اللغة العربية</SelectItem>
                <SelectItem value="english">اللغة الإنجليزية</SelectItem>
                <SelectItem value="math">الرياضيات</SelectItem>
                <SelectItem value="science">العلوم</SelectItem>
                <SelectItem value="physics">الفيزياء</SelectItem>
                <SelectItem value="chemistry">الكيمياء</SelectItem>
                <SelectItem value="biology">الأحياء</SelectItem>
                <SelectItem value="history">التاريخ</SelectItem>
                <SelectItem value="geography">الجغرافيا</SelectItem>
                <SelectItem value="islamic">التربية الإسلامية</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">المدرسة</label>
            <Input
              value={formData.school}
              onChange={(e) => setFormData({...formData, school: e.target.value})}
              placeholder="اسم المدرسة"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">المؤهل التعليمي</label>
            <Select 
              value={formData.educationLevel} 
              onValueChange={(value) => setFormData({...formData, educationLevel: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر المؤهل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bachelor">بكالوريوس</SelectItem>
                <SelectItem value="master">ماجستير</SelectItem>
                <SelectItem value="phd">دكتوراه</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">الجامعة</label>
            <Input
              value={formData.university}
              onChange={(e) => setFormData({...formData, university: e.target.value})}
              placeholder="اسم الجامعة"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">سنة التخرج</label>
            <Input
              type="number"
              value={formData.graduationYear}
              onChange={(e) => setFormData({...formData, graduationYear: e.target.value})}
              placeholder="سنة التخرج"
              min="1970"
              max={new Date().getFullYear()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">سنوات الخبرة</label>
            <Input
              type="number"
              value={formData.yearsOfExperience}
              onChange={(e) => setFormData({...formData, yearsOfExperience: e.target.value})}
              placeholder="سنوات الخبرة"
              min="0"
              max="50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">الحالة</label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData({...formData, status: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
                <SelectItem value="suspended">معلق</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">نبذة عن المعلم</label>
          <Textarea
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
            placeholder="نبذة مختصرة عن المعلم وخبراته"
            rows={3}
          />
        </div>

        <div className="flex justify-end space-x-2 space-x-reverse pt-4">
          <Button type="submit" disabled={formLoading}>
            {formLoading ? 'جاري الحفظ...' : (teacher ? 'تحديث' : 'إضافة')}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Admin Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">التنقل السريع</h2>
              <Badge className="bg-purple-100 text-purple-800">ركن المعلم</Badge>
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
              
              <div className="bg-purple-50 border-2 border-purple-200 rounded-lg h-20 flex flex-col items-center justify-center space-y-2">
                <Users className="w-6 h-6 text-purple-600" />
                <span className="text-xs text-purple-800 font-medium">ركن المعلم</span>
              </div>
              
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
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                إضافة معلم جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إضافة معلم جديد</DialogTitle>
              </DialogHeader>
              <TeacherForm 
                onSubmit={createTeacherMutation.mutate}
                isLoading={createTeacherMutation.isPending}
              />
            </DialogContent>
          </Dialog>
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
                  />
                </div>
              </div>
              
              <div className="w-full md:w-48">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
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
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              قائمة المعلمين ({filteredTeachers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>جاري تحميل بيانات المعلمين...</p>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">لا توجد بيانات معلمين متاحة</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeachers.map((teacher: any) => (
                  <Card key={teacher.id} className="border hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{teacher.fullName}</h3>
                          <p className="text-sm text-gray-600">{teacher.specialization}</p>
                          {teacher.school && (
                            <p className="text-xs text-gray-500 flex items-center mt-1">
                              <School className="w-3 h-3 mr-1" />
                              {teacher.school}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={
                            teacher.status === 'active' ? 'default' : 
                            teacher.status === 'suspended' ? 'destructive' : 
                            'secondary'
                          }>
                            {teacher.status === 'active' ? 'نشط' : 
                             teacher.status === 'suspended' ? 'معلق' : 
                             'غير نشط'}
                          </Badge>
                          {teacher.isVerified && (
                            <Badge className="bg-green-100 text-green-800">
                              <Award className="w-3 h-3 mr-1" />
                              معتمد
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {teacher.rating > 0 && (
                          <div className="flex items-center text-sm">
                            <Star className="w-4 h-4 text-yellow-500 mr-1" />
                            <span>{teacher.rating.toFixed(1)}</span>
                            <span className="text-gray-500 mr-1">
                              ({teacher.ratingCount} تقييم)
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <BookOpen className="w-4 h-4 mr-1" />
                          <span>{teacher.materialsCount || 0} مادة تعليمية</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-1" />
                          <span>{teacher.studentsCount || 0} طالب</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setIsEditDialogOpen(true);
                          }}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          تعديل
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذا المعلم؟')) {
                              deleteTeacherMutation.mutate(teacher.id);
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
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

        {/* Edit Teacher Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تعديل بيانات المعلم</DialogTitle>
            </DialogHeader>
            {selectedTeacher && (
              <TeacherForm 
                teacher={selectedTeacher}
                onSubmit={updateTeacherMutation.mutate}
                isLoading={updateTeacherMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}