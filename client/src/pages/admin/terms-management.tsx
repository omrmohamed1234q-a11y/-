import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AdminLayout from './layout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle, 
  Circle, 
  Calendar,
  FileText,
  AlertTriangle,
  Users
} from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import type { TermsAndConditions } from '../../../shared/schema';

function TermsManagementContent() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingTerms, setEditingTerms] = useState<TermsAndConditions | null>(null);
  const [viewingTerms, setViewingTerms] = useState<TermsAndConditions | null>(null);
  const [formData, setFormData] = useState({
    version: '',
    title: '',
    content: '',
    summary: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    isActive: false
  });

  // Fetch all terms versions
  const { data: termsVersions, isLoading } = useQuery<TermsAndConditions[]>({
    queryKey: ['/api/admin/terms'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create mutation
  const createTermsMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest('POST', '/api/admin/terms', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/terms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/terms/current'] });
      setDialogOpen(false);
      resetForm();
      toast({
        title: "✅ تم بنجاح",
        description: "تم إنشاء إصدار جديد من الشروط والأحكام",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ",
        description: error.message || "فشل في إنشاء الشروط والأحكام",
        variant: "destructive",
      });
    }
  });

  // Update mutation
  const updateTermsMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest('PUT', `/api/admin/terms/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/terms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/terms/current'] });
      setDialogOpen(false);
      resetForm();
      toast({
        title: "✅ تم بنجاح",
        description: "تم تحديث الشروط والأحكام",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ",
        description: error.message || "فشل في تحديث الشروط والأحكام",
        variant: "destructive",
      });
    }
  });

  // Activate mutation
  const activateTermsMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('POST', `/api/admin/terms/${id}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/terms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/terms/current'] });
      toast({
        title: "✅ تم التفعيل",
        description: "تم تفعيل إصدار الشروط والأحكام",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ",
        description: error.message || "فشل في تفعيل الشروط والأحكام",
        variant: "destructive",
      });
    }
  });

  // Delete mutation
  const deleteTermsMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/terms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/terms'] });
      queryClient.invalidateQueries({ queryKey: ['/api/terms/current'] });
      toast({
        title: "✅ تم الحذف",
        description: "تم حذف إصدار الشروط والأحكام",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ خطأ",
        description: error.message || "فشل في حذف الشروط والأحكام",
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
    setEditingTerms(null);
  };

  const handleEdit = (terms: TermsAndConditions) => {
    setEditingTerms(terms);
    setFormData({
      version: terms.version,
      title: terms.title,
      content: terms.content || '',
      summary: terms.summary || '',
      effectiveDate: terms.effectiveDate ? new Date(terms.effectiveDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      isActive: terms.isActive
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.version || !formData.title || !formData.content) {
      toast({
        title: "❌ خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    const data = {
      ...formData,
      effectiveDate: formData.effectiveDate + 'T00:00:00.000Z'
    };

    if (editingTerms) {
      updateTermsMutation.mutate({ id: editingTerms.id, data });
    } else {
      createTermsMutation.mutate(data);
    }
  };

  const handleView = (terms: TermsAndConditions) => {
    setViewingTerms(terms);
    setViewDialogOpen(true);
  };

  const handleActivate = (id: string) => {
    if (confirm('هل أنت متأكد من تفعيل هذا الإصدار؟ سيتم إلغاء تفعيل الإصدارات الأخرى.')) {
      activateTermsMutation.mutate(id);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الإصدار؟ لا يمكن التراجع عن هذا الإجراء.')) {
      deleteTermsMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">جاري تحميل إدارة الشروط والأحكام...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">إدارة الشروط والأحكام</h1>
          <p className="text-muted-foreground">
            إدارة إصدارات الشروط والأحكام وتفعيلها
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="w-4 h-4" />
              إصدار جديد
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإصدارات</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{termsVersions?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الإصدار النشط</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {termsVersions?.find(t => t.isActive)?.version || 'لا يوجد'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إصدارات مسودة</CardTitle>
            <Circle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {termsVersions?.filter(t => !t.isActive).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Terms Versions List */}
      <div className="space-y-4">
        {termsVersions?.map((terms) => (
          <Card key={terms.id} className={`${terms.isActive ? 'border-green-200 bg-green-50/50' : ''}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{terms.title}</h3>
                    {terms.isActive ? (
                      <Badge variant="default" className="bg-green-600">
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
                    <span>الإصدار: {terms.version}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(terms.effectiveDate).toLocaleDateString('ar-EG')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      بواسطة: {terms.createdBy}
                    </span>
                  </div>
                  {terms.summary && (
                    <p className="text-sm text-muted-foreground">{terms.summary}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(terms)}
                    data-testid={`button-view-terms-${terms.id}`}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(terms)}
                    data-testid={`button-edit-terms-${terms.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {!terms.isActive && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleActivate(terms.id)}
                      disabled={activateTermsMutation.isPending}
                      data-testid={`button-activate-terms-${terms.id}`}
                    >
                      تفعيل
                    </Button>
                  )}
                  {!terms.isActive && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(terms.id)}
                      disabled={deleteTermsMutation.isPending}
                      data-testid={`button-delete-terms-${terms.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!termsVersions?.length && (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد إصدارات</h3>
              <p className="text-muted-foreground mb-4">لم يتم إنشاء أي إصدارات من الشروط والأحكام بعد</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                إنشاء الإصدار الأول
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTerms ? 'تحديث الشروط والأحكام' : 'إنشاء إصدار جديد'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="version">رقم الإصدار *</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="مثال: 1.0, 2.1"
                  data-testid="input-version"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="effectiveDate">تاريخ السريان</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                  data-testid="input-effective-date"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">العنوان *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="عنوان الشروط والأحكام"
                data-testid="input-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">الملخص</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="ملخص مختصر للشروط والأحكام"
                rows={2}
                data-testid="textarea-summary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">المحتوى * (HTML مدعوم)</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="محتوى الشروط والأحكام كاملاً... يمكن استخدام HTML للتنسيق"
                rows={15}
                className="font-mono"
                data-testid="textarea-content"
              />
              <p className="text-xs text-muted-foreground">
                يمكنك استخدام تنسيق HTML مثل: &lt;h3&gt;، &lt;p&gt;، &lt;ul&gt;، &lt;li&gt;، &lt;strong&gt; إلخ
              </p>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex gap-2">
                <Button onClick={handleSubmit} 
                        disabled={createTermsMutation.isPending || updateTermsMutation.isPending}
                        data-testid="button-submit">
                  {editingTerms ? 'تحديث' : 'إنشاء'}
                </Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>معاينة الشروط والأحكام</DialogTitle>
          </DialogHeader>

          {viewingTerms && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>الإصدار:</strong> {viewingTerms.version}</div>
                <div><strong>تاريخ السريان:</strong> {new Date(viewingTerms.effectiveDate).toLocaleDateString('ar-EG')}</div>
                <div><strong>الحالة:</strong> {viewingTerms.isActive ? 'نشط' : 'مسودة'}</div>
                <div><strong>منشئ بواسطة:</strong> {viewingTerms.createdBy}</div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-2">{viewingTerms.title}</h3>
                {viewingTerms.summary && (
                  <p className="text-muted-foreground mb-4">{viewingTerms.summary}</p>
                )}
                <div 
                  className="prose dark:prose-invert max-w-none"
                  style={{ direction: 'rtl' }}
                  dangerouslySetInnerHTML={{ __html: viewingTerms.content || '' }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TermsManagement() {
  return (
    <AdminLayout>
      <TermsManagementContent />
    </AdminLayout>
  );
}