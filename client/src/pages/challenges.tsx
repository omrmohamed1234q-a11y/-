import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, Clock, Trophy, Star, Target, Users, 
  ShoppingBag, PrinterIcon, Zap, Gift, CheckCircle2, 
  PlayCircle, Timer
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Challenge, UserChallenge } from "@shared/schema";

interface ChallengeWithProgress extends Challenge {
  userProgress?: UserChallenge;
  progressPercentage: number;
  timeRemaining: string;
  isExpired: boolean;
}

export default function ChallengesPage() {
  const [selectedType, setSelectedType] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: challenges, isLoading } = useQuery<ChallengeWithProgress[]>({
    queryKey: ["/api/challenges", selectedType],
  });

  const joinChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      return await apiRequest(`/api/challenges/${challengeId}/join`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      toast({
        title: "تم الانضمام للتحدي!",
        description: "بدأت رحلتك في هذا التحدي. حظًا موفقًا!",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "فشل في الانضمام للتحدي. حاول مرة أخرى.",
        variant: "destructive",
      });
    },
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "hard": return "bg-red-100 text-red-800";
      case "expert": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "سهل";
      case "medium": return "متوسط";
      case "hard": return "صعب";
      case "expert": return "خبير";
      default: return "غير محدد";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "printing": return PrinterIcon;
      case "shopping": return ShoppingBag;
      case "social": return Users;
      case "learning": return Target;
      default: return Zap;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "daily": return Calendar;
      case "weekly": return Clock;
      case "monthly": return Timer;
      case "special": return Star;
      default: return Target;
    }
  };

  const challengeTypes = [
    { id: "all", name: "الكل", nameEn: "All", icon: Target },
    { id: "daily", name: "يومي", nameEn: "Daily", icon: Calendar },
    { id: "weekly", name: "أسبوعي", nameEn: "Weekly", icon: Clock },
    { id: "monthly", name: "شهري", nameEn: "Monthly", icon: Timer },
    { id: "special", name: "خاص", nameEn: "Special", icon: Star },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-cyan-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">🎯 التحديات</h1>
          <p className="text-gray-600">انضم للتحديات المثيرة واكسب نقاط وجوائز رائعة</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <CardContent className="p-4">
              <PlayCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {challenges?.filter(c => c.userProgress?.status === "active").length || 0}
              </div>
              <div className="text-sm text-gray-600">تحدي نشط</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {challenges?.filter(c => c.userProgress?.completed).length || 0}
              </div>
              <div className="text-sm text-gray-600">تحدي مكتمل</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {challenges?.reduce((sum, c) => sum + (c.userProgress?.pointsEarned || 0), 0) || 0}
              </div>
              <div className="text-sm text-gray-600">نقطة مكتسبة</div>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Target className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">{challenges?.length || 0}</div>
              <div className="text-sm text-gray-600">تحدي متاح</div>
            </CardContent>
          </Card>
        </div>

        {/* Challenge Type Tabs */}
        <Tabs value={selectedType} onValueChange={setSelectedType}>
          <TabsList className="grid w-full grid-cols-5">
            {challengeTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <TabsTrigger key={type.id} value={type.id} className="flex items-center gap-1">
                  <IconComponent className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">{type.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {challengeTypes.map((type) => (
            <TabsContent key={type.id} value={type.id}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {challenges?.map((challenge) => {
                  const isActive = challenge.userProgress?.status === "active";
                  const isCompleted = challenge.userProgress?.completed;
                  const canJoin = !challenge.userProgress && challenge.active && !challenge.isExpired;
                  const CategoryIcon = getCategoryIcon(challenge.category);
                  const TypeIcon = getTypeIcon(challenge.type);
                  
                  return (
                    <Card 
                      key={challenge.id} 
                      className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
                        isCompleted ? 'ring-2 ring-green-200 bg-gradient-to-br from-green-50 to-emerald-50' :
                        isActive ? 'ring-2 ring-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50' :
                        challenge.isExpired ? 'opacity-60' : ''
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full text-white">
                              <CategoryIcon className="h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {challenge.name}
                                {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <TypeIcon className="h-4 w-4 text-gray-500" />
                                <Badge variant="secondary" className="text-xs">
                                  {challenge.type === "daily" ? "يومي" :
                                   challenge.type === "weekly" ? "أسبوعي" :
                                   challenge.type === "monthly" ? "شهري" : "خاص"}
                                </Badge>
                                <Badge className={`text-xs ${getDifficultyColor(challenge.difficulty)}`}>
                                  {getDifficultyText(challenge.difficulty)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          {!challenge.isExpired && (
                            <div className="text-right text-xs text-gray-500">
                              <Clock className="h-4 w-4 inline mr-1" />
                              {challenge.timeRemaining}
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-gray-600 text-sm mb-4">{challenge.description}</p>
                        
                        {(isActive || isCompleted) && challenge.userProgress && (
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span>التقدم</span>
                              <span>{challenge.userProgress.currentProgress} / {challenge.userProgress.targetProgress}</span>
                            </div>
                            <Progress value={challenge.progressPercentage} className="h-2" />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-semibold">
                                {challenge.pointsReward.toLocaleString()}
                              </span>
                            </div>
                            {(challenge.experienceReward || 0) > 0 && (
                              <div className="flex items-center gap-1">
                                <Zap className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-semibold">
                                  {challenge.experienceReward || 0}
                                </span>
                              </div>
                            )}
                            {challenge.bonusReward && (
                              <div className="flex items-center gap-1">
                                <Gift className="h-4 w-4 text-purple-500" />
                                <span className="text-xs text-purple-600">مكافأة إضافية</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-3 border-t">
                          {canJoin && (
                            <Button 
                              onClick={() => joinChallengeMutation.mutate(challenge.id)}
                              disabled={joinChallengeMutation.isPending}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white"
                              data-testid={`button-join-challenge-${challenge.id}`}
                            >
                              {joinChallengeMutation.isPending ? "جاري الانضمام..." : "انضم للتحدي"}
                            </Button>
                          )}
                          {isActive && (
                            <Badge className="bg-blue-100 text-blue-800">
                              نشط
                            </Badge>
                          )}
                          {isCompleted && (
                            <Badge className="bg-green-100 text-green-800">
                              مكتمل ✓
                            </Badge>
                          )}
                          {challenge.isExpired && (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                              منتهي الصلاحية
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Empty State */}
        {!challenges?.length && (
          <Card className="text-center p-8">
            <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد تحديات متاحة</h3>
            <p className="text-gray-600 mb-4">تابعنا للحصول على تحديات جديدة ومثيرة قريبًا</p>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              تصفح الإنجازات
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}