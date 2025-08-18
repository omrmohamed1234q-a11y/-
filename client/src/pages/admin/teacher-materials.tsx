import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { TeacherMaterial, Curriculum, insertTeacherMaterialSchema } from '@shared/schema';
import {
  BookOpen,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  GraduationCap,
  FileText,
  Globe,
  Lock
} from 'lucide-react';

const materialFormSchema = insertTeacherMaterialSchema.extend({
  file: z.any().optional()
});

interface MaterialFilters {
  subject?: string;
  grade?: string;
  curriculum?: string;
  isPublic?: boolean;
  search?: string;
}

export default function AdminTeacherMaterials() {
  const [filters, setFilters] = useState<MaterialFilters>({});
  const [selectedMaterial, setSelectedMaterial] = useState<TeacherMaterial | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: materials, isLoading } = useQuery<TeacherMaterial[]>({
    queryKey: ['/api/admin/teacher-materials', filters]
  });

  const { data: curricula } = useQuery<Curriculum[]>({
    queryKey: ['/api/admin/curriculum']
  });

  const materialForm = useForm<z.infer<typeof materialFormSchema>>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      title: '',
      description: '',
      subject: '',
      grade: '',
      fileName: '',
      fileUrl: '',
      fileType: 'pdf',
      isPublic: false
    }
  });

  // Mutations
  const uploadMaterialMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/admin/teacher-materials/upload', {
        method: 'POST',
        body: formData
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teacher-materials'] });
      setUploadDialogOpen(false);
      materialForm.reset();
      toast({ title: 'تم الرفع', description: 'تم رفع المادة التعليمية بنجاح' });
    },
    onError: () => {
      toast({
        title: 'خطأ',
        description: 'فشل في رفع المادة التعليمية',
        variant: 'destructive'
      });
    }
  });

  const updateMaterialMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TeacherMaterial> }) => {
      await apiRequest('PATCH', `/api/admin/teacher-materials/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teacher-materials'] });
      setDialogOpen(false);
      toast({ title: 'تم التحديث', description: 'تم تحديث المادة التعليمية بنجاح' });
    }
  });

  const deleteMaterialMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/teacher-materials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teacher-materials'] });
      toast({ title: 'تم الحذف', description: 'تم حذف المادة التعليمية بنجاح' });
    }
  });

  const subjects = [
    'الرياضيات',
    'اللغة العربية',
    'اللغة الإنجليزية',
    'العلوم',
    'الدراسات الاجتماعية',
    'التربية الدينية',
    'الحاسب الآلي',
    'التربية الفنية',
    'التربية الرياضية',
    'اللغة الفرنسية',
    'الفيزياء',
    'الكيمياء',
    'الأحياء',
    'التاريخ',
    'الجغرافيا',
    'الفلسفة والمنطق',
    'علم النفس والاجتماع'
  ];

  const grades = [
    'الصف الأول الابتدائي',
    'الصف الثاني الابتدائي',
    'الصف الثالث الابتدائي',
    'الصف الرابع الابتدائي',
    'الصف الخامس الابتدائي',
    'الصف السادس الابتدائي',
    'الصف الأول الإعدادي',
    'الصف الثاني الإعدادي',
    'الصف الثالث الإعدادي',
    'الصف الأول الثانوي',
    'الصف الثاني الثانوي',
    'الصف الثالث الثانوي'
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', materialForm.getValues('title'));
    formData.append('description', materialForm.getValues('description') || '');
    formData.append('subject', materialForm.getValues('subject'));
    formData.append('grade', materialForm.getValues('grade'));
    formData.append('isPublic', materialForm.getValues('isPublic').toString());

    uploadMaterialMutation.mutate(formData);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">المواد التعليمية</h1>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-upload-material">
              <Upload className="h-4 w-4 ml-2" />
              رفع مادة تعليمية
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>رفع مادة تعليمية جديدة</DialogTitle>
            </DialogHeader>
            <Form {...materialForm}>
              <form className="space-y-4">
                <FormField
                  control={materialForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>عنوان المادة</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="مثل: شرح درس الجبر" data-testid="input-material-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={materialForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الوصف</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} placeholder="وصف المادة التعليمية..." data-testid="textarea-material-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={materialForm.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المادة</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-material-subject">
                              <SelectValue placeholder="اختر المادة" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects.map((subject) => (
                              <SelectItem key={subject} value={subject}>
                                {subject}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={materialForm.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الصف</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-material-grade">
                              <SelectValue placeholder="اختر الصف" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {grades.map((grade) => (
                              <SelectItem key={grade} value={grade}>
                                {grade}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <FormField
                    control={materialForm.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value || false}
                            onChange={field.onChange}
                            data-testid="checkbox-material-public"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            متاح للجميع
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            إذا لم تختر هذا الخيار، ستكون المادة متاحة للمشتركين فقط
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file-upload">ملف المادة (PDF)</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    data-testid="input-material-file"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                    إلغاء
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            الفلاتر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>البحث</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="البحث في المواد..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pr-10"
                  data-testid="input-search-materials"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>المادة</Label>
              <Select
                value={filters.subject || ''}
                onValueChange={(value) => setFilters({ ...filters, subject: value || undefined })}
              >
                <SelectTrigger data-testid="select-filter-subject">
                  <SelectValue placeholder="جميع المواد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع المواد</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الصف</Label>
              <Select
                value={filters.grade || ''}
                onValueChange={(value) => setFilters({ ...filters, grade: value || undefined })}
              >
                <SelectTrigger data-testid="select-filter-grade">
                  <SelectValue placeholder="جميع الصفوف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع الصفوف</SelectItem>
                  {grades.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>النوع</Label>
              <Select
                value={filters.isPublic?.toString() || ''}
                onValueChange={(value) => 
                  setFilters({ 
                    ...filters, 
                    isPublic: value === '' ? undefined : value === 'true' 
                  })
                }
              >
                <SelectTrigger data-testid="select-filter-public">
                  <SelectValue placeholder="جميع الأنواع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">جميع الأنواع</SelectItem>
                  <SelectItem value="true">عام</SelectItem>
                  <SelectItem value="false">للمشتركين فقط</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Grid */}
      <div className="grid gap-4">
        {materials?.map((material) => (
          <Card key={material.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold" data-testid={`text-material-title-${material.id}`}>
                      {material.title}
                    </h3>
                    <Badge variant={material.isPublic ? 'default' : 'secondary'}>
                      {material.isPublic ? (
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          عام
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          للمشتركين
                        </div>
                      )}
                    </Badge>
                  </div>
                  {material.description && (
                    <p className="text-muted-foreground">{material.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {material.subject}
                    </span>
                    <span>{material.grade}</span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {material.fileName}
                    </span>
                    {material.fileSize && material.fileSize > 0 && (
                      <span>{formatFileSize(material.fileSize)}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      {material.downloadCount} تحميل
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(material.fileUrl, '_blank')}
                    data-testid={`button-preview-${material.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedMaterial(material);
                      materialForm.reset({
                        title: material.title,
                        description: material.description || '',
                        subject: material.subject,
                        grade: material.grade,
                        isPublic: material.isPublic
                      });
                      setDialogOpen(true);
                    }}
                    data-testid={`button-edit-${material.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm('هل أنت متأكد من حذف هذه المادة؟')) {
                        deleteMaterialMutation.mutate(material.id);
                      }
                    }}
                    data-testid={`button-delete-${material.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Material Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل المادة التعليمية</DialogTitle>
          </DialogHeader>
          <Form {...materialForm}>
            <form
              onSubmit={materialForm.handleSubmit((data) => {
                if (selectedMaterial) {
                  updateMaterialMutation.mutate({
                    id: selectedMaterial.id,
                    data: {
                      title: data.title,
                      description: data.description,
                      subject: data.subject,
                      grade: data.grade,
                      isPublic: data.isPublic
                    }
                  });
                }
              })}
              className="space-y-4"
            >
              <FormField
                control={materialForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عنوان المادة</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={materialForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ''} data-testid="textarea-edit-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={materialForm.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>المادة</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-subject">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={materialForm.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الصف</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-grade">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {grades.map((grade) => (
                            <SelectItem key={grade} value={grade}>
                              {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={materialForm.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value || false}
                        onChange={field.onChange}
                        data-testid="checkbox-edit-public"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>متاح للجميع</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" data-testid="button-save-material">
                  حفظ التغييرات
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}