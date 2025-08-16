import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import AuthCallback from "@/pages/auth-callback";
import Home from "@/pages/home";
import Print from "@/pages/print";
import Store from "@/pages/store";
import Rewards from "@/pages/rewards";
import Profile from "@/pages/profile";
import Achievements from "@/pages/achievements";
import Challenges from "@/pages/challenges";
import Leaderboard from "@/pages/leaderboard";

function Router() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Only show splash screen on initial load
    if (!loading) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Show splash screen first
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // Show loading if auth is still checking
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Show landing page if not authenticated
  if (!user) {
    return <Landing />;
  }

  // Show authenticated app
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/home" component={Home} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/print" component={Print} />
      <Route path="/store" component={Store} />
      <Route path="/rewards" component={Rewards} />
      <Route path="/profile" component={Profile} />
      <Route path="/achievements" component={Achievements} />
      <Route path="/challenges" component={Challenges} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background font-arabic text-foreground" dir="rtl">
          <Toaster />
          <Router />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
