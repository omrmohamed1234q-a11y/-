import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Gift, 
  Star, 
  Trophy, 
  Target, 
  Zap, 
  Crown,
  Medal,
  Sparkles,
  TrendingUp,
  Users,
  Coins,
  Award,
  Calendar,
  Clock,
  ChevronRight,
  Eye,
  ShoppingBag,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const RewardTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'discount': return <Gift className="h-5 w-5" />;
    case 'free_prints': return <Zap className="h-5 w-5" />;
    case 'mobile_credit': return <Coins className="h-5 w-5" />;
    case 'voucher': return <Trophy className="h-5 w-5" />;
    default: return <Star className="h-5 w-5" />;
  }
};

const ChallengeTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'daily': return <Calendar className="h-5 w-5" />;
    case 'print': return <Zap className="h-5 w-5" />;
    case 'referral': return <Users className="h-5 w-5" />;
    case 'streak': return <Target className="h-5 w-5" />;
    default: return <Medal className="h-5 w-5" />;
  }
};

export default function RewardsNew() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);

  const handleGoHome = () => {
    setLocation('/home');
  };

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
        return [];
      }
    },
  });

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
        return [];
      }
    },
  });

  // Calculate user level and progress
  const currentPoints = user?.bountyPoints || 0;
  const currentLevel = Math.floor(currentPoints / 1000) + 1;
  const pointsToNextLevel = (currentLevel * 1000) - currentPoints;
  const progressPercentage = ((currentPoints % 1000) / 1000) * 100;

  const redeemReward = async (reward: Reward) => {
    if (!user) {
      toast({
        title: 'خطأ',
        description: 'يرجى تسجيل الدخول أولاً',
        variant: 'destructive'
      });
      return;
    }

    if (currentPoints < reward.points_cost) {
      toast({
        title: 'نقاط غير كافية',
        description: `تحتاج ${reward.points_cost - currentPoints} نقطة إضافية`,
        variant: 'destructive'
      });
      return;
    }

    try {
      // Here you would call the redeem API
      toast({
        title: '🎉 تم الاستبدال بنجاح!',
        description: `تم استبدال ${reward.name} بنجاح`,
      });
      
      // Update user points (في النسخة الحقيقية سيتم عبر API)
      console.log(`تم استبدال ${reward.name} بـ ${reward.points_cost} نقطة`);
      
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في استبدال المكافأة',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-orange-50">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-gradient-to-br from-orange-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-gradient-to-tr from-blue-200/30 to-green-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 space-y-8">
        
        {/* زر الرئيسية */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed top-6 left-6 z-50"
        >
          <Button
            onClick={handleGoHome}
            variant="outline"
            size="sm"
            className="bg-white/90 backdrop-blur-sm border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-lg transition-all duration-300 group"
          >
            <Home className="h-4 w-4 mr-2 text-blue-500 group-hover:text-blue-600 transition-colors" />
            <span className="text-blue-600 font-medium">الرئيسية</span>
          </Button>
        </motion.div>
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-6"
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-purple-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
            <div className="relative bg-white rounded-full p-8 shadow-2xl">
              <Crown className="h-16 w-16 text-orange-500 mx-auto animate-bounce" />
            </div>
          </div>
          
          <div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              مركز المكافآت
            </h1>
            <p className="text-xl text-gray-600 mt-4">اجمع النقاط واستبدلها بمكافآت رائعة!</p>
          </div>
        </motion.div>

        {/* User Stats Dashboard */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-2xl border-0">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                {/* User Avatar & Level */}
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Crown className="h-12 w-12 text-yellow-300" />
                    </div>
                    <Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black font-bold">
                      المستوى {currentLevel}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold">{user?.fullName || 'زائر'}</h3>
                  <p className="text-orange-100">مجموع النقاط: {currentPoints.toLocaleString('ar-EG')}</p>
                </div>

                {/* Progress Ring */}
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="8"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        strokeDasharray={`${progressPercentage * 2.51} 251`}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="100%" stopColor="#f59e0b" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{Math.round(progressPercentage)}%</span>
                    </div>
                  </div>
                  <p className="text-orange-100 mt-2">
                    {pointsToNextLevel} نقطة للمستوى التالي
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-5 w-5 text-yellow-300" />
                      <span className="text-sm">الطباعات</span>
                    </div>
                    <p className="text-2xl font-bold">{user?.totalPrints?.toLocaleString('ar-EG') || '0'}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5 text-green-300" />
                      <span className="text-sm">الإحالات</span>
                    </div>
                    <p className="text-2xl font-bold">{user?.totalReferrals || '0'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Active Challenges */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Target className="h-6 w-6" />
                  التحديات النشطة
                  <Badge variant="secondary" className="ml-auto bg-white/20 text-white">
                    {activeChallenges.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {challengesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                  </div>
                ) : activeChallenges.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">لا توجد تحديات متاحة حالياً</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeChallenges.map((challenge: Challenge, index: number) => (
                      <motion.div
                        key={challenge.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg transform scale-0 group-hover:scale-100 transition-transform duration-300"></div>
                        <div className="relative p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <ChallengeTypeIcon type={challenge.type} />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800">{challenge.name}</h4>
                                <p className="text-sm text-gray-600">{challenge.description}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant={challenge.is_daily ? "default" : "secondary"}>
                                {challenge.is_daily ? "يومي" : "عام"}
                              </Badge>
                              <p className="text-lg font-bold text-blue-600 mt-1">
                                +{challenge.points_reward} نقطة
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>الهدف: {challenge.target_value} {challenge.type}</span>
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Rewards Catalog */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Gift className="h-6 w-6" />
                  كتالوج المكافآت
                  <Badge variant="secondary" className="ml-auto bg-white/20 text-white">
                    {rewards.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {rewardsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                  </div>
                ) : rewards.length === 0 ? (
                  <div className="text-center py-8">
                    <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">لا توجد مكافآت متاحة حالياً</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {rewards.map((reward: Reward, index: number) => {
                      const canRedeem = currentPoints >= reward.points_cost && reward.available;
                      
                      return (
                        <motion.div
                          key={reward.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="group relative overflow-hidden"
                        >
                          <div className={`absolute inset-0 bg-gradient-to-r rounded-lg transform scale-0 group-hover:scale-100 transition-transform duration-300 ${
                            canRedeem 
                              ? 'from-green-500/10 to-emerald-500/10' 
                              : 'from-gray-500/10 to-gray-500/10'
                          }`}></div>
                          <div className={`relative p-4 border rounded-lg transition-all duration-300 ${
                            canRedeem 
                              ? 'border-green-200 hover:border-green-400 hover:shadow-lg' 
                              : 'border-gray-200 opacity-75'
                          }`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${
                                  canRedeem ? 'bg-green-100' : 'bg-gray-100'
                                }`}>
                                  <RewardTypeIcon type={reward.reward_type} />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-800">{reward.name}</h4>
                                  <p className="text-sm text-gray-600">{reward.description}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-lg font-bold ${
                                  canRedeem ? 'text-green-600' : 'text-gray-500'
                                }`}>
                                  {reward.points_cost} نقطة
                                </p>
                                {reward.limit_per_user && (
                                  <p className="text-xs text-gray-500">
                                    حد أقصى: {reward.limit_per_user}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge variant={reward.available ? "default" : "secondary"}>
                                {reward.available ? "متاح" : "غير متاح"}
                              </Badge>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedReward(reward);
                                    setShowRewardModal(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  تفاصيل
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => redeemReward(reward)}
                                  disabled={!canRedeem}
                                  className={canRedeem ? 'bg-green-600 hover:bg-green-700' : ''}
                                >
                                  <ShoppingBag className="h-4 w-4 mr-1" />
                                  استبدال
                                </Button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-blue-200" />
              <h3 className="text-xl font-bold mb-2">ارفع مستواك</h3>
              <p className="text-blue-100 mb-4">اطبع أكثر واجمع نقاط إضافية</p>
              <Button variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50">
                ابدأ الطباعة
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-green-200" />
              <h3 className="text-xl font-bold mb-2">ادع أصدقاءك</h3>
              <p className="text-green-100 mb-4">احصل على نقاط مقابل كل دعوة</p>
              <Button variant="secondary" className="bg-white text-green-600 hover:bg-green-50">
                مشاركة الرابط
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0 shadow-xl">
            <CardContent className="p-6 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-orange-200" />
              <h3 className="text-xl font-bold mb-2">مكافآت يومية</h3>
              <p className="text-orange-100 mb-4">استلم مكافأة تسجيل الدخول اليومي</p>
              <Button variant="secondary" className="bg-white text-orange-600 hover:bg-orange-50">
                استلام المكافأة
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Reward Details Modal */}
        <Dialog open={showRewardModal} onOpenChange={setShowRewardModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedReward && <RewardTypeIcon type={selectedReward.reward_type} />}
                تفاصيل المكافأة
              </DialogTitle>
            </DialogHeader>
            {selectedReward && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-bold">{selectedReward.name}</h3>
                  <p className="text-gray-600">{selectedReward.description}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span>التكلفة:</span>
                    <span className="font-bold text-orange-600">{selectedReward.points_cost} نقطة</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>النوع:</span>
                    <Badge>{selectedReward.reward_type}</Badge>
                  </div>
                  {selectedReward.limit_per_user && (
                    <div className="flex justify-between items-center">
                      <span>الحد الأقصى:</span>
                      <span>{selectedReward.limit_per_user} مرة</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowRewardModal(false)}
                    className="flex-1"
                  >
                    إغلاق
                  </Button>
                  <Button 
                    onClick={() => {
                      redeemReward(selectedReward);
                      setShowRewardModal(false);
                    }}
                    disabled={currentPoints < selectedReward.points_cost}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    استبدال الآن
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}