import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/layout/header';
import BottomNav from '@/components/layout/bottom-nav';
import QuickActions from '@/components/sections/quick-actions';
import PrintQueue from '@/components/sections/print-queue';
import MarketplaceSection from '@/components/sections/marketplace';
import TeacherCorner from '@/components/sections/teacher-corner';
import RewardsGamification from '@/components/sections/rewards-gamification';
import AIStudio from '@/components/sections/ai-studio';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="min-h-screen">
        <QuickActions userPoints={user?.bounty_points} />
        <PrintQueue />
        <MarketplaceSection />
        <TeacherCorner />
        <RewardsGamification />
        <AIStudio />
      </main>
      
      <BottomNav />
    </div>
  );
}
