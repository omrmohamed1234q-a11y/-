import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Trophy, Medal, Award, Star, Crown, Gem, 
  PrinterIcon, ShoppingBag, Users, Target, 
  Calendar, Zap, Lock, CheckCircle 
} from "lucide-react";
import type { Achievement, UserAchievement } from "@shared/schema";

interface AchievementWithProgress extends Achievement {
  userProgress?: UserAchievement;
  progressPercentage: number;
}

export default function AchievementsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: achievements, isLoading } = useQuery<AchievementWithProgress[]>({
    queryKey: ["/api/achievements", selectedCategory],
  });

  const { data: userStats } = useQuery<{
    totalAchievements: number;
    completedAchievements: number;
    totalPoints: number;
    currentLevel: number;
  }>({
    queryKey: ["/api/achievements/stats"],
  });

  const getBadgeIcon = (level: string, rarity: string | null) => {
    if (rarity === "legendary") return <Crown className="h-6 w-6 text-yellow-500" />;
    if (rarity === "epic") return <Gem className="h-6 w-6 text-purple-500" />;
    if (level === "platinum") return <Trophy className="h-6 w-6 text-blue-500" />;
    if (level === "gold") return <Medal className="h-6 w-6 text-yellow-600" />;
    if (level === "silver") return <Award className="h-6 w-6 text-gray-400" />;
    return <Star className="h-6 w-6 text-amber-600" />;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "printing": return PrinterIcon;
      case "purchases": return ShoppingBag;
      case "social": return Users;
      case "challenges": return Target;
      case "streaks": return Calendar;
      default: return Zap;
    }
  };

  const getBadgeColor = (level: string, rarity: string | null) => {
    if (rarity === "legendary") return "from-yellow-400 via-orange-500 to-red-500";
    if (rarity === "epic") return "from-purple-400 via-pink-500 to-indigo-500";
    if (level === "platinum") return "from-blue-400 to-cyan-500";
    if (level === "gold") return "from-yellow-400 to-amber-500";
    if (level === "silver") return "from-gray-300 to-gray-500";
    return "from-amber-400 to-orange-500";
  };

  const categories = [
    { id: "all", name: "الكل", nameEn: "All", icon: Star },
    { id: "printing", name: "الطباعة", nameEn: "Printing", icon: PrinterIcon },
    { id: "purchases", name: "المشتريات", nameEn: "Purchases", icon: ShoppingBag },
    { id: "social", name: "اجتماعي", nameEn: "Social", icon: Users },
    { id: "challenges", name: "التحديات", nameEn: "Challenges", icon: Target },
    { id: "streaks", name: "التتابع", nameEn: "Streaks", icon: Calendar },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">🏆 الإنجازات</h1>
          <p className="text-gray-600">اكتشف إنجازاتك واكسب جوائز مذهلة</p>
        </div>

        {/* Stats Overview */}
        {userStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="text-center">
              <CardContent className="p-4">
                <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{userStats.completedAchievements}</div>
                <div className="text-sm text-gray-600">إنجاز مكتمل</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{userStats.totalAchievements}</div>
                <div className="text-sm text-gray-600">إجمالي الإنجازات</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <Star className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{userStats.totalPoints.toLocaleString()}</div>
                <div className="text-sm text-gray-600">نقطة إنجاز</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <Crown className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{userStats.currentLevel}</div>
                <div className="text-sm text-gray-600">المستوى الحالي</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-1">
                  <IconComponent className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">{category.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements?.map((achievement) => {
                  const isCompleted = achievement.userProgress?.isCompleted;
                  const isSecret = achievement.isSecret && !isCompleted;
                  const IconComponent = getCategoryIcon(achievement.category);
                  
                  return (
                    <Card 
                      key={achievement.id} 
                      className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
                        isCompleted ? 'ring-2 ring-green-200 bg-gradient-to-br from-green-50 to-emerald-50' : 
                        isSecret ? 'opacity-75' : ''
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-full bg-gradient-to-r ${getBadgeColor(achievement.badgeLevel, achievement.rarity)}`}>
                              {isSecret ? (
                                <Lock className="h-6 w-6 text-white" />
                              ) : (
                                getBadgeIcon(achievement.badgeLevel, achievement.rarity)
                              )}
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {isSecret ? "إنجاز سري" : achievement.name}
                                {isCompleted && <CheckCircle className="h-5 w-5 text-green-500" />}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <IconComponent className="h-4 w-4 text-gray-500" />
                                <Badge variant="secondary" className="text-xs">
                                  {achievement.badgeLevel === "bronze" ? "برونزي" :
                                   achievement.badgeLevel === "silver" ? "فضي" :
                                   achievement.badgeLevel === "gold" ? "ذهبي" :
                                   achievement.badgeLevel === "platinum" ? "بلاتيني" : "ماسي"}
                                </Badge>
                                {achievement.rarity !== "common" && (
                                  <Badge variant="outline" className="text-xs">
                                    {achievement.rarity === "rare" ? "نادر" :
                                     achievement.rarity === "epic" ? "ملحمي" : "أسطوري"}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-gray-600 text-sm mb-4">
                          {isSecret ? "اكتشف هذا الإنجاز السري بالاستمرار في التقدم!" : achievement.description}
                        </p>
                        
                        {!isSecret && !isCompleted && achievement.userProgress && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>التقدم</span>
                              <span>{achievement.userProgress.progress} / {achievement.userProgress.maxProgress}</span>
                            </div>
                            <Progress value={achievement.progressPercentage} className="h-2" />
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-4 pt-3 border-t">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-semibold">
                              {(achievement.pointsReward || 0).toLocaleString()} نقطة
                            </span>
                            {(achievement.experienceReward || 0) > 0 && (
                              <>
                                <span className="text-gray-400">•</span>
                                <Zap className="h-4 w-4 text-blue-500" />
                                <span className="text-sm font-semibold">
                                  {achievement.experienceReward || 0} خبرة
                                </span>
                              </>
                            )}
                          </div>
                          {isCompleted && (
                            <Badge className="bg-green-100 text-green-800">
                              مكتمل
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
        {!achievements?.length && (
          <Card className="text-center p-8">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد إنجازات متاحة</h3>
            <p className="text-gray-600 mb-4">ابدأ بكسب النقاط والمشاركة في التحديات لفتح إنجازات جديدة</p>
            <Button className="bg-purple-600 hover:bg-purple-700">
              تصفح التحديات
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}