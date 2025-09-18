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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
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
  RotateCcw,
  Trash2,
  Eye,
  Target
} from 'lucide-react';

interface RewardSettings {
  points_per_milestone: number;
  milestone_reward: number;
  referral_reward: number;
  first_login_bonus: number;
  max_referral_rewards: number;
}

interface RewardStats {
  totalUsers: number;
  totalFreePoints: number;
  totalEarnedPoints: number;
  totalPrintedPages: number;
  totalReferrals: number;
  rewardTypeStats: Record<string, number>;
  averagePagesPerUser: number;
  averagePointsPerUser: number;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  points_cost: number;
  reward_type: string;
  reward_value: any;
  available: boolean;
  limit_per_user: number | null;
  created_at: string;
}

interface UserOption {
  value: string;
  label: string;
  displayName: string;
  email: string;
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: string;
  target_value: number;
  points_reward: number;
  is_daily: boolean;
  active: boolean;
  created_at: string;
}

export default function RewardsManagement() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<RewardSettings>({
    points_per_milestone: 500,
    milestone_reward: 10,
    referral_reward: 10,
    first_login_bonus: 10,
    max_referral_rewards: 100
  });
  const [originalSettings, setOriginalSettings] = useState<RewardSettings>(settings);
  const [stats, setStats] = useState<RewardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // إدارة المكافآت والتحديات
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [rewardDialog, setRewardDialog] = useState(false);
  const [challengeDialog, setChallengeDialog] = useState(false);

  // منح مكافأة يدوية
  const [manualRewardDialog, setManualRewardDialog] = useState(false);
  const [manualRewardForm, setManualRewardForm] = useState({
    userId: '',
    points: '',
    reason: ''
  });

  // جلب قائمة المستخدمين للقائمة المنسدلة
  const { data: usersResponse, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['/api/admin/users/list'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users/list');
      return response;
    },
    enabled: manualRewardDialog, // جلب البيانات فقط عند فتح النافذة
  });
  
  const usersList: UserOption[] = usersResponse?.data || [];

  // تحميل الإعدادات الحالية
  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', '/api/admin/rewards/settings');
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
        setOriginalSettings(data.data);
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
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      } else {
        // لا توجد بيانات متاحة
        setStats(null);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // فشل في تحميل الإحصائيات - عرض حالة خطأ
      setStats(null);
      toast({
        title: 'تحذير',
        description: 'فشل في تحميل إحصائيات المكافآت. تأكد من اتصالك بالإنترنت.',
        variant: 'destructive'
      });
    }
  };

  // تحميل المكافآت
  const loadRewards = async () => {
    try {
      const response = await apiRequest('GET', '/api/admin/rewards/all');
      const data = await response.json();
      if (data.success) {
        setRewards(data.data);
      }
    } catch (error) {
      console.error('Error loading rewards:', error);
    }
  };

  // تحميل التحديات
  const loadChallenges = async () => {
    try {
      const response = await apiRequest('GET', '/api/admin/challenges/all');
      const data = await response.json();
      if (data.success) {
        setChallenges(data.data);
      }
    } catch (error) {
      console.error('Error loading challenges:', error);
    }
  };

  // حفظ/تحديث مكافأة
  const saveReward = async (rewardData: any) => {
    try {
      setLoading(true);
      const isEdit = selectedReward?.id;
      const url = isEdit ? `/api/admin/rewards/${selectedReward.id}` : '/api/admin/rewards';
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await apiRequest(method, url, rewardData);
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: isEdit ? 'تم التحديث' : 'تم الإنشاء',
          description: data.message
        });
        setRewardDialog(false);
        setSelectedReward(null);
        loadRewards();
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حفظ المكافأة',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // حذف مكافأة
  const deleteReward = async (id: string) => {
    try {
      const response = await apiRequest('DELETE', `/api/admin/rewards/${id}`);
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'تم الحذف',
          description: data.message
        });
        loadRewards();
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حذف المكافأة',
        variant: 'destructive'
      });
    }
  };

  // حفظ/تحديث تحدي
  const saveChallenge = async (challengeData: any) => {
    try {
      setLoading(true);
      const isEdit = selectedChallenge?.id;
      const url = isEdit ? `/api/admin/challenges/${selectedChallenge.id}` : '/api/admin/challenges';
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await apiRequest(method, url, challengeData);
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: isEdit ? 'تم التحديث' : 'تم الإنشاء',
          description: data.message
        });
        setChallengeDialog(false);
        setSelectedChallenge(null);
        loadChallenges();
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حفظ التحدي',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // حذف تحدي
  const deleteChallenge = async (id: string) => {
    try {
      const response = await apiRequest('DELETE', `/api/admin/challenges/${id}`);
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'تم الحذف',
          description: data.message
        });
        loadChallenges();
      }
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في حذف التحدي',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    loadSettings();
    loadStats();
    loadRewards();
    loadChallenges();
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
      const data = await response.json();
      if (data.success) {
        setOriginalSettings({ ...settings });
        setHasChanges(false);
        toast({
          title: 'تم الحفظ',
          description: 'تم تحديث إعدادات المكافآت بنجاح'
        });
      } else {
        throw new Error(data.message || 'فشل في حفظ الإعدادات');
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
      if (!manualRewardForm.userId || !manualRewardForm.points) {
        toast({
          title: 'خطأ',
          description: 'يرجى إدخال معرف المستخدم وعدد النقاط',
          variant: 'destructive'
        });
        return;
      }

      setLoading(true);
      const response = await apiRequest('POST', '/api/admin/rewards/grant', {
        userId: manualRewardForm.userId,
        points: parseInt(manualRewardForm.points),
        reason: manualRewardForm.reason || 'مكافأة إدارية'
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'تم المنح',
          description: data.message
        });
        setManualRewardDialog(false);
        setManualRewardForm({ userId: '', points: '', reason: '' });
        loadStats(); // إعادة تحميل الإحصائيات
      } else {
        throw new Error(data.message);
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
            إدارة نظام المكافآت والنقاط المجانية
          </h1>
          <p className="text-gray-600 mt-2">
            تحكم في قوانين المكافآت وتتبع استخدام النقاط المجانية
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

      <Tabs defaultValue="rewards" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            المكافآت
          </TabsTrigger>
          <TabsTrigger value="challenges" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            التحديات
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            الإعدادات
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

        {/* إدارة المكافآت */}
        <TabsContent value="rewards" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">إدارة المكافآت</h2>
            <Button 
              onClick={() => {
                setSelectedReward(null);
                setRewardDialog(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              إضافة مكافأة جديدة
            </Button>
          </div>

          {rewards.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Gift className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  لا توجد مكافآت متاحة
                </h3>
                <p className="text-gray-600 mb-6">
                  لم يتم إنشاء أي مكافآت بعد. ابدأ بإضافة أول مكافأة!
                </p>
                <Button 
                  onClick={() => {
                    setSelectedReward(null);
                    setRewardDialog(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  إضافة أول مكافأة
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((reward) => (
                <Card key={reward.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold">{reward.name}</h3>
                    <Badge variant={reward.available ? "default" : "secondary"}>
                      {reward.available ? "متاح" : "غير متاح"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-blue-600">{reward.points_cost} نقطة</span>
                    <Badge variant="outline">{reward.reward_type}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedReward(reward);
                        setRewardDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => deleteReward(reward.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* إدارة التحديات */}
        <TabsContent value="challenges" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">إدارة التحديات</h2>
            <Button 
              onClick={() => {
                setSelectedChallenge(null);
                setChallengeDialog(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              إضافة تحدي جديد
            </Button>
          </div>

          {challenges.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Target className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  لا توجد تحديات متاحة
                </h3>
                <p className="text-gray-600 mb-6">
                  لم يتم إنشاء أي تحديات بعد. ابدأ بإضافة أول تحدي!
                </p>
                <Button 
                  onClick={() => {
                    setSelectedChallenge(null);
                    setChallengeDialog(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  إضافة أول تحدي
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {challenges.map((challenge) => (
                <Card key={challenge.id} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold">{challenge.name}</h3>
                    <Badge variant={challenge.active ? "default" : "secondary"}>
                      {challenge.active ? "نشط" : "غير نشط"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{challenge.description}</p>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold text-green-600">{challenge.points_reward} نقطة</span>
                    <Badge variant="outline">{challenge.is_daily ? "يومي" : "عام"}</Badge>
                  </div>
                  <div className="text-sm text-gray-500 mb-3">
                    الهدف: {challenge.target_value} {challenge.type}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedChallenge(challenge);
                        setChallengeDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => deleteChallenge(challenge.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

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
                    <Label htmlFor="points_per_milestone">عدد النقاط لكل معلم</Label>
                    <Input
                      id="points_per_milestone"
                      type="number"
                      value={settings.points_per_milestone}
                      onChange={(e) => handleSettingChange('points_per_milestone', e.target.value)}
                      min="1"
                      max="10000"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      كل كم ورقة يحصل المستخدم على مكافأة
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="milestone_reward">عدد النقاط المجانية</Label>
                    <Input
                      id="milestone_reward"
                      type="number"
                      value={settings.milestone_reward}
                      onChange={(e) => handleSettingChange('milestone_reward', e.target.value)}
                      min="1"
                      max="100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      عدد النقاط المجانية عند كل معلم
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">المعاينة:</h4>
                  <p className="text-sm text-blue-700">
                    كل <span className="font-bold">{settings.points_per_milestone} نقطة</span> يحرزها المستخدم،
                    سيحصل على <span className="font-bold">{settings.milestone_reward} نقاط مجانية</span>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    مثال: عند جمع 1500 نقطة = {Math.floor(1500 / settings.points_per_milestone) * settings.milestone_reward} نقطة مجانية
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
                      نقاط مجانية لكل طرف عند الدعوة
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
                    عند دعوة صديق، كلا الطرفين يحصل على <span className="font-bold">{settings.referral_reward} نقاط مجانية</span>
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
                  <Label htmlFor="first_login_bonus">نقاط الترحيب المجانية</Label>
                  <Input
                    id="first_login_bonus"
                    type="number"
                    value={settings.first_login_bonus}
                    onChange={(e) => handleSettingChange('first_login_bonus', e.target.value)}
                    min="0"
                    max="50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    نقاط مجانية عند أول تسجيل دخول
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">المعاينة:</h4>
                  <p className="text-sm text-yellow-700">
                    كل مستخدم جديد سيحصل على <span className="font-bold">{settings.first_login_bonus} نقاط مجانية</span> عند أول تسجيل دخول
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
                    <Badge variant="outline">{settings.first_login_bonus} نقاط</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">مكافأة الدعوة:</span>
                    <Badge variant="outline">{settings.referral_reward} نقاط لكل طرف</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">مكافأة المعلم:</span>
                    <Badge variant="outline">{settings.milestone_reward} نقاط / {settings.points_per_milestone} نقطة</Badge>
                  </div>
                </div>

                <Separator />

                <div className="text-xs text-gray-500">
                  <p><strong>مثال لمستخدم نشط:</strong></p>
                  <p>• الترحيب: {settings.first_login_bonus} نقاط</p>
                  <p>• دعوة 5 أصدقاء: {settings.referral_reward * 5} نقاط</p>
                  <p>• جمع 1000 نقطة: {Math.floor(1000 / settings.points_per_milestone) * settings.milestone_reward} نقاط</p>
                  <p className="font-medium mt-1 text-purple-600">
                    المجموع: {settings.first_login_bonus + (settings.referral_reward * 5) + (Math.floor(1000 / settings.points_per_milestone) * settings.milestone_reward)} نقطة مجانية
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* الإحصائيات */}
        <TabsContent value="stats" className="space-y-6">
          {!stats ? (
            <Card>
              <CardContent className="py-16 text-center">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  لا توجد إحصائيات متاحة
                </h3>
                <p className="text-gray-600 mb-6">
                  سيتم عرض الإحصائيات عندما تبدأ في استخدام نظام المكافآت
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <h4 className="font-medium text-blue-800 mb-2">ماذا ستشمل الإحصائيات؟</h4>
                  <ul className="text-sm text-blue-700 space-y-1 text-right">
                    <li>• إجمالي المستخدمين والطلبات</li>
                    <li>• إحصائيات الطباعة والمبيعات</li>
                    <li>• تحليل أداء المكافآت</li>
                    <li>• معدلات نمو النشاط</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
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
                      <p className="text-sm font-medium text-gray-600">النقاط المكتسبة</p>
                      <p className="text-2xl font-bold">{stats.totalEarnedPoints?.toLocaleString() || '0'}</p>
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
                      <span className="text-sm font-medium">متوسط النقاط المكتسبة</span>
                      <span className="text-lg font-bold text-green-600">
                        {stats.averagePointsPerUser || 0} نقطة/مستخدم
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">معدل الاستفادة</span>
                      <span className="text-lg font-bold text-orange-600">
                        {stats.averagePagesPerUser > 0 ? 
                          Math.round((stats.averagePointsPerUser / stats.averagePagesPerUser) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
            </>
          )}
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
                يمكنك منح نقاط مجانية إضافية لأي مستخدم لأسباب خاصة
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
                      <Label htmlFor="manual_user_id">اختر المستخدم</Label>
                      <Select
                        value={manualRewardForm.userId}
                        onValueChange={(value) => setManualRewardForm(prev => ({
                          ...prev,
                          userId: value
                        }))}
                        disabled={usersLoading}
                      >
                        <SelectTrigger>
                          <SelectValue 
                            placeholder={usersLoading ? "جاري تحميل المستخدمين..." : "اختر مستخدم من القائمة"} 
                          />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {usersLoading ? (
                            <SelectItem value="" disabled>
                              جاري تحميل المستخدمين...
                            </SelectItem>
                          ) : usersError ? (
                            <SelectItem value="" disabled>
                              خطأ في تحميل المستخدمين
                            </SelectItem>
                          ) : usersList?.length > 0 ? (
                            usersList.map((user) => (
                              <SelectItem key={user.value} value={user.value}>
                                <div className="flex flex-col items-start">
                                  <span className="font-medium">{user.email}</span>
                                  {user.displayName && user.displayName !== user.email && (
                                    <span className="text-sm text-gray-500">{user.displayName}</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="" disabled>
                              لا توجد مستخدمين متاحين
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        اختر المستخدم المراد منحه المكافأة من القائمة
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="manual_points">عدد النقاط المجانية</Label>
                      <Input
                        id="manual_points"
                        type="number"
                        placeholder="10"
                        min="1"
                        max="500"
                        value={manualRewardForm.points}
                        onChange={(e) => setManualRewardForm(prev => ({
                          ...prev,
                          points: e.target.value
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

      {/* Dialog لإضافة/تعديل مكافأة */}
      <Dialog open={rewardDialog} onOpenChange={setRewardDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedReward ? 'تعديل المكافأة' : 'إضافة مكافأة جديدة'}</DialogTitle>
          </DialogHeader>
          <RewardForm 
            reward={selectedReward}
            onSave={saveReward}
            onCancel={() => setRewardDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog لإضافة/تعديل تحدي */}
      <Dialog open={challengeDialog} onOpenChange={setChallengeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedChallenge ? 'تعديل التحدي' : 'إضافة تحدي جديد'}</DialogTitle>
          </DialogHeader>
          <ChallengeForm 
            challenge={selectedChallenge}
            onSave={saveChallenge}
            onCancel={() => setChallengeDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// مكون نموذج المكافأة
function RewardForm({ reward, onSave, onCancel }: { 
  reward: Reward | null; 
  onSave: (data: any) => void; 
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: reward?.name || '',
    description: reward?.description || '',
    points_cost: reward?.points_cost || 100,
    reward_type: reward?.reward_type || 'discount',
    available: reward?.available !== false,
    limit_per_user: reward?.limit_per_user || null
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">اسم المكافأة</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">الوصف</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="points_cost">النقاط المطلوبة</Label>
          <Input
            id="points_cost"
            type="number"
            value={formData.points_cost}
            onChange={(e) => setFormData({...formData, points_cost: parseInt(e.target.value)})}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="reward_type">نوع المكافأة</Label>
          <select
            id="reward_type"
            value={formData.reward_type}
            onChange={(e) => setFormData({...formData, reward_type: e.target.value})}
            className="w-full p-2 border rounded"
          >
            <option value="discount">خصم</option>
            <option value="free_prints">طباعة مجانية</option>
            <option value="mobile_credit">شحن موبايل</option>
            <option value="voucher">قسيمة</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="limit_per_user">الحد الأقصى للمستخدم</Label>
          <Input
            id="limit_per_user"
            type="number"
            value={formData.limit_per_user || ''}
            onChange={(e) => setFormData({...formData, limit_per_user: e.target.value ? parseInt(e.target.value) : null})}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="available"
            checked={formData.available}
            onChange={(e) => setFormData({...formData, available: e.target.checked})}
          />
          <Label htmlFor="available">متاح</Label>
        </div>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit">
          {reward ? 'تحديث' : 'إنشاء'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// مكون نموذج التحدي
function ChallengeForm({ challenge, onSave, onCancel }: { 
  challenge: Challenge | null; 
  onSave: (data: any) => void; 
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: challenge?.name || '',
    description: challenge?.description || '',
    type: challenge?.type || 'daily',
    target_value: challenge?.target_value || 1,
    points_reward: challenge?.points_reward || 50,
    is_daily: challenge?.is_daily !== false,
    active: challenge?.active !== false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">اسم التحدي</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="description">الوصف</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">نوع التحدي</Label>
          <select
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
            className="w-full p-2 border rounded"
          >
            <option value="daily">يومي</option>
            <option value="print">طباعة</option>
            <option value="referral">دعوة صديق</option>
            <option value="streak">أسبوع نشاط</option>
          </select>
        </div>
        
        <div>
          <Label htmlFor="target_value">الهدف المطلوب</Label>
          <Input
            id="target_value"
            type="number"
            value={formData.target_value}
            onChange={(e) => setFormData({...formData, target_value: parseInt(e.target.value)})}
            required
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="points_reward">النقاط المكتسبة</Label>
        <Input
          id="points_reward"
          type="number"
          value={formData.points_reward}
          onChange={(e) => setFormData({...formData, points_reward: parseInt(e.target.value)})}
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_daily"
            checked={formData.is_daily}
            onChange={(e) => setFormData({...formData, is_daily: e.target.checked})}
          />
          <Label htmlFor="is_daily">تحدي يومي</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="active"
            checked={formData.active}
            onChange={(e) => setFormData({...formData, active: e.target.checked})}
          />
          <Label htmlFor="active">نشط</Label>
        </div>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          إلغاء
        </Button>
        <Button type="submit">
          {challenge ? 'تحديث' : 'إنشاء'}
        </Button>
      </DialogFooter>
    </form>
  );
}