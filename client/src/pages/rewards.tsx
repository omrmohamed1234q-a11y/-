import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import Header from '@/components/layout/header';
import BottomNav from '@/components/layout/bottom-nav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface Challenge {
  id: string;
  name: string;
  description: string;
  type: string;
  target_value: number;
  points_reward: number;
  is_daily: boolean;
  active: boolean;
}

interface UserChallenge {
  id: string;
  challenge_id: string;
  current_progress: number;
  completed: boolean;
  completed_at: string | null;
  challenges: Challenge;
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
}

interface RewardRedemption {
  id: string;
  reward_id: string;
  points_spent: number;
  status: string;
  created_at: string;
  rewards: Reward;
}

export default function Rewards() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch active challenges
  const { data: activeChallenges = [], isLoading: challengesLoading } = useQuery({
    queryKey: ['active-challenges'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/challenges/active');
        const data = await response.json();
        if (data.success) {
          return data.data;
        }
        throw new Error(data.message || 'فشل في جلب التحديات');
      } catch (error) {
        console.error('Error fetching challenges:', error);
        // بيانات احتياطية
        return [
          {
            id: '1',
            name: 'طباع النشيط',
            description: 'اطبع 5 صفحات في يوم واحد',
            type: 'daily',
            target_value: 5,
            points_reward: 50,
            is_daily: true,
            active: true
          }
        ];
      }
    },
  });

  // Fetch available rewards
  const { data: rewards = [], isLoading: rewardsLoading } = useQuery({
    queryKey: ['rewards'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/rewards/available');
        const data = await response.json();
        if (data.success) {
          return data.data as Reward[];
        }
        throw new Error(data.message || 'فشل في جلب المكافآت');
      } catch (error) {
        console.error('Error fetching rewards:', error);
        // بيانات احتياطية
        return [
          {
            id: '1',
            name: 'خصم 10 جنيه',
            description: 'خصم 10 جنيه على الطلبية القادمة',
            points_cost: 200,
            reward_type: 'discount',
            reward_value: { amount: 10 },
            available: true,
            limit_per_user: 5
          }
        ];
      }
    },
  });

  // Fetch user's redemption history
  const { data: redemptions = [] } = useQuery({
    queryKey: ['reward-redemptions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('reward_redemptions')
        .select(`
          *,
          rewards (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as RewardRedemption[];
    },
    enabled: !!user,
  });

  // Redeem reward mutation
  const redeemRewardMutation = useMutation({
    mutationFn: async ({ rewardId, pointsCost }: { rewardId: string; pointsCost: number }) => {
      if (!user) throw new Error('يجب تسجيل الدخول أولاً');
      if (user.bounty_points < pointsCost) throw new Error('نقاط غير كافية');

      // Start transaction
      const { data, error } = await supabase.rpc('redeem_reward', {
        p_user_id: user.id,
        p_reward_id: rewardId,
        p_points_cost: pointsCost,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { pointsCost }) => {
      // Update user points locally
      if (user) {
        updateProfile({
          bounty_points: user.bounty_points - pointsCost,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['reward-redemptions'] });
      toast({
        title: 'تم الاستبدال بنجاح!',
        description: 'تم خصم النقاط واستبدال المكافأة',
      });
    },
    onError: (error) => {
      toast({
        title: 'خطأ في الاستبدال',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleRedeemReward = (rewardId: string, pointsCost: number) => {
    redeemRewardMutation.mutate({ rewardId, pointsCost });
  };

  const calculateLevelProgress = () => {
    if (!user) return { progress: 0, nextLevel: 1, remainingPoints: 0 };
    
    const currentLevel = user.level;
    const pointsForNextLevel = currentLevel * 200;
    const currentLevelPoints = (currentLevel - 1) * 200;
    const progress = ((user.bounty_points - currentLevelPoints) / (pointsForNextLevel - currentLevelPoints)) * 100;
    const remainingPoints = Math.max(0, pointsForNextLevel - user.bounty_points);
    
    return {
      progress: Math.min(progress, 100),
      nextLevel: currentLevel + 1,
      remainingPoints,
    };
  };

  const getChallengeStatus = (userChallenge: UserChallenge) => {
    if (userChallenge.completed) {
      return <Badge className="bg-success text-white">مكتمل</Badge>;
    } else if (userChallenge.current_progress > 0) {
      return <Badge className="bg-blue-500 text-white">جاري التنفيذ</Badge>;
    } else {
      return <Badge variant="secondary">لم يبدأ</Badge>;
    }
  };

  const getChallengeColor = (userChallenge: UserChallenge) => {
    if (userChallenge.completed) return 'border-success bg-green-50';
    if (userChallenge.current_progress > 0) return 'border-blue-500 bg-blue-50';
    return 'border-muted bg-muted/20';
  };

  const getRewardIcon = (rewardType: string) => {
    switch (rewardType) {
      case 'free_prints':
        return 'fas fa-print';
      case 'discount':
        return 'fas fa-percentage';
      case 'digital_book':
        return 'fas fa-book';
      case 'physical_item':
        return 'fas fa-gift';
      default:
        return 'fas fa-star';
    }
  };

  const { progress, nextLevel, remainingPoints } = calculateLevelProgress();

  if (challengesLoading || rewardsLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-muted rounded w-1/3"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                    <div className="h-20 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">نظام المكافآت</h1>
          <p className="text-muted-foreground">اربح نقاط واستبدلها بمكافآت مذهلة</p>
        </div>

        {/* User Level & Stats */}
        <Card className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center ml-4">
                  <i className="fas fa-medal text-white text-2xl"></i>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-orange-900">طابع ماهر</h2>
                  <p className="text-sm text-orange-700">
                    المستوى <span className="arabic-nums font-bold">{user?.level || 1}</span>
                  </p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-sm text-orange-700">رصيدك الحالي</p>
                <p className="text-3xl font-bold text-orange-900 arabic-nums">
                  {user?.bounty_points?.toLocaleString('ar-EG') || '0'}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>التقدم للمستوى {nextLevel}</span>
                <span className="arabic-nums">{progress.toFixed(0)}٪</span>
              </div>
              <Progress value={progress} className="h-3" />
              <p className="text-xs text-muted-foreground mt-1">
                يتبقى <span className="arabic-nums font-medium">{remainingPoints.toLocaleString('ar-EG')}</span> نقطة للمستوى التالي
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الطباعات</p>
                <p className="text-lg font-bold arabic-nums">{user?.total_prints?.toLocaleString('ar-EG') || '0'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المشتريات</p>
                <p className="text-lg font-bold arabic-nums">{user?.total_purchases || '0'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">الإحالات</p>
                <p className="text-lg font-bold arabic-nums">{user?.total_referrals || '0'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Challenges */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center">
                <i className="fas fa-tasks text-blue-600 ml-2"></i>
                تحديات اليوم
              </h3>
              
              {userChallenges.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-calendar-check text-4xl text-muted-foreground mb-4"></i>
                  <p className="text-muted-foreground">لا توجد تحديات متاحة اليوم</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userChallenges.map((userChallenge) => (
                    <div
                      key={userChallenge.id}
                      className={`p-4 rounded-lg border-r-4 ${getChallengeColor(userChallenge)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{userChallenge.challenges.name}</h4>
                        {getChallengeStatus(userChallenge)}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {userChallenge.challenges.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 ml-3">
                          <Progress 
                            value={(userChallenge.current_progress / userChallenge.challenges.target_value) * 100} 
                            className="h-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span className="arabic-nums">{userChallenge.current_progress}/{userChallenge.challenges.target_value}</span>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-blue-500">
                          +{userChallenge.challenges.points_reward} نقطة
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Rewards Catalog */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center">
                <i className="fas fa-gift text-purple-600 ml-2"></i>
                كتالوج المكافآت
              </h3>
              
              <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
                {rewards.map((reward) => {
                  const canRedeem = user && user.bounty_points >= reward.points_cost && reward.available;
                  
                  return (
                    <Card
                      key={reward.id}
                      className={`border hover-lift cursor-pointer ${
                        canRedeem ? 'border-green-200' : 'border-muted opacity-75'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{reward.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {reward.description}
                            </p>
                          </div>
                          <i className={`${getRewardIcon(reward.reward_type)} text-lg ${
                            canRedeem ? 'text-green-600' : 'text-muted-foreground'
                          } mr-2`}></i>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`font-bold arabic-nums ${
                            canRedeem ? 'text-success' : 'text-muted-foreground'
                          }`}>
                            {reward.points_cost.toLocaleString('ar-EG')} نقطة
                          </span>
                          <Button
                            size="sm"
                            disabled={!canRedeem || redeemRewardMutation.isPending}
                            className={canRedeem ? 'bg-success hover:bg-success/90 text-white' : ''}
                            onClick={() => canRedeem && handleRedeemReward(reward.id, reward.points_cost)}
                          >
                            {canRedeem ? 'استبدل' : 'غير متاح'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Redemption History */}
        {redemptions.length > 0 && (
          <Card className="mt-6">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4 flex items-center">
                <i className="fas fa-history text-gray-600 ml-2"></i>
                تاريخ الاستبدال
              </h3>
              
              <div className="space-y-3">
                {redemptions.map((redemption) => (
                  <div
                    key={redemption.id}
                    className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <i className={`${getRewardIcon(redemption.rewards.reward_type)} text-accent ml-3`}></i>
                      <div>
                        <h4 className="font-medium text-sm">{redemption.rewards.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(redemption.created_at).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <Badge variant={redemption.status === 'used' ? 'default' : 'secondary'}>
                        {redemption.status === 'used' ? 'مستخدم' : 'متاح'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1 arabic-nums">
                        -{redemption.points_spent} نقطة
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      
      <BottomNav />
    </div>
  );
}
