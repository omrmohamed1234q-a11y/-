import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Circle, 
  Calendar,
  Shield,
  AlertTriangle,
  Users,
  Database,
  Lock
} from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { PrivacyPolicy, InsertPrivacyPolicy } from '@shared/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// Privacy Policy form validation schema
const privacyPolicyFormSchema = z.object({
  version: z.string().min(1, 'رقم الإصدار مطلوب'),
  title: z.string().min(1, 'عنوان سياسة الخصوصية مطلوب'),
  effectiveDate: z.date(),
  isActive: z.boolean(),
  dataCollection: z.string().min(1, 'محتوى جمع البيانات مطلوب'),
  dataUsage: z.string().min(1, 'محتوى استخدام البيانات مطلوب'),
  dataSharing: z.string().min(1, 'محتوى مشاركة البيانات مطلوب'),
  userRights: z.string().min(1, 'محتوى حقوق المستخدم مطلوب'),
  dataSecurity: z.string().min(1, 'محتوى الأمان والحماية مطلوب'),
  contactInfo: z.string().min(1, 'معلومات التواصل مطلوبة')
});

function PrivacyPolicyManagementContent() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PrivacyPolicy | null>(null);
  const [viewingPolicy, setViewingPolicy] = useState<PrivacyPolicy | null>(null);
  const form = useForm<InsertPrivacyPolicy>({
    resolver: zodResolver(privacyPolicyFormSchema),
    defaultValues: {
      version: '',
      title: 'سياسة الخصوصية - اطبعلي',
      effectiveDate: new Date(),
      isActive: false,
      dataCollection: '',
      dataUsage: '',
      dataSharing: '',
      userRights: '',
      dataSecurity: '',
      contactInfo: ''
    }
  });

  // Fetch all privacy policy versions
  const { data: policiesResponse, isLoading } = useQuery({
    queryKey: ['/api/admin/privacy-policies'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const privacyPolicies = policiesResponse?.data || [];

  // Create mutation
  const createPolicyMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('POST', '/api/admin/privacy-policies', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/privacy-policies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/privacy-policy/current'] });
      setDialogOpen(false);
      resetForm();
      toast({
        title: "✅ تم بنجاح",
        description: "تم إنشاء إصدار جديد من سياسة الخصوصية",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ",
        description: error.message || "فشل في إنشاء سياسة الخصوصية",
        variant: "destructive",
      });
    }
  });

  // Update mutation
  const updatePolicyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest('PUT', `/api/admin/privacy-policies/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/privacy-policies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/privacy-policy/current'] });
      setDialogOpen(false);
      resetForm();
      toast({
        title: "✅ تم بنجاح",
        description: "تم تحديث سياسة الخصوصية بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ",
        description: error.message || "فشل في تحديث سياسة الخصوصية",
        variant: "destructive",
      });
    }
  });

  // Activate mutation
  const activatePolicyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('POST', `/api/admin/privacy-policies/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/privacy-policies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/privacy-policy/current'] });
      toast({
        title: "✅ تم بنجاح",
        description: "تم تفعيل إصدار سياسة الخصوصية",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ",
        description: error.message || "فشل في تفعيل سياسة الخصوصية",
        variant: "destructive",
      });
    }
  });

  // Delete mutation
  const deletePolicyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/privacy-policies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/privacy-policies'] });
      toast({
        title: "✅ تم بنجاح",
        description: "تم حذف إصدار سياسة الخصوصية",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ",
        description: error.message || "فشل في حذف سياسة الخصوصية",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    form.reset({
      version: '',
      title: 'سياسة الخصوصية - اطبعلي',
      effectiveDate: new Date(),
      isActive: false,
      dataCollection: '',
      dataUsage: '',
      dataSharing: '',
      userRights: '',
      dataSecurity: '',
      contactInfo: ''
    });
    setEditingPolicy(null);
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    if (editingPolicy) {
      updatePolicyMutation.mutate({ id: editingPolicy.id, data });
    } else {
      createPolicyMutation.mutate(data);
    }
  });

  const handleEdit = (policy: PrivacyPolicy) => {
    setEditingPolicy(policy);
    form.reset({
      version: policy.version,
      title: policy.title,
      effectiveDate: policy.effectiveDate ? new Date(policy.effectiveDate) : new Date(),
      isActive: policy.isActive,
      dataCollection: policy.dataCollection || '',
      dataUsage: policy.dataUsage || '',
      dataSharing: policy.dataSharing || '',
      userRights: policy.userRights || '',
      dataSecurity: policy.dataSecurity || '',
      contactInfo: policy.contactInfo || ''
    });
    setDialogOpen(true);
  };

  const handleView = (policy: PrivacyPolicy) => {
    setViewingPolicy(policy);
    setViewDialogOpen(true);
  };

  const handleActivate = (id: string) => {
    activatePolicyMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا الإصدار؟')) {
      deletePolicyMutation.mutate(id);
    }
  };

  // Content sections configuration
  const contentSections = [
    { key: 'dataCollection', title: 'جمع البيانات', icon: Database },
    { key: 'dataUsage', title: 'استخدام البيانات', icon: Eye },
    { key: 'dataSharing', title: 'مشاركة البيانات', icon: Users },
    { key: 'userRights', title: 'حقوق المستخدم', icon: CheckCircle },
    { key: 'dataSecurity', title: 'الأمان والحماية', icon: Lock },
    { key: 'contactInfo', title: 'تواصل معنا', icon: Shield }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل سياسات الخصوصية...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة سياسة الخصوصية</h1>
          <p className="text-muted-foreground mt-2">
            إدارة وتحديث سياسة الخصوصية للمنصة
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} data-testid="button-create-privacy-policy">
              <Plus className="w-4 h-4 ml-2" />
              إصدار جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPolicy ? 'تعديل سياسة الخصوصية' : 'إنشاء إصدار جديد من سياسة الخصوصية'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">رقم الإصدار *</label>
                  <Input
                    {...form.register('version')}
                    placeholder="مثال: 1.0.0"
                    data-testid="input-privacy-version"
                  />
                  {form.formState.errors.version && (
                    <p className="text-sm text-red-600 mt-1">{form.formState.errors.version.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">تاريخ السريان</label>
                  <Input
                    type="date"
                    {...form.register('effectiveDate', { valueAsDate: true })}
                    data-testid="input-privacy-effective-date"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">عنوان سياسة الخصوصية *</label>
                <Input
                  {...form.register('title')}
                  placeholder="عنوان سياسة الخصوصية"
                  data-testid="input-privacy-title"
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
                )}
              </div>

              {/* Content Sections */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">أقسام سياسة الخصوصية</h3>
                
                {contentSections.map(({ key, title, icon: IconComponent }) => (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <IconComponent className="w-5 h-5" />
                        {title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">محتوى {title}</label>
                        <Textarea
                          {...form.register(key as keyof InsertPrivacyPolicy)}
                          placeholder={`اكتب محتوى ${title}...`}
                          rows={6}
                          className="min-h-[120px]"
                        />
                        {form.formState.errors[key as keyof InsertPrivacyPolicy] && (
                          <p className="text-sm text-red-600 mt-1">
                            {form.formState.errors[key as keyof InsertPrivacyPolicy]?.message}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancel-privacy"
                >
                  إلغاء
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createPolicyMutation.isPending || updatePolicyMutation.isPending}
                  data-testid="button-save-privacy"
                >
                  {createPolicyMutation.isPending || updatePolicyMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإصدارات</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-privacy-versions">
              {privacyPolicies?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الإصدار النشط</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-privacy-version">
              {privacyPolicies?.find((p: any) => p.isActive)?.version || 'لا يوجد'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المسودات</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-privacy-draft-count">
              {privacyPolicies?.filter((p: any) => !p.isActive)?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policies List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">جميع إصدارات سياسة الخصوصية</h2>
        
        {privacyPolicies?.map((policy: any) => (
          <Card key={policy.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium">{policy.title}</h3>
                    {policy.isActive ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        نشط
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Circle className="w-3 h-3 mr-1" />
                        مسودة
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>الإصدار: {policy.version}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {policy.effectiveDate ? new Date(policy.effectiveDate).toLocaleDateString('ar-EG') : 'غير محدد'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      بواسطة: {policy.createdBy || 'النظام'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(policy)}
                    data-testid={`button-view-privacy-${policy.id}`}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(policy)}
                    data-testid={`button-edit-privacy-${policy.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {!policy.isActive && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleActivate(policy.id)}
                      disabled={activatePolicyMutation.isPending}
                      data-testid={`button-activate-privacy-${policy.id}`}
                    >
                      تفعيل
                    </Button>
                  )}
                  {!policy.isActive && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(policy.id)}
                      disabled={deletePolicyMutation.isPending}
                      data-testid={`button-delete-privacy-${policy.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!privacyPolicies?.length && (
          <Card>
            <CardContent className="p-12 text-center">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد سياسات خصوصية</h3>
              <p className="text-muted-foreground mb-4">
                ابدأ بإنشاء أول إصدار من سياسة الخصوصية
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 ml-2" />
                إنشاء سياسة جديدة
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>عرض سياسة الخصوصية - الإصدار {viewingPolicy?.version}</DialogTitle>
          </DialogHeader>
          
          {viewingPolicy && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">الإصدار:</span> {viewingPolicy.version}
                  </div>
                  <div>
                    <span className="font-medium">الحالة:</span> 
                    <Badge className={`mr-2 ${viewingPolicy.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {viewingPolicy.isActive ? 'نشط' : 'مسودة'}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">تاريخ السريان:</span> 
                    {viewingPolicy.effectiveDate ? new Date(viewingPolicy.effectiveDate).toLocaleDateString('ar-EG') : 'غير محدد'}
                  </div>
                  <div>
                    <span className="font-medium">تاريخ الإنشاء:</span> 
                    {new Date(viewingPolicy.createdAt).toLocaleDateString('ar-EG')}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">{viewingPolicy.title}</h3>
              </div>
              
              {/* Content Sections */}
              <div className="space-y-6">
                {contentSections.map(({ key, title, icon: IconComponent }) => {
                  const content = viewingPolicy[key as keyof typeof viewingPolicy] as string;
                  
                  if (!content) return null;
                  
                  return (
                    <Card key={key}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <IconComponent className="w-5 h-5" />
                          {title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {content}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PrivacyPolicyManagement() {
  return <PrivacyPolicyManagementContent />;
}