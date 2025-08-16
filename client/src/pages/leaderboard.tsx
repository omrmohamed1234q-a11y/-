import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award, Crown, TrendingUp, Users, Calendar, Star } from "lucide-react";
import type { Leaderboard, LeaderboardEntry, User } from "@shared/schema";

interface LeaderboardWithEntries extends Leaderboard {
  entries: (LeaderboardEntry & { user: User })[];
}

export default function LeaderboardPage() {
  const [selectedCategory, setSelectedCategory] = useState("points");

  const { data: leaderboards, isLoading } = useQuery<LeaderboardWithEntries[]>({
    queryKey: ["/api/leaderboards", selectedCategory],
  });

  const { data: userRank } = useQuery<{ rank: number; score: number }>({
    queryKey: ["/api/leaderboards/my-rank", selectedCategory],
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Trophy className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <Award className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600";
    if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-500";
    if (rank === 3) return "bg-gradient-to-r from-amber-400 to-amber-600";
    if (rank <= 10) return "bg-gradient-to-r from-blue-400 to-blue-600";
    return "bg-gradient-to-r from-gray-400 to-gray-600";
  };

  const categories = [
    { id: "points", name: "النقاط", nameEn: "Points", icon: Star },
    { id: "prints", name: "الطباعة", nameEn: "Prints", icon: TrendingUp },
    { id: "challenges", name: "التحديات", nameEn: "Challenges", icon: Users },
    { id: "streaks", name: "التتابع", nameEn: "Streaks", icon: Calendar },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">🏆 لوحة المتصدرين</h1>
          <p className="text-gray-600">تنافس مع أفضل المستخدمين واكسب جوائز مذهلة</p>
        </div>

        {/* User's Current Rank */}
        {userRank && (
          <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-full">
                    {getRankIcon(userRank.rank)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">ترتيبك الحالي</h3>
                    <p className="text-white/80">في فئة {categories.find(c => c.id === selectedCategory)?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">#{userRank.rank}</div>
                  <div className="text-white/80">{userRank.score.toLocaleString()} نقطة</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-4">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                  <IconComponent className="h-4 w-4" />
                  <span className="hidden sm:inline">{category.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-4">
              {leaderboards?.map((leaderboard) => (
                <Card key={leaderboard.id} className="overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-indigo-600" />
                          {leaderboard.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{leaderboard.description}</p>
                      </div>
                      <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                        {leaderboard.type === "weekly" ? "أسبوعي" : 
                         leaderboard.type === "monthly" ? "شهري" : "الكل"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-1">
                      {leaderboard.entries?.map((entry, index) => (
                        <div
                          key={entry.id}
                          className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                            entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-amber-50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getRankBadgeColor(entry.rank)}`}>
                              {entry.rank <= 3 ? getRankIcon(entry.rank) : entry.rank}
                            </div>
                            <Avatar className="h-10 w-10">
                              <AvatarImage src="/placeholder-avatar.jpg" />
                              <AvatarFallback>{entry.user.fullName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-gray-900">{entry.user.fullName}</p>
                              <p className="text-sm text-gray-600">@{entry.user.username}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">{entry.score.toLocaleString()}</p>
                            <p className="text-sm text-gray-600">
                              {category.id === "points" ? "نقطة" :
                               category.id === "prints" ? "طباعة" :
                               category.id === "challenges" ? "تحدي" : "يوم"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          ))}
        </Tabs>

        {/* Empty State */}
        {!leaderboards?.length && (
          <Card className="text-center p-8">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">لا توجد لوحات متصدرين حاليًا</h3>
            <p className="text-gray-600 mb-4">ابدأ بكسب النقاط والمشاركة في التحديات لترى ترتيبك</p>
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              شاهد التحديات المتاحة
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}