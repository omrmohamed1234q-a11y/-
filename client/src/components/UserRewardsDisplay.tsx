import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  Gift, 
  Users, 
  FileText, 
  Award,
  Copy,
  CheckCircle,
  Clock,
  TrendingUp,
  Share2,
  RefreshCw,
  Eye,
  Calendar,
  Trophy
} from 'lucide-react';

interface UserReward {
  freePages: number;
  totalPrintedPages: number;
  totalEarnedPages: number;
  referralCode: string;
  referralCount: number;
  firstLoginBonusGiven: boolean;
}

interface ProgressInfo {
  currentMilestone: number;
  nextMilestonePages: number;
  progressToNext: number;
  progressPercent: number;
  pagesRemaining: number;
}

interface RewardHistoryItem {
  id: string;
  rewardType: string;
  pagesEarned: number;
  description: string;
  createdAt: string;
  metadata?: any;
}

interface UserRewardsData {
  userReward: UserReward;
  progress: ProgressInfo;
  recentRewards: RewardHistoryItem[];
  settings: {
    pages_per_milestone: number;
    milestone_reward: number;
    referral_reward: number;
    first_login_bonus: number;
  };
}

export default function UserRewardsDisplay() {
  const { toast } = useToast();
  const [data, setData] = useState<UserRewardsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [referralDialog, setReferralDialog] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [historyDialog, setHistoryDialog] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // تحميل بيانات المكافآت
  const loadRewardsData = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('GET', '/api/rewards');
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Error loading rewards data:', error);
      // بيانات تجريبية للعرض
      setData({
        userReward: {
          freePages: 25,
          totalPrintedPages: 350,
          totalEarnedPages: 35,
          referralCode: 'FRIEND2024',
          referralCount: 3,
          firstLoginBonusGiven: true
        },
        progress: {
          currentMilestone: 0,
          nextMilestonePages: 500,
          progressToNext: 350,
          progressPercent: 70,
          pagesRemaining: 150
        },
        recentRewards: [
          {
            id: '1',
            rewardType: 'referral',
            pagesEarned: 10,
            description: 'مكافأة دعوة صديق',
            createdAt: new Date().toISOString()
          },
          {
            id: '2', 
            rewardType: 'first_login',
            pagesEarned: 10,
            description: 'مكافأة الترحيب',
            createdAt: new Date(Date.now() - 24*60*60*1000).toISOString()
          }
        ],
        settings: {
          pages_per_milestone: 500,
          milestone_reward: 10,
          referral_reward: 10,
          first_login_bonus: 10
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // تطبيق كود دعوة
  const applyReferralCode = async () => {
    if (!referralCode.trim()) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال كود الدعوة',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest('POST', '/api/rewards/apply-referral', {
        referralCode: referralCode.trim().toUpperCase()
      });

      if (response.success) {
        toast({
          title: 'تم التطبيق!',
          description: response.message
        });
        setReferralDialog(false);
        setReferralCode('');
        loadRewardsData(); // إعادة تحميل البيانات
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      console.error('Error applying referral:', error);
      toast({
        title: 'خطأ في التطبيق',
        description: error.message || 'كود الدعوة غير صحيح',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // نسخ كود الدعوة
  const copyReferralCode = async () => {
    if (!data?.userReward.referralCode) return;
    
    try {
      await navigator.clipboard.writeText(data.userReward.referralCode);
      setCopiedCode(true);
      toast({
        title: 'تم النسخ!',
        description: 'تم نسخ كود الدعوة إلى الحافظة'
      });
      
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في نسخ الكود',
        variant: 'destructive'
      });
    }
  };

  // مشاركة كود الدعوة
  const shareReferralCode = async () => {
    if (!data?.userReward.referralCode) return;

    const shareText = `🎁 انضم إلى منصة "اطبعلي" واحصل على ${data.settings.referral_reward} أوراق مجانية!\n\nاستخدم كود الدعوة: ${data.userReward.referralCode}\n\nسوف نحصل كلانا على أوراق مجانية! 📄✨`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'دعوة لمنصة اطبعلي',
          text: shareText
        });
      } catch (error) {
        copyReferralCode(); // fallback للنسخ
      }
    } else {
      copyReferralCode(); // fallback للمتصفحات التي لا تدعم المشاركة
    }
  };

  // طلب مكافأة تسجيل الدخول الأول
  const claimFirstLoginBonus = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('POST', '/api/rewards/first-login-bonus');
      
      if (response.success) {
        toast({
          title: 'مبروك! 🎉',
          description: response.message
        });
        loadRewardsData();
      }
    } catch (error: any) {
      console.error('Error claiming first login bonus:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل في الحصول على المكافأة',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRewardsData();
  }, []);

  if (!data) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg" />
          <div className="h-24 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  const rewardTypeNames: Record<string, { name: string; icon: any; color: string }> = {
    print_milestone: { name: 'مكافأة معلم', icon: TrendingUp, color: 'text-blue-500' },
    referral: { name: 'دعوة صديق', icon: Users, color: 'text-green-500' },
    first_login: { name: 'مكافأة ترحيب', icon: Gift, color: 'text-yellow-500' },
    admin_bonus: { name: 'مكافأة إدارية', icon: Award, color: 'text-purple-500' }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* الملخص الرئيسي */}
      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-90" />
              <p className="text-2xl font-bold">{data.userReward.freePages}</p>
              <p className="text-orange-100">أوراق مجانية متاحة</p>
            </div>
            
            <div className="text-center">
              <Trophy className="h-12 w-12 mx-auto mb-2 opacity-90" />
              <p className="text-2xl font-bold">{data.userReward.totalEarnedPages}</p>
              <p className="text-orange-100">إجمالي المكافآت</p>
            </div>
            
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-90" />
              <p className="text-2xl font-bold">{data.userReward.referralCount}</p>
              <p className="text-orange-100">الأصدقاء المدعوون</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* مكافأة الترحيب */}
      {!data.userReward.firstLoginBonusGiven && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gift className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-bold text-green-800">مكافأة الترحيب متاحة!</h3>
                  <p className="text-green-600 text-sm">
                    احصل على {data.settings.first_login_bonus} أوراق مجانية كهدية ترحيب
                  </p>
                </div>
              </div>
              <Button 
                onClick={claimFirstLoginBonus}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Gift className="h-4 w-4 mr-2" />
                اطلب المكافأة
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* التقدم نحو المعلم التالي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            التقدم نحو المكافأة التالية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>طبعت {data.userReward.totalPrintedPages} ورقة</span>
            <span>الهدف: {data.progress.nextMilestonePages} ورقة</span>
          </div>
          
          <Progress value={data.progress.progressPercent} className="h-3" />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                باقي <span className="font-bold text-blue-600">{data.progress.pagesRemaining} ورقة</span> للحصول على المكافأة
              </p>
            </div>
            <Badge variant="outline" className="bg-blue-50">
              {data.settings.milestone_reward} أوراق مجانية قادمة
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* دعوة الأصدقاء */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-green-500" />
              ادع أصدقاءك
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="font-bold text-lg">{data.userReward.referralCode}</p>
              <p className="text-sm text-green-600 mt-1">كود الدعوة الخاص بك</p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={copyReferralCode}
                variant="outline"
                className="flex-1"
              >
                {copiedCode ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copiedCode ? 'تم النسخ' : 'نسخ'}
              </Button>
              <Button
                onClick={shareReferralCode}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Share2 className="h-4 w-4 mr-2" />
                مشاركة
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 text-center">
              كلاكما سيحصل على {data.settings.referral_reward} أوراق مجانية
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              استخدم كود دعوة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              هل لديك كود دعوة من صديق؟ استخدمه للحصول على أوراق مجانية!
            </p>
            
            <Dialog open={referralDialog} onOpenChange={setReferralDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  أدخل كود الدعوة
                </Button>
              </DialogTrigger>
              
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>استخدم كود دعوة صديق</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div>
                    <Input
                      placeholder="أدخل كود الدعوة"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      ستحصل أنت وصديقك على {data.settings.referral_reward} أوراق مجانية لكل منكما
                    </p>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setReferralDialog(false)}>
                    إلغاء
                  </Button>
                  <Button onClick={applyReferralCode} disabled={loading}>
                    <Users className="h-4 w-4 mr-2" />
                    تطبيق الكود
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            {data.userReward.referralCount > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-700">
                  🎉 دعوت {data.userReward.referralCount} من أصدقائك وحصلت على {data.userReward.referralCount * data.settings.referral_reward} ورقة مجانية!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* سجل المكافآت الأخيرة */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            آخر المكافآت
          </CardTitle>
          
          <Dialog open={historyDialog} onOpenChange={setHistoryDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                عرض الكل
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>سجل المكافآت الكامل</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {data.recentRewards.map((reward) => {
                  const rewardInfo = rewardTypeNames[reward.rewardType] || { 
                    name: reward.rewardType, 
                    icon: Award, 
                    color: 'text-gray-500' 
                  };
                  const RewardIcon = rewardInfo.icon;
                  
                  return (
                    <div key={reward.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <RewardIcon className={`h-5 w-5 ${rewardInfo.color}`} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{reward.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(reward.createdAt).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        +{reward.pagesEarned}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {data.recentRewards.slice(0, 3).map((reward) => {
              const rewardInfo = rewardTypeNames[reward.rewardType] || { 
                name: reward.rewardType, 
                icon: Award, 
                color: 'text-gray-500' 
              };
              const RewardIcon = rewardInfo.icon;
              
              return (
                <div key={reward.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <RewardIcon className={`h-5 w-5 ${rewardInfo.color}`} />
                    <div>
                      <p className="font-medium text-sm">{reward.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(reward.createdAt).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    +{reward.pagesEarned} ورقة
                  </Badge>
                </div>
              );
            })}
            
            {data.recentRewards.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد مكافآت بعد</p>
                <p className="text-sm">ابدأ بطباعة أوراق أو دعوة أصدقاء للحصول على مكافآت!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* أزرار الإجراءات */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">تحديث البيانات</h3>
              <p className="text-sm text-gray-600">احصل على آخر تحديثات المكافآت</p>
            </div>
            <Button onClick={loadRewardsData} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}