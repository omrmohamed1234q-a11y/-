import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';

interface Challenge {
  id: string;
  name: string;
  description: string;
  currentProgress: number;
  targetValue: number;
  pointsReward: number;
  completed: boolean;
  status: 'completed' | 'in_progress' | 'not_started';
}

interface Reward {
  id: string;
  name: string;
  pointsCost: number;
  rewardType: 'free_prints' | 'discount' | 'digital_book';
  icon: string;
  available: boolean;
}

// Mock data - replace with Supabase data
const mockChallenges: Challenge[] = [
  {
    id: '1',
    name: 'اطبع ٥ صفحات',
    description: 'اكمل طباعة 5 صفحات اليوم',
    currentProgress: 5,
    targetValue: 5,
    pointsReward: 50,
    completed: true,
    status: 'completed',
  },
  {
    id: '2',
    name: 'امسح وثيقة ضوئياً',
    description: 'استخدم خاصية المسح الضوئي',
    currentProgress: 1,
    targetValue: 1,
    pointsReward: 30,
    completed: false,
    status: 'in_progress',
  },
  {
    id: '3',
    name: 'ادع صديقاً للانضمام',
    description: 'شارك التطبيق مع الأصدقاء',
    currentProgress: 0,
    targetValue: 1,
    pointsReward: 100,
    completed: false,
    status: 'not_started',
  },
];

const mockRewards: Reward[] = [
  {
    id: '1',
    name: 'طباعة مجانية (١٠ صفحات)',
    pointsCost: 200,
    rewardType: 'free_prints',
    icon: 'fas fa-print',
    available: true,
  },
  {
    id: '2',
    name: 'كوبون خصم ٢٠٪',
    pointsCost: 500,
    rewardType: 'discount',
    icon: 'fas fa-percentage',
    available: true,
  },
  {
    id: '3',
    name: 'كتاب رقمي مجاني',
    pointsCost: 1000,
    rewardType: 'digital_book',
    icon: 'fas fa-book',
    available: false,
  },
];

export default function RewardsGamification() {
  const { user } = useAuth();
  
  const userPoints = user?.bounty_points || 1250;
  const userLevel = user?.level || 7;
  const totalPrints = user?.total_prints || 1427;
  const totalPurchases = user?.total_purchases || 89;
  const totalReferrals = user?.total_referrals || 12;

  // Calculate progress to next level
  const pointsForNextLevel = (userLevel * 200);
  const currentLevelPoints = ((userLevel - 1) * 200);
  const progressToNext = ((userPoints - currentLevelPoints) / (pointsForNextLevel - currentLevelPoints)) * 100;
  const remainingPoints = pointsForNextLevel - userPoints;

  const handleRedeemReward = (rewardId: string, pointsCost: number) => {
    if (userPoints >= pointsCost) {
      // TODO: Implement reward redemption via Supabase
      console.log('Redeeming reward:', rewardId);
    }
  };

  const getChallengeStatus = (challenge: Challenge) => {
    if (challenge.completed) {
      return <Badge className="bg-success text-white">مكتمل</Badge>;
    } else if (challenge.status === 'in_progress') {
      return <Badge className="bg-blue-500 text-white">جاري التنفيذ</Badge>;
    } else {
      return <Badge variant="secondary">لم يبدأ</Badge>;
    }
  };

  const getChallengeColor = (challenge: Challenge) => {
    if (challenge.completed) return 'border-success bg-green-50';
    if (challenge.status === 'in_progress') return 'border-blue-500 bg-blue-50';
    return 'border-muted bg-muted/20';
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-6">
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-100 border-orange-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center ml-3">
                <i className="fas fa-trophy text-white text-xl"></i>
              </div>
              <div>
                <h2 className="text-xl font-bold text-orange-900">نظام المكافآت</h2>
                <p className="text-sm text-orange-700">اربح نقاط واستبدلها بمكافآت مذهلة</p>
              </div>
            </div>
            <div className="text-left">
              <p className="text-sm text-orange-700">رصيدك الحالي</p>
              <p className="text-2xl font-bold text-orange-900 arabic-nums">
                {userPoints.toLocaleString('ar-EG')}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* User Level & Progress */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-medal text-white text-2xl"></i>
                  </div>
                  <h3 className="font-bold text-lg">طابع ماهر</h3>
                  <p className="text-sm text-muted-foreground">
                    المستوى <span className="arabic-nums font-bold">{userLevel}</span>
                  </p>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>التقدم للمستوى التالي</span>
                    <span className="arabic-nums">{Math.min(progressToNext, 100).toFixed(0)}٪</span>
                  </div>
                  <Progress value={Math.min(progressToNext, 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    يتبقى <span className="arabic-nums font-medium">{remainingPoints > 0 ? remainingPoints.toLocaleString('ar-EG') : 0}</span> نقطة للمستوى التالي
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>إجمالي الطباعات</span>
                    <span className="arabic-nums font-bold">{totalPrints.toLocaleString('ar-EG')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>المشتريات المكتملة</span>
                    <span className="arabic-nums font-bold">{totalPurchases}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>الإحالات الناجحة</span>
                    <span className="arabic-nums font-bold">{totalReferrals}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Daily Challenges */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center">
                  <i className="fas fa-tasks text-blue-600 ml-2"></i>
                  تحديات اليوم
                </h3>
                
                <div className="space-y-4">
                  {mockChallenges.map((challenge) => (
                    <div
                      key={challenge.id}
                      className={`p-4 rounded-lg border-r-4 ${getChallengeColor(challenge)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{challenge.name}</h4>
                        {getChallengeStatus(challenge)}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 ml-3">
                          <Progress 
                            value={(challenge.currentProgress / challenge.targetValue) * 100} 
                            className="h-2"
                          />
                        </div>
                        <span className="text-sm font-bold text-blue-500">
                          +{challenge.pointsReward} نقطة
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Rewards Catalog */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center">
                  <i className="fas fa-gift text-purple-600 ml-2"></i>
                  كتالوج المكافآت
                </h3>
                
                <div className="space-y-4">
                  {mockRewards.map((reward) => {
                    const canRedeem = userPoints >= reward.pointsCost && reward.available;
                    
                    return (
                      <Card
                        key={reward.id}
                        className={`border hover-lift cursor-pointer ${
                          canRedeem ? 'border-green-200' : 'border-muted opacity-75'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">{reward.name}</h4>
                            <i className={`${reward.icon} ${
                              canRedeem ? 'text-green-600' : 'text-muted-foreground'
                            }`}></i>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`font-bold arabic-nums ${
                              canRedeem ? 'text-success' : 'text-muted-foreground'
                            }`}>
                              {reward.pointsCost.toLocaleString('ar-EG')} نقطة
                            </span>
                            <Button
                              size="sm"
                              disabled={!canRedeem}
                              className={canRedeem ? 'bg-success hover:bg-success/90 text-white' : ''}
                              onClick={() => canRedeem && handleRedeemReward(reward.id, reward.pointsCost)}
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
        </CardContent>
      </Card>
    </section>
  );
}
