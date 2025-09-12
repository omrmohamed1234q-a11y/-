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
  FileText,
  AlertTriangle,
  Users
} from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { UsagePolicies } from '@shared/schema';

function UsagePoliciesManagementContent() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<UsagePolicies | null>(null);
  const [viewingPolicy, setViewingPolicy] = useState<UsagePolicies | null>(null);
  const [formData, setFormData] = useState({
    version: '',
    title: '',
    content: '',
    summary: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    isActive: false
  });

  // Fetch all usage policy versions with proper response handling
  const { data: policiesResponse, isLoading } = useQuery({
    queryKey: ['/api/admin/usage-policies'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Extract data from API response to avoid "find is not a function" error
  const usagePolicies = policiesResponse?.data || [];

  // Create mutation
  const createPolicyMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('POST', '/api/admin/usage-policies', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/usage-policies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/policies/usage/current'] });
      setDialogOpen(false);
      resetForm();
      toast({
        title: "✅ تم بنجاح",
        description: "تم إنشاء إصدار جديد من سياسات الاستخدام",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ",
        description: error.message || "فشل في إنشاء سياسة الاستخدام",
        variant: "destructive",
      });
    }
  });

  // Update mutation
  const updatePolicyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest('PUT', `/api/admin/usage-policies/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/usage-policies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/policies/usage/current'] });
      setDialogOpen(false);
      resetForm();
      toast({
        title: "✅ تم بنجاح",
        description: "تم تحديث سياسة الاستخدام بنجاح",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ",
        description: error.message || "فشل في تحديث سياسة الاستخدام",
        variant: "destructive",
      });
    }
  });

  // Activate mutation
  const activatePolicyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('POST', `/api/admin/usage-policies/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/usage-policies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/policies/usage/current'] });
      toast({
        title: "✅ تم بنجاح",
        description: "تم تفعيل إصدار سياسة الاستخدام",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ",
        description: error.message || "فشل في تفعيل سياسة الاستخدام",
        variant: "destructive",
      });
    }
  });

  // Delete mutation
  const deletePolicyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/usage-policies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/usage-policies'] });
      toast({
        title: "✅ تم بنجاح",
        description: "تم حذف إصدار سياسة الاستخدام",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ",
        description: error.message || "فشل في حذف سياسة الاستخدام",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      version: '',
      title: '',
      content: '',
      summary: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      isActive: false
    });
    setEditingPolicy(null);
  };

  const handleSubmit = async () => {
    if (!formData.version || !formData.title || !formData.content) {
      toast({
        title: "❌ خطأ",
        description: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    if (editingPolicy) {
      updatePolicyMutation.mutate({ id: editingPolicy.id, data: formData });
    } else {
      createPolicyMutation.mutate(formData);
    }
  };

  const handleEdit = (policy: UsagePolicies) => {
    setEditingPolicy(policy);
    setFormData({
      version: policy.version,
      title: policy.title,
      content: policy.content,
      summary: policy.summary || '',
      effectiveDate: policy.effectiveDate 
        ? new Date(policy.effectiveDate).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0],
      isActive: policy.isActive
    });
    setDialogOpen(true);
  };

  const handleView = (policy: UsagePolicies) => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل سياسات الاستخدام...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">إدارة سياسات الاستخدام</h1>
          <p className="text-muted-foreground mt-2">
            إدارة وتحديث سياسات الاستخدام للمنصة
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} data-testid="button-create-policy">
              <Plus className="w-4 h-4 ml-2" />
              إصدار جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPolicy ? 'تعديل سياسة الاستخدام' : 'إنشاء إصدار جديد من سياسات الاستخدام'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">رقم الإصدار</label>
                  <Input
                    value={formData.version}
                    onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="مثال: 1.0.0"
                    data-testid="input-policy-version"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">تاريخ السريان</label>
                  <Input
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                    data-testid="input-policy-effective-date"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">عنوان السياسة</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="عنوان سياسة الاستخدام"
                  data-testid="input-policy-title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">ملخص التغييرات (اختياري)</label>
                <Input
                  value={formData.summary}
                  onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="ملخص مختصر عن التغييرات في هذا الإصدار"
                  data-testid="input-policy-summary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">محتوى السياسة</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="اكتب محتوى سياسة الاستخدام هنا..."
                  className="min-h-[300px]"
                  data-testid="textarea-policy-content"
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancel-policy"
                >
                  إلغاء
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createPolicyMutation.isPending || updatePolicyMutation.isPending}
                  data-testid="button-save-policy"
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
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-versions">
              {usagePolicies?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الإصدار النشط</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-active-version">
              {usagePolicies?.find(p => p.isActive)?.version || 'لا يوجد'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المسودات</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-draft-count">
              {usagePolicies?.filter(p => !p.isActive)?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Policies List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">جميع إصدارات سياسات الاستخدام</h2>
        
        {usagePolicies?.map((policy) => (
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
                      بواسطة: {policy.createdBy}
                    </span>
                  </div>
                  {policy.summary && (
                    <p className="text-sm text-muted-foreground">{policy.summary}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(policy)}
                    data-testid={`button-view-policy-${policy.id}`}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(policy)}
                    data-testid={`button-edit-policy-${policy.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {!policy.isActive && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleActivate(policy.id)}
                      disabled={activatePolicyMutation.isPending}
                      data-testid={`button-activate-policy-${policy.id}`}
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
                      data-testid={`button-delete-policy-${policy.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!usagePolicies?.length && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">لا توجد سياسات استخدام</h3>
              <p className="text-muted-foreground mb-4">
                ابدأ بإنشاء أول إصدار من سياسات الاستخدام
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>عرض سياسة الاستخدام - الإصدار {viewingPolicy?.version}</DialogTitle>
          </DialogHeader>
          
          {viewingPolicy && (
            <div className="space-y-4">
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
                <h3 className="text-lg font-medium mb-2">{viewingPolicy.title}</h3>
                {viewingPolicy.summary && (
                  <p className="text-muted-foreground mb-4">{viewingPolicy.summary}</p>
                )}
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-medium mb-3">محتوى السياسة:</h4>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {viewingPolicy.content}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function UsagePoliciesManagement() {
  return <UsagePoliciesManagementContent />;
}