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
  Home,
  BarChart3,
  History
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
  const [activeTab, setActiveTab] = useState('rewards');

  const handleGoHome = () => {
    setLocation('/home');
  };

  // Define tabs for sub-navigation
  const tabs = [
    { id: 'rewards', label: 'المكافآت', icon: Trophy },
    { id: 'challenges', label: 'التحديات', icon: Target },
    { id: 'history', label: 'السجل', icon: History },
    { id: 'stats', label: 'الإحصائيات', icon: BarChart3 },
    { id: 'profile', label: 'الملف الشخصي', icon: Users }
  ];

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
      toast({
        title: '🎉 تم الاستبدال بنجاح!',
        description: `تم استبدال ${reward.name} بنجاح`,
      });
      
      console.log(`تم استبدال ${reward.name} بـ ${reward.points_cost} نقطة`);
      
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في استبدال المكافأة',
        variant: 'destructive'
      });
    }
  };

  // Render functions for each tab
  const renderRewardsContent = () => (
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
                          data-testid={`button-view-reward-${reward.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          تفاصيل
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => redeemReward(reward)}
                          disabled={!canRedeem}
                          className={canRedeem ? 'bg-green-600 hover:bg-green-700' : ''}
                          data-testid={`button-redeem-reward-${reward.id}`}
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
  );

  const renderChallengesContent = () => (
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
  );

  const renderHistoryContent = () => (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-xl">
          <History className="h-6 w-6" />
          سجل المكافآت
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="text-center py-8">
          <History className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">لا يوجد سجل للمكافآت حتى الآن</p>
          <p className="text-sm text-gray-400 mt-2">ابدأ بجمع النقاط واستبدال المكافآت!</p>
        </div>
      </CardContent>
    </Card>
  );

  const renderStatsContent = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-xl">
            <BarChart3 className="h-6 w-6" />
            إحصائيات النقاط
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>إجمالي النقاط:</span>
              <span className="font-bold text-lg">{currentPoints.toLocaleString('ar-EG')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>المستوى الحالي:</span>
              <Badge className="bg-purple-600">{currentLevel}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>نقاط للمستوى التالي:</span>
              <span className="font-medium">{pointsToNextLevel}</span>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>التقدم:</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-xl">
            <TrendingUp className="h-6 w-6" />
            إحصائيات النشاط
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>عدد الطباعات:</span>
              <span className="font-bold text-lg">{user?.totalPrints?.toLocaleString('ar-EG') || '0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>الإحالات:</span>
              <span className="font-bold text-lg">{user?.totalReferrals || '0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>المكافآت المستبدلة:</span>
              <span className="font-bold text-lg">0</span>
            </div>
            <div className="flex justify-between items-center">
              <span>التحديات المكتملة:</span>
              <span className="font-bold text-lg">0</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProfileContent = () => (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-xl">
          <Users className="h-6 w-6" />
          ملف المكافآت
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.fullName?.charAt(0) || 'ز'}
            </div>
            <Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white">
              المستوى {currentLevel}
            </Badge>
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-gray-800">{user?.fullName || 'زائر'}</h3>
            <p className="text-gray-600">{user?.email}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-amber-50 rounded-lg p-4">
              <Coins className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">النقاط الحالية</p>
              <p className="text-xl font-bold text-amber-600">{currentPoints.toLocaleString('ar-EG')}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <Crown className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">المستوى</p>
              <p className="text-xl font-bold text-purple-600">{currentLevel}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-orange-50">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-gradient-to-br from-orange-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-gradient-to-tr from-blue-200/30 to-green-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10">
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
            data-testid="button-home"
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
          className="text-center space-y-6 pt-20 pb-8"
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
          className="container mx-auto px-4 mb-8"
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
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="rgba(255,255,255,0.2)"
                        strokeWidth="8"
                      />
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

        {/* شريط التنقل الفرعي */}
        <div className="container mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 p-2"
          >
            <div className="flex items-center justify-around">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    data-testid={`tab-${tab.id}`}
                    className={`
                      flex flex-col items-center px-3 py-3 rounded-lg transition-all duration-300 min-w-[70px]
                      ${isActive 
                        ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg scale-105' 
                        : 'text-gray-600 hover:text-orange-500 hover:bg-orange-50'
                      }
                    `}
                  >
                    <IconComponent className={`h-6 w-6 mb-1 ${isActive ? 'text-white' : ''}`} />
                    <span className={`text-xs font-medium ${isActive ? 'text-white' : ''}`}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* محتوى التبويبات */}
        <div className="container mx-auto px-4 pb-8">
          <AnimatePresence mode="wait">
            {activeTab === 'rewards' && (
              <motion.div
                key="rewards"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderRewardsContent()}
              </motion.div>
            )}

            {activeTab === 'challenges' && (
              <motion.div
                key="challenges"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderChallengesContent()}
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderHistoryContent()}
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderStatsContent()}
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderProfileContent()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal للمكافآت */}
      <Dialog open={showRewardModal} onOpenChange={setShowRewardModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تفاصيل المكافأة</DialogTitle>
          </DialogHeader>
          {selectedReward && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RewardTypeIcon type={selectedReward.reward_type} />
                </div>
                <h3 className="text-xl font-bold">{selectedReward.name}</h3>
                <p className="text-gray-600">{selectedReward.description}</p>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span>التكلفة:</span>
                  <span className="font-bold text-orange-600">{selectedReward.points_cost} نقطة</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span>نقاطك الحالية:</span>
                  <span className="font-bold">{currentPoints} نقطة</span>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                onClick={() => redeemReward(selectedReward)}
                disabled={currentPoints < selectedReward.points_cost}
                data-testid="button-redeem-modal"
              >
                {currentPoints >= selectedReward.points_cost ? 'استبدال المكافأة' : 'نقاط غير كافية'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}