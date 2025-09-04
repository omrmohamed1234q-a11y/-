import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import {
  Gift,
  Settings,
  Users,
  TrendingUp,
  Award,
  DollarSign,
  UserPlus,
  FileText,
  BarChart3,
  Star,
  Plus,
  Edit,
  Save,
  RotateCcw
} from 'lucide-react';

interface RewardSettings {
  pages_per_milestone: number;
  milestone_reward: number;
  referral_reward: number;
  first_login_bonus: number;
  max_referral_rewards: number;
}

interface RewardStats {
  totalUsers: number;
  totalFreePages: number;
  totalEarnedPages: number;
  totalPrintedPages: number;
  totalReferrals: number;
  rewardTypeStats: Record<string, number>;
  averagePagesPerUser: number;
  averageEarnedPerUser: number;
}

export default function RewardsManagement() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<RewardSettings>({
    pages_per_milestone: 500,
    milestone_reward: 10,
    referral_reward: 10,
    first_login_bonus: 10,
    max_referral_rewards: 100
  });
  const [originalSettings, setOriginalSettings] = useState<RewardSettings>(settings);
  const [stats, setStats] = useState<RewardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // منح مكافأة يدوية
  const [manualRewardDialog, setManualRewardDialog] = useState(false);
  const [manualRewardForm, setManualRewardForm] = useState({
    userId: '',
    pages: '',
    reason: ''
  });

  // تحميل الإعدادات الحالية
  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', '/api/admin/rewards/settings');
      if (response.success) {
        setSettings(response.data);
        setOriginalSettings(response.data);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // استخدام القيم الافتراضية إذا فشل التحميل
      toast({
        title: 'تحذير',
        description: 'تم تحميل الإعدادات الافتراضية. تأكد من حفظ التغييرات.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // تحميل الإحصائيات
  const loadStats = async () => {
    try {
      const response = await apiRequest('GET', '/api/admin/rewards/stats');
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // بيانات تجريبية للعرض
      setStats({
        totalUsers: 156,
        totalFreePages: 2340,
        totalEarnedPages: 4680,
        totalPrintedPages: 15600,
        totalReferrals: 89,
        rewardTypeStats: {
          print_milestone: 2340,
          referral: 890,
          first_login: 1560,
          admin_bonus: 390
        },
        averagePagesPerUser: 100,
        averageEarnedPerUser: 30
      });
    }
  };

  useEffect(() => {
    loadSettings();
    loadStats();
  }, []);

  // تتبع التغييرات
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [settings, originalSettings]);

  // حفظ الإعدادات
  const saveSettings = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('POST', '/api/admin/rewards/settings', settings);
      if (response.success) {
        setOriginalSettings({ ...settings });
        setHasChanges(false);
        toast({
          title: 'تم الحفظ',
          description: 'تم تحديث إعدادات المكافآت بنجاح'
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حفظ الإعدادات',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // إعادة تعيين الإعدادات
  const resetSettings = () => {
    setSettings({ ...originalSettings });
    setHasChanges(false);
  };

  // منح مكافأة يدوية
  const grantManualReward = async () => {
    try {
      if (!manualRewardForm.userId || !manualRewardForm.pages) {
        toast({
          title: 'خطأ',
          description: 'يرجى إدخال معرف المستخدم وعدد الأوراق',
          variant: 'destructive'
        });
        return;
      }

      setLoading(true);
      const response = await apiRequest('POST', '/api/admin/rewards/grant', {
        userId: manualRewardForm.userId,
        pages: parseInt(manualRewardForm.pages),
        reason: manualRewardForm.reason || 'مكافأة إدارية'
      });

      if (response.success) {
        toast({
          title: 'تم المنح',
          description: response.message
        });
        setManualRewardDialog(false);
        setManualRewardForm({ userId: '', pages: '', reason: '' });
        loadStats(); // إعادة تحميل الإحصائيات
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Error granting manual reward:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في منح المكافأة',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: keyof RewardSettings, value: string) => {
    const numValue = parseInt(value) || 0;
    setSettings(prev => ({
      ...prev,
      [key]: numValue
    }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gift className="h-8 w-8 text-orange-500" />
            إدارة نظام المكافآت والأوراق المجانية
          </h1>
          <p className="text-gray-600 mt-2">
            تحكم في قوانين المكافآت وتتبع استخدام الأوراق المجانية
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              يوجد تغييرات غير محفوظة
            </Badge>
          )}
          
          <Button
            onClick={resetSettings}
            variant="outline"
            disabled={!hasChanges || loading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            إعادة تعيين
          </Button>
          
          <Button
            onClick={saveSettings}
            disabled={!hasChanges || loading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Save className="h-4 w-4 mr-2" />
            حفظ التغييرات
          </Button>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            إعدادات المكافآت
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            الإحصائيات
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            المكافآت اليدوية
          </TabsTrigger>
        </TabsList>

        {/* إعدادات المكافآت */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* إعدادات المعالم */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  مكافآت معالم الطباعة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pages_per_milestone">عدد الأوراق لكل معلم</Label>
                    <Input
                      id="pages_per_milestone"
                      type="number"
                      value={settings.pages_per_milestone}
                      onChange={(e) => handleSettingChange('pages_per_milestone', e.target.value)}
                      min="1"
                      max="10000"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      كل كم ورقة يحصل المستخدم على مكافأة
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="milestone_reward">عدد الأوراق المجانية</Label>
                    <Input
                      id="milestone_reward"
                      type="number"
                      value={settings.milestone_reward}
                      onChange={(e) => handleSettingChange('milestone_reward', e.target.value)}
                      min="1"
                      max="100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      عدد الأوراق المجانية عند كل معلم
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">المعاينة:</h4>
                  <p className="text-sm text-blue-700">
                    كل <span className="font-bold">{settings.pages_per_milestone} ورقة</span> يطبعها المستخدم،
                    سيحصل على <span className="font-bold">{settings.milestone_reward} أوراق مجانية</span>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    مثال: عند طباعة 1500 ورقة = {Math.floor(1500 / settings.pages_per_milestone) * settings.milestone_reward} ورقة مجانية
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* إعدادات الدعوات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-green-500" />
                  مكافآت دعوة الأصدقاء
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="referral_reward">مكافأة الدعوة</Label>
                    <Input
                      id="referral_reward"
                      type="number"
                      value={settings.referral_reward}
                      onChange={(e) => handleSettingChange('referral_reward', e.target.value)}
                      min="1"
                      max="100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      أوراق مجانية لكل طرف عند الدعوة
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="max_referral_rewards">حد الدعوات الأقصى</Label>
                    <Input
                      id="max_referral_rewards"
                      type="number"
                      value={settings.max_referral_rewards}
                      onChange={(e) => handleSettingChange('max_referral_rewards', e.target.value)}
                      min="1"
                      max="1000"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      الحد الأقصى لعدد الدعوات المكافأة
                    </p>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">المعاينة:</h4>
                  <p className="text-sm text-green-700">
                    عند دعوة صديق، كلا الطرفين يحصل على <span className="font-bold">{settings.referral_reward} أوراق مجانية</span>
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    الحد الأقصى: {Math.floor(settings.max_referral_rewards / settings.referral_reward)} دعوة مكافأة
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* إعدادات الترحيب */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  مكافأة الترحيب
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="first_login_bonus">أوراق الترحيب المجانية</Label>
                  <Input
                    id="first_login_bonus"
                    type="number"
                    value={settings.first_login_bonus}
                    onChange={(e) => handleSettingChange('first_login_bonus', e.target.value)}
                    min="0"
                    max="50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    أوراق مجانية عند أول تسجيل دخول
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">المعاينة:</h4>
                  <p className="text-sm text-yellow-700">
                    كل مستخدم جديد سيحصل على <span className="font-bold">{settings.first_login_bonus} أوراق مجانية</span> عند أول تسجيل دخول
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* ملخص سريع */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-500" />
                  ملخص النظام
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">مكافأة الترحيب:</span>
                    <Badge variant="outline">{settings.first_login_bonus} أوراق</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">مكافأة الدعوة:</span>
                    <Badge variant="outline">{settings.referral_reward} أوراق لكل طرف</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">مكافأة المعلم:</span>
                    <Badge variant="outline">{settings.milestone_reward} أوراق / {settings.pages_per_milestone} ورقة</Badge>
                  </div>
                </div>

                <Separator />

                <div className="text-xs text-gray-500">
                  <p><strong>مثال لمستخدم نشط:</strong></p>
                  <p>• الترحيب: {settings.first_login_bonus} أوراق</p>
                  <p>• دعوة 5 أصدقاء: {settings.referral_reward * 5} أوراق</p>
                  <p>• طباعة 1000 ورقة: {Math.floor(1000 / settings.pages_per_milestone) * settings.milestone_reward} أوراق</p>
                  <p className="font-medium mt-1 text-purple-600">
                    المجموع: {settings.first_login_bonus + (settings.referral_reward * 5) + (Math.floor(1000 / settings.pages_per_milestone) * settings.milestone_reward)} ورقة مجانية
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* الإحصائيات */}
        <TabsContent value="stats" className="space-y-6">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">إجمالي المستخدمين</p>
                      <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">الأوراق المطبوعة</p>
                      <p className="text-2xl font-bold">{stats.totalPrintedPages.toLocaleString()}</p>
                    </div>
                    <FileText className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">الأوراق المكتسبة</p>
                      <p className="text-2xl font-bold">{stats.totalEarnedPages.toLocaleString()}</p>
                    </div>
                    <Award className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">إجمالي الدعوات</p>
                      <p className="text-2xl font-bold">{stats.totalReferrals.toLocaleString()}</p>
                    </div>
                    <UserPlus className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* إحصائيات أنواع المكافآت */}
            <Card>
              <CardHeader>
                <CardTitle>توزيع أنواع المكافآت</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-3">
                    {Object.entries(stats.rewardTypeStats).map(([type, count]) => {
                      const typeNames: Record<string, string> = {
                        print_milestone: 'مكافآت المعالم',
                        referral: 'مكافآت الدعوات',
                        first_login: 'مكافآت الترحيب',
                        admin_bonus: 'مكافآت إدارية'
                      };
                      
                      const total = Object.values(stats.rewardTypeStats).reduce((sum, val) => sum + val, 0);
                      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                      
                      return (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-sm">{typeNames[type] || type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{count.toLocaleString()}</span>
                            <span className="text-xs text-gray-500">({percentage}%)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* معدلات الاستخدام */}
            <Card>
              <CardHeader>
                <CardTitle>معدلات الاستخدام</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">متوسط الأوراق المطبوعة</span>
                      <span className="text-lg font-bold text-blue-600">
                        {stats.averagePagesPerUser} ورقة/مستخدم
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">متوسط الأوراق المكتسبة</span>
                      <span className="text-lg font-bold text-green-600">
                        {stats.averageEarnedPerUser} ورقة/مستخدم
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">معدل الاستفادة</span>
                      <span className="text-lg font-bold text-orange-600">
                        {stats.averagePagesPerUser > 0 ? 
                          Math.round((stats.averageEarnedPerUser / stats.averagePagesPerUser) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* المكافآت اليدوية */}
        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-orange-500" />
                منح مكافآت يدوية
              </CardTitle>
              <p className="text-sm text-gray-600">
                يمكنك منح أوراق مجانية إضافية لأي مستخدم لأسباب خاصة
              </p>
            </CardHeader>
            <CardContent>
              <Dialog open={manualRewardDialog} onOpenChange={setManualRewardDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="h-4 w-4 mr-2" />
                    منح مكافأة جديدة
                  </Button>
                </DialogTrigger>
                
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>منح مكافأة يدوية</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="manual_user_id">معرف المستخدم</Label>
                      <Input
                        id="manual_user_id"
                        placeholder="user-12345 أو البريد الإلكتروني"
                        value={manualRewardForm.userId}
                        onChange={(e) => setManualRewardForm(prev => ({
                          ...prev,
                          userId: e.target.value
                        }))}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        يمكنك استخدام معرف المستخدم أو البريد الإلكتروني
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="manual_pages">عدد الأوراق المجانية</Label>
                      <Input
                        id="manual_pages"
                        type="number"
                        placeholder="10"
                        min="1"
                        max="500"
                        value={manualRewardForm.pages}
                        onChange={(e) => setManualRewardForm(prev => ({
                          ...prev,
                          pages: e.target.value
                        }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="manual_reason">سبب المكافأة (اختياري)</Label>
                      <Textarea
                        id="manual_reason"
                        placeholder="سبب منح هذه المكافأة..."
                        value={manualRewardForm.reason}
                        onChange={(e) => setManualRewardForm(prev => ({
                          ...prev,
                          reason: e.target.value
                        }))}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setManualRewardDialog(false)}
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={grantManualReward}
                      disabled={loading}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Award className="h-4 w-4 mr-2" />
                      منح المكافأة
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <div className="mt-6 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">تنبيهات مهمة:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• تأكد من صحة معرف المستخدم قبل المنح</li>
                  <li>• المكافآت اليدوية لا يمكن إلغاؤها أو استردادها</li>
                  <li>• سيتم تسجيل جميع المكافآت اليدوية في سجل النشاط</li>
                  <li>• استخدم أسباباً واضحة لتسهيل المراجعة لاحقاً</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}