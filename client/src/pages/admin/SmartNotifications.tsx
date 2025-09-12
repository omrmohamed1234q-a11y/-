// ============================================================================
// Smart Notifications Admin Panel - لوحة إدارة التنبيهات الذكية
// ============================================================================

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Brain, 
  Send, 
  Target, 
  BarChart3, 
  Users, 
  Mail, 
  Settings,
  TrendingUp,
  Eye,
  MousePointer,
  ShoppingCart,
  Star,
  Clock,
  Globe,
  MessageSquare,
  Zap
} from 'lucide-react';

// ============================================================================
// Smart Campaign Creator - منشئ الحملات الذكية
// ============================================================================

interface SmartTargetingCriteria {
  demographic?: {
    ageRange?: [number, number];
    gradeLevel?: string[];
    location?: string[];
    gender?: string;
  };
  behavioral?: {
    totalOrders?: { min?: number; max?: number };
    totalSpent?: { min?: number; max?: number };
    lastOrderDays?: number;
    engagementScore?: { min?: number; max?: number };
  };
  engagement?: {
    emailOpenRate?: { min?: number; max?: number };
    clickThroughRate?: { min?: number; max?: number };
    preferredChannel?: string[];
    optedOutChannels?: string[];
  };
  temporal?: {
    bestTimeToSend?: string[];
    timezone?: string;
    dayOfWeek?: number[];
  };
}

function SmartCampaignCreator() {
  const { toast } = useToast();
  const [campaignName, setCampaignName] = useState('');
  const [targetingCriteria, setTargetingCriteria] = useState<SmartTargetingCriteria>({});
  const [customTemplate, setCustomTemplate] = useState({
    subject: 'عرض خاص من منصة اطبعلي! 🎉',
    html: `
<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>مرحباً {{name}}! 👋</h2>
  <p>لديك عرض خاص ينتظرك في منصة اطبعلي للطباعة والخدمات التعليمية.</p>
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3>🎯 عرض مخصص لك:</h3>
    <ul>
      <li>خصم 25% على جميع خدمات الطباعة</li>
      <li>توصيل مجاني للطلبات أكثر من 100 جنيه</li>
      <li>نقاط مكافآت إضافية: {{points}} نقطة</li>
    </ul>
  </div>
</div>
    `.trim()
  });

  const createCampaign = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/smart-notifications/campaigns', data);
    },
    onSuccess: (data) => {
      toast({
        title: '✅ نجح إنشاء الحملة',
        description: `تم إرسال الحملة إلى ${data.campaign?.sent || 0} مستخدم بنجاح`,
      });
      setCampaignName('');
      setTargetingCriteria({});
    },
    onError: (error) => {
      toast({
        title: '❌ خطأ في إنشاء الحملة',
        description: 'فشل في إنشاء الحملة الذكية',
        variant: 'destructive',
      });
    }
  });

  const handleCreateCampaign = () => {
    if (!campaignName.trim()) {
      toast({
        title: '⚠️ اسم الحملة مطلوب',
        description: 'يرجى إدخال اسم للحملة',
        variant: 'destructive',
      });
      return;
    }

    createCampaign.mutate({
      name: campaignName,
      targetingCriteria,
      template: customTemplate
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          إنشاء حملة ذكية جديدة
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="campaignName">اسم الحملة</Label>
          <Input
            id="campaignName"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="مثل: حملة العودة للمدارس 2025"
            data-testid="input-campaign-name"
          />
        </div>

        <Tabs defaultValue="targeting" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="targeting">
              <Target className="w-4 h-4 mr-2" />
              الاستهداف
            </TabsTrigger>
            <TabsTrigger value="template">
              <Mail className="w-4 h-4 mr-2" />
              القالب
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-2" />
              معاينة
            </TabsTrigger>
          </TabsList>

          <TabsContent value="targeting" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>المرحلة الدراسية</Label>
                <Select
                  onValueChange={(value) => {
                    setTargetingCriteria(prev => ({
                      ...prev,
                      demographic: {
                        ...prev.demographic,
                        gradeLevel: value === 'all' ? undefined : [value]
                      }
                    }));
                  }}
                  data-testid="select-grade-level"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المرحلة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المراحل</SelectItem>
                    <SelectItem value="الصف الأول">الصف الأول</SelectItem>
                    <SelectItem value="الصف الثاني">الصف الثاني</SelectItem>
                    <SelectItem value="الصف الثالث">الصف الثالث</SelectItem>
                    <SelectItem value="الصف الرابع">الصف الرابع</SelectItem>
                    <SelectItem value="الصف الخامس">الصف الخامس</SelectItem>
                    <SelectItem value="الصف السادس">الصف السادس</SelectItem>
                    <SelectItem value="الصف السابع">الصف السابع</SelectItem>
                    <SelectItem value="الصف الثامن">الصف الثامن</SelectItem>
                    <SelectItem value="الصف التاسع">الصف التاسع</SelectItem>
                    <SelectItem value="الصف العاشر">الصف العاشر</SelectItem>
                    <SelectItem value="الصف الحادي عشر">الصف الحادي عشر</SelectItem>
                    <SelectItem value="الصف الثاني عشر">الصف الثاني عشر</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>عدد الطلبات السابقة</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="من"
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || undefined;
                      setTargetingCriteria(prev => ({
                        ...prev,
                        behavioral: {
                          ...prev.behavioral,
                          totalOrders: {
                            ...prev.behavioral?.totalOrders,
                            min: value
                          }
                        }
                      }));
                    }}
                    data-testid="input-min-orders"
                  />
                  <Input
                    type="number"
                    placeholder="إلى"
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || undefined;
                      setTargetingCriteria(prev => ({
                        ...prev,
                        behavioral: {
                          ...prev.behavioral,
                          totalOrders: {
                            ...prev.behavioral?.totalOrders,
                            max: value
                          }
                        }
                      }));
                    }}
                    data-testid="input-max-orders"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">معاينة الاستهداف:</h4>
              <div className="flex flex-wrap gap-2">
                {targetingCriteria.demographic?.gradeLevel && (
                  <Badge variant="outline">
                    المرحلة: {targetingCriteria.demographic.gradeLevel.join(', ')}
                  </Badge>
                )}
                {targetingCriteria.behavioral?.totalOrders && (
                  <Badge variant="outline">
                    الطلبات: {targetingCriteria.behavioral.totalOrders.min || 0} - {targetingCriteria.behavioral.totalOrders.max || '∞'}
                  </Badge>
                )}
                {!targetingCriteria.demographic?.gradeLevel && !targetingCriteria.behavioral?.totalOrders && (
                  <Badge variant="secondary">جميع المستخدمين</Badge>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="template" className="space-y-4">
            <div>
              <Label htmlFor="emailSubject">موضوع الإيميل</Label>
              <Input
                id="emailSubject"
                value={customTemplate.subject}
                onChange={(e) => setCustomTemplate(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="عنوان جذاب للإيميل"
                data-testid="input-email-subject"
              />
            </div>
            <div>
              <Label htmlFor="emailBody">محتوى الإيميل (HTML)</Label>
              <Textarea
                id="emailBody"
                value={customTemplate.html}
                onChange={(e) => setCustomTemplate(prev => ({ ...prev, html: e.target.value }))}
                rows={10}
                className="font-mono text-sm"
                placeholder="محتوى الإيميل بصيغة HTML..."
                data-testid="textarea-email-body"
              />
              <p className="text-sm text-muted-foreground mt-2">
                يمكنك استخدام المتغيرات: {`{{name}}, {{grade}}, {{points}}`}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">معاينة الإيميل:</h4>
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="font-semibold text-lg">{customTemplate.subject}</p>
                <div 
                  className="mt-2 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: customTemplate.html.replace(/{{name}}/g, 'أحمد محمد')
                                                 .replace(/{{grade}}/g, 'الصف العاشر')
                                                 .replace(/{{points}}/g, '150')
                  }}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Button 
          onClick={handleCreateCampaign}
          disabled={createCampaign.isPending || !campaignName.trim()}
          className="w-full"
          data-testid="button-create-campaign"
        >
          {createCampaign.isPending ? (
            <>
              <Zap className="w-4 h-4 mr-2 animate-spin" />
              جاري إنشاء الحملة...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              إنشاء وإرسال الحملة الذكية
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Campaign Analytics Dashboard - لوحة إحصائيات الحملات
// ============================================================================

function AnalyticsDashboard() {
  const [selectedCampaign, setSelectedCampaign] = useState('');

  // Mock analytics data - في التطبيق الحقيقي، سيتم جلبها من API
  const analytics = {
    totalSent: 1250,
    deliveryRate: 98.5,
    openRate: 45.2,
    clickRate: 12.8,
    conversionRate: 3.4,
    engagementScore: 78.5,
    bestPerformingSegment: 'students_grade_10_12'
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            إحصائيات الحملات الذكية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Send className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{analytics.totalSent.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">إجمالي المرسل</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Eye className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{analytics.openRate}%</p>
              <p className="text-sm text-muted-foreground">معدل الفتح</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <MousePointer className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">{analytics.clickRate}%</p>
              <p className="text-sm text-muted-foreground">معدل النقر</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <ShoppingCart className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-2xl font-bold">{analytics.conversionRate}%</p>
              <p className="text-sm text-muted-foreground">معدل التحويل</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <h4 className="font-semibold">نقاط التفاعل الذكي</h4>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${analytics.engagementScore}%` }}
                  />
                </div>
              </div>
              <span className="text-2xl font-bold text-orange-600">{analytics.engagementScore}%</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              الأداء الأفضل: {analytics.bestPerformingSegment}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// Testing & Quick Actions - الاختبار والإجراءات السريعة
// ============================================================================

function QuickActions() {
  const { toast } = useToast();

  const testNotification = useMutation({
    mutationFn: async (type: string) => {
      return await apiRequest('POST', '/api/smart-notifications/test', {
        type,
        email: 'test@example.com'
      });
    },
    onSuccess: (data, type) => {
      toast({
        title: '✅ تم إرسال الاختبار',
        description: `تم إرسال اختبار ${type === 'welcome' ? 'الترحيب' : type === 'order' ? 'الطلب' : 'الحملة'} بنجاح`,
      });
    },
    onError: (error, type) => {
      toast({
        title: '❌ فشل الاختبار',
        description: `فشل في إرسال اختبار ${type === 'welcome' ? 'الترحيب' : type === 'order' ? 'الطلب' : 'الحملة'}`,
        variant: 'destructive',
      });
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          اختبار النظام الذكي
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={() => testNotification.mutate('welcome')}
            disabled={testNotification.isPending}
            data-testid="button-test-welcome"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            اختبار رسالة الترحيب
          </Button>
          <Button
            variant="outline"
            onClick={() => testNotification.mutate('order')}
            disabled={testNotification.isPending}
            data-testid="button-test-order"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            اختبار إشعار الطلب
          </Button>
          <Button
            variant="outline"
            onClick={() => testNotification.mutate('campaign')}
            disabled={testNotification.isPending}
            data-testid="button-test-campaign"
          >
            <Target className="w-4 h-4 mr-2" />
            اختبار حملة ذكية
          </Button>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <h4 className="font-semibold text-yellow-800">وضع الاختبار</h4>
          </div>
          <p className="text-sm text-yellow-700">
            النظام يعمل في وضع الاختبار. الرسائل لن يتم إرسالها فعلياً ولكن سيتم محاكاة العملية للتحقق من صحة النظام.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component - المكون الرئيسي
// ============================================================================

export default function SmartNotifications() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">نظام التنبيهات الذكية</h1>
          <p className="text-muted-foreground">إنشاء وإدارة حملات التنبيهات المستهدفة بالذكاء الاصطناعي</p>
        </div>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">
            <Brain className="w-4 h-4 mr-2" />
            إنشاء حملة
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            الإحصائيات
          </TabsTrigger>
          <TabsTrigger value="testing">
            <Settings className="w-4 h-4 mr-2" />
            الاختبار
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <SmartCampaignCreator />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="testing">
          <QuickActions />
        </TabsContent>
      </Tabs>
    </div>
  );
}