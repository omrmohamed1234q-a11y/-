import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Search, 
  Filter, 
  BookOpen, 
  GraduationCap, 
  Star, 
  School,
  FileText,
  Download,
  Users,
  Award
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function StudentTeachers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterCurriculum, setFilterCurriculum] = useState('all');
  const { toast } = useToast();
  
  // Get current user data
  const { user: currentUser } = useAuth();

  // Fetch teachers data
  const { data: allTeachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ['/api/admin/teachers'],
  });

  // Fetch products/materials data
  const { data: allProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products'],
  });

  const typedTeachers = allTeachers as any[];
  const typedProducts = allProducts as any[];

  // Filter teachers based on student's grade level and preferences
  const getRelevantTeachers = () => {
    if (!(currentUser as any)?.gradeLevel) return typedTeachers;
    
    const userGrade = (currentUser as any).gradeLevel;
    const userLevel = getEducationLevel(userGrade);
    
    return typedTeachers.filter((teacher: any) => {
      // Check if teacher teaches student's grade level
      const teacherGrades = teacher.gradesTaught || [];
      const hasMatchingGrade = teacherGrades.some((grade: string) => {
        const teacherLevel = getEducationLevel(grade);
        return teacherLevel === userLevel || grade === userGrade;
      });
      
      return hasMatchingGrade;
    });
  };

  // Get education level from grade
  const getEducationLevel = (grade: string) => {
    if (!grade) return 'unknown';
    if (grade.includes('kg') || grade.includes('primary')) return 'primary';
    if (grade.includes('preparatory')) return 'preparatory';
    if (grade.includes('secondary')) return 'secondary';
    if (grade.includes('university')) return 'university';
    return 'unknown';
  };

  // Filter teachers based on search and filters
  const filteredTeachers = getRelevantTeachers().filter((teacher: any) => {
    const matchesSearch = teacher.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.school?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = filterSubject === 'all' || teacher.specialization === filterSubject;
    
    // Filter by curriculum if teacher has curriculum info
    const matchesCurriculum = filterCurriculum === 'all' || 
                             teacher.curriculum === filterCurriculum ||
                             !teacher.curriculum; // Show teachers without specific curriculum
    
    return matchesSearch && matchesSubject && matchesCurriculum;
  });

  // Get products/materials for a specific teacher
  const getTeacherMaterials = (teacherName: string) => {
    return typedProducts.filter((product: any) => 
      product.authorPublisher?.toLowerCase().includes(teacherName.toLowerCase()) ||
      product.publisher?.toLowerCase().includes(teacherName.toLowerCase())
    );
  };

  // Get unique subjects from teachers
  const getUniqueSubjects = () => {
    const subjects = new Set<string>();
    typedTeachers.forEach((teacher: any) => {
      if (teacher.specialization) {
        subjects.add(teacher.specialization);
      }
    });
    return Array.from(subjects);
  };

  const getGradeText = (grade: string) => {
    const gradeMap: { [key: string]: string } = {
      'kg_1': 'KG1',
      'kg_2': 'KG2',
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
      'university': 'جامعة',
    };
    return gradeMap[grade] || grade;
  };

  const getCurriculumText = (curriculum: string) => {
    const curriculumMap: { [key: string]: string } = {
      'egyptian_arabic': 'مصري عربي',
      'egyptian_languages': 'مصري لغات', 
      'azhar': 'الأزهر',
      'igcse': 'IGCSE',
      'american': 'أمريكي',
      'ib': 'البكالوريا الدولية',
      'stem': 'STEM'
    };
    return curriculumMap[curriculum] || curriculum;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">معلمي صفك</h1>
          <p className="text-gray-600">
            {(currentUser as any)?.gradeLevel ? 
              `المعلمين المتاحين للصف ${getGradeText((currentUser as any).gradeLevel)}` : 
              'جميع المعلمين المتاحين'
            }
          </p>
        </div>

        {/* User Grade Info */}
        {currentUser && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-900">معلومات الطالب</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-blue-700">
                    <span>الصف: {getGradeText((currentUser as any)?.gradeLevel || '')}</span>
                    <span>العمر: {(currentUser as any)?.age} سنة</span>
                    <span>النقاط: {(currentUser as any)?.bountyPoints || 0}</span>
                  </div>
                </div>
                <GraduationCap className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="البحث عن معلم أو مادة..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-teachers"
                  />
                </div>
              </div>
              
              <div className="w-full md:w-48">
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="اختر المادة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المواد</SelectItem>
                    {getUniqueSubjects().map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-48">
                <Select value={filterCurriculum} onValueChange={setFilterCurriculum}>
                  <SelectTrigger>
                    <BookOpen className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="اختر المنهج" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المناهج</SelectItem>
                    <SelectItem value="egyptian_arabic">مصري عربي</SelectItem>
                    <SelectItem value="egyptian_languages">مصري لغات</SelectItem>
                    <SelectItem value="azhar">الأزهر</SelectItem>
                    <SelectItem value="igcse">IGCSE</SelectItem>
                    <SelectItem value="american">أمريكي</SelectItem>
                    <SelectItem value="ib">البكالوريا الدولية</SelectItem>
                    <SelectItem value="stem">STEM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">معلمين متاحين</p>
                  <p className="text-2xl font-bold">{filteredTeachers.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">مواد تعليمية</p>
                  <p className="text-2xl font-bold">
                    {filteredTeachers.reduce((sum, teacher) => 
                      sum + getTeacherMaterials(teacher.fullName).length, 0
                    )}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">معلمين متميزين</p>
                  <p className="text-2xl font-bold">
                    {filteredTeachers.filter(t => (t.rating || 0) >= 4.5).length}
                  </p>
                </div>
                <Award className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teachers List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachersLoading ? (
            <div className="col-span-full flex items-center justify-center py-8">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">جاري تحميل المعلمين...</p>
              </div>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">لا يوجد معلمين متاحين</p>
              <p className="text-gray-400">
                {(currentUser as any)?.gradeLevel ? 
                  `لا يوجد معلمين للصف ${getGradeText((currentUser as any).gradeLevel)}` :
                  'جرب تحديث معايير البحث'
                }
              </p>
            </div>
          ) : (
            filteredTeachers.map((teacher: any) => {
              const materials = getTeacherMaterials(teacher.fullName);
              
              return (
                <Card key={teacher.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{teacher.fullName}</CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          <School className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{teacher.school || 'غير محدد'}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {teacher.specialization || 'تخصص عام'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">{teacher.rating || 0}/5</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      {/* Teacher Info */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">سنوات الخبرة:</span>
                          <span className="font-medium">{teacher.yearsOfExperience || 0} سنة</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">عدد الطلاب:</span>
                          <span className="font-medium">{teacher.studentsCount || 0}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">المواد المتاحة:</span>
                          <span className="font-medium">{materials.length}</span>
                        </div>
                      </div>

                      {/* Grades Taught */}
                      {teacher.gradesTaught && teacher.gradesTaught.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">الصفوف التي يدرسها:</p>
                          <div className="flex flex-wrap gap-1">
                            {teacher.gradesTaught.slice(0, 3).map((grade: string) => (
                              <Badge key={grade} variant="outline" className="text-xs">
                                {getGradeText(grade)}
                              </Badge>
                            ))}
                            {teacher.gradesTaught.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{teacher.gradesTaught.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Bio */}
                      {teacher.bio && (
                        <div>
                          <p className="text-sm text-gray-600 line-clamp-2">{teacher.bio}</p>
                        </div>
                      )}

                      {/* Materials Preview */}
                      {materials.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">المواد المتاحة:</p>
                          <div className="space-y-1">
                            {materials.slice(0, 2).map((material: any) => (
                              <div key={material.id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                                <span className="font-medium">{material.name}</span>
                                <span className="text-gray-600">{material.price} جنيه</span>
                              </div>
                            ))}
                            {materials.length > 2 && (
                              <p className="text-xs text-blue-600">+{materials.length - 2} مواد أخرى</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <Button 
                        className="w-full" 
                        onClick={() => {
                          toast({
                            title: "قريباً",
                            description: "سيتم إضافة صفحة تفاصيل المعلم قريباً",
                          });
                        }}
                      >
                        <BookOpen className="w-4 h-4 ml-2" />
                        عرض المواد
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}