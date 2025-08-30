import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  FileText, Plus, Send, MessageSquare, Users, Eye, 
  Calendar, Clock, CheckCircle, XCircle 
} from 'lucide-react';

interface Inquiry {
  id: string;
  title: string;
  message: string;
  targetType: 'all_customers' | 'new_customers' | 'existing_customers' | 'grade_level' | 'specific_customers';
  targetGradeLevel?: string;
  targetUserIds?: string[];
  status: 'draft' | 'sent' | 'completed';
  responseCount: number;
  totalRecipients: number;
  createdAt: string;
  sentAt?: string;
}

export default function AdminInquiries() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetType: 'all_customers',
    targetGradeLevel: '',
    targetUserIds: []
  });

  // Fetch inquiries
  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['/api/admin/inquiries'],
  });

  // Fetch users for targeting
  const { data: users = [] } = useQuery({
    queryKey: ['/api/admin/users'],
  });

  // Create inquiry mutation
  const createInquiryMutation = useMutation({
    mutationFn: (inquiryData: any) => apiRequest('POST', '/api/admin/inquiries', inquiryData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inquiries'] });
      toast({ title: "تم إنشاء الاستعلام بنجاح" });
      setShowCreateDialog(false);
      setFormData({
        title: '',
        message: '',
        targetType: 'all_customers',
        targetGradeLevel: '',
        targetUserIds: []
      });
    },
    onError: () => {
      toast({ title: "خطأ في إنشاء الاستعلام", variant: "destructive" });
    }
  });

  // Send inquiry mutation
  const sendInquiryMutation = useMutation({
    mutationFn: (inquiryId: string) => apiRequest('POST', `/api/admin/inquiries/${inquiryId}/send`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/inquiries'] });
      toast({ title: "تم إرسال الاستعلام بنجاح" });
    },
    onError: () => {
      toast({ title: "خطأ في إرسال الاستعلام", variant: "destructive" });
    }
  });

  const handleCreateInquiry = () => {
    if (!formData.title || !formData.message) {
      toast({ title: "يرجى ملء جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }

    createInquiryMutation.mutate(formData);
  };

  const handleSendInquiry = (inquiryId: string) => {
    sendInquiryMutation.mutate(inquiryId);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', text: 'مسودة' },
      sent: { color: 'bg-blue-100 text-blue-800', text: 'مُرسل' },
      completed: { color: 'bg-green-100 text-green-800', text: 'مكتمل' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const getTargetTypeLabel = (targetType: string) => {
    const labels = {
      all_customers: 'جميع العملاء',
      new_customers: 'العملاء الجدد',
      existing_customers: 'العملاء الحاليين',
      grade_level: 'مستوى دراسي محدد',
      specific_customers: 'عملاء محددين'
    };
    return labels[targetType as keyof typeof labels] || targetType;
  };

  if (isLoading) {
    return (
      <div className="p-8" dir="rtl">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">إدارة الاستعلامات</h1>
          <p className="text-gray-600 mt-2">إنشاء وإدارة استعلامات العملاء وعروض الأسعار</p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-create-inquiry">
              <Plus className="w-4 h-4 mr-2" />
              إنشاء استعلام جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>إنشاء استعلام جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">عنوان الاستعلام</Label>
                <Input
                  id="title"
                  placeholder="مثل: عرض خاص على الكتب المدرسية"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  data-testid="input-inquiry-title"
                />
              </div>
              
              <div>
                <Label htmlFor="message">محتوى الاستعلام</Label>
                <Textarea
                  id="message"
                  placeholder="اكتب رسالة الاستعلام هنا..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  data-testid="textarea-inquiry-message"
                />
              </div>
              
              <div>
                <Label htmlFor="targetType">استهداف العملاء</Label>
                <Select 
                  value={formData.targetType} 
                  onValueChange={(value) => setFormData({ ...formData, targetType: value })}
                >
                  <SelectTrigger data-testid="select-target-type">
                    <SelectValue placeholder="اختر نوع الاستهداف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_customers">جميع العملاء</SelectItem>
                    <SelectItem value="new_customers">العملاء الجدد</SelectItem>
                    <SelectItem value="existing_customers">العملاء الحاليين</SelectItem>
                    <SelectItem value="grade_level">مستوى دراسي محدد</SelectItem>
                    <SelectItem value="specific_customers">عملاء محددين</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.targetType === 'grade_level' && (
                <div>
                  <Label htmlFor="gradeLevel">المستوى الدراسي</Label>
                  <Select 
                    value={formData.targetGradeLevel} 
                    onValueChange={(value) => setFormData({ ...formData, targetGradeLevel: value })}
                  >
                    <SelectTrigger data-testid="select-grade-level">
                      <SelectValue placeholder="اختر المستوى الدراسي" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg1">روضة أولى</SelectItem>
                      <SelectItem value="kg2">روضة ثانية</SelectItem>
                      <SelectItem value="grade1">الصف الأول الابتدائي</SelectItem>
                      <SelectItem value="grade2">الصف الثاني الابتدائي</SelectItem>
                      <SelectItem value="grade3">الصف الثالث الابتدائي</SelectItem>
                      <SelectItem value="grade4">الصف الرابع الابتدائي</SelectItem>
                      <SelectItem value="grade5">الصف الخامس الابتدائي</SelectItem>
                      <SelectItem value="grade6">الصف السادس الابتدائي</SelectItem>
                      <SelectItem value="grade7">الصف الأول الإعدادي</SelectItem>
                      <SelectItem value="grade8">الصف الثاني الإعدادي</SelectItem>
                      <SelectItem value="grade9">الصف الثالث الإعدادي</SelectItem>
                      <SelectItem value="grade10">الصف الأول الثانوي</SelectItem>
                      <SelectItem value="grade11">الصف الثاني الثانوي</SelectItem>
                      <SelectItem value="grade12">الصف الثالث الثانوي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.targetType === 'specific_customers' && (
                <div>
                  <Label>العملاء المحددين</Label>
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                    {users.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">جاري تحميل قائمة العملاء...</p>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium">اختر العملاء المستهدفين:</span>
                          <div className="text-xs text-gray-500">
                            {formData.targetUserIds.length} من {users.length} محدد
                          </div>
                        </div>
                        {users.map((user: any) => (
                          <div key={user.id} className="flex items-center space-x-2 space-x-reverse">
                            <input
                              type="checkbox"
                              id={`user-${user.id}`}
                              checked={formData.targetUserIds.includes(user.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    targetUserIds: [...formData.targetUserIds, user.id]
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    targetUserIds: formData.targetUserIds.filter(id => id !== user.id)
                                  });
                                }
                              }}
                              className="rounded"
                              data-testid={`checkbox-user-${user.id}`}
                            />
                            <label 
                              htmlFor={`user-${user.id}`} 
                              className="text-sm cursor-pointer flex-1"
                            >
                              {user.fullName || user.firstName || user.email || 'مستخدم بدون اسم'}
                              <span className="text-gray-400 text-xs mr-2">
                                ({user.email})
                              </span>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                  data-testid="button-cancel-inquiry"
                >
                  إلغاء
                </Button>
                <Button 
                  onClick={handleCreateInquiry}
                  disabled={createInquiryMutation.isPending}
                  data-testid="button-save-inquiry"
                >
                  {createInquiryMutation.isPending ? 'جاري الحفظ...' : 'حفظ الاستعلام'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الاستعلامات</p>
                <p className="text-2xl font-bold text-gray-900">{inquiries.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">استعلامات مُرسلة</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inquiries.filter((i: Inquiry) => i.status === 'sent').length}
                </p>
              </div>
              <Send className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">إجمالي الردود</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inquiries.reduce((sum: number, i: Inquiry) => sum + i.responseCount, 0)}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">العملاء المستهدفون</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inquiries.reduce((sum: number, i: Inquiry) => sum + i.totalRecipients, 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inquiries List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            قائمة الاستعلامات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inquiries.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد استعلامات حالياً</p>
              <p className="text-sm text-gray-400 mt-2">قم بإنشاء أول استعلام لك</p>
            </div>
          ) : (
            <div className="space-y-4">
              {inquiries.map((inquiry: Inquiry) => (
                <div 
                  key={inquiry.id} 
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  data-testid={`inquiry-card-${inquiry.id}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{inquiry.title}</h3>
                      <p className="text-gray-600 mt-1 line-clamp-2">{inquiry.message}</p>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {getStatusBadge(inquiry.status)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {getTargetTypeLabel(inquiry.targetType)}
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        {inquiry.responseCount} رد
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(inquiry.createdAt).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {inquiry.status === 'draft' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleSendInquiry(inquiry.id)}
                          disabled={sendInquiryMutation.isPending}
                          data-testid={`button-send-${inquiry.id}`}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          إرسال
                        </Button>
                      )}
                      <Button variant="outline" size="sm" data-testid={`button-view-${inquiry.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        عرض التفاصيل
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}