import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import ChatBot from "@/components/ChatBot";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/auth/login";
import Signup from "@/pages/auth/signup";
import AdminSignup from "@/pages/auth/admin-signup";
import AuthCallback from "@/pages/auth-callback";
import Home from "@/pages/home-new";
import Print from "@/pages/print";
import Store from "@/pages/store";
import Rewards from "@/pages/rewards";
import Profile from "@/pages/profile";
import Payment from "@/pages/payment";
import AdminDashboard from "@/pages/admin/dashboard-new";
import AdminProducts from "@/pages/admin-products";
import AdminStore from "@/pages/admin/store";
import TeachersCorner from "@/pages/admin/teachers-corner";
import CloudinaryTest from "@/pages/cloudinary-test";
import StudentTeachers from "@/pages/student/teachers";
import AdminUsers from "@/pages/admin/users";
import AdminCoupons from "@/pages/admin/coupons";
import AdminInquiries from "@/pages/admin/inquiries";
import OrdersManagement from "@/pages/admin/orders-management";
import TestSignup from "@/pages/test-signup";
import Checkout from "@/pages/checkout";
import OrderTracking from "@/pages/order-tracking";


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
    return (
      <Switch>
        <Route path="/auth/login" component={Login} />
        <Route path="/auth/signup" component={Signup} />
        <Route path="/auth/admin-signup" component={AdminSignup} />
        <Route path="/auth/callback" component={AuthCallback} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/store" component={AdminStore} />
        <Route path="/admin/products" component={AdminProducts} />
        <Route path="/admin-products" component={AdminProducts} />
        <Route path="/admin/teachers-corner" component={TeachersCorner} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/coupons" component={AdminCoupons} />
        <Route path="/admin/inquiries" component={AdminInquiries} />
        <Route path="/test-signup" component={TestSignup} />
        <Route path="/cloudinary-test" component={CloudinaryTest} />
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Show authenticated app
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/home" component={Home} />
        <Route path="/auth/callback" component={AuthCallback} />
        <Route path="/print" component={Print} />
        <Route path="/store" component={Store} />
        <Route path="/rewards" component={Rewards} />
        <Route path="/profile" component={Profile} />
        <Route path="/payment" component={Payment} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/order-tracking/:id" component={OrderTracking} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/store" component={AdminStore} />
        <Route path="/admin/products" component={AdminProducts} />
        <Route path="/admin-products" component={AdminProducts} />
        <Route path="/admin/teachers-corner" component={TeachersCorner} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/coupons" component={AdminCoupons} />
        <Route path="/admin/inquiries" component={AdminInquiries} />
        <Route path="/admin/orders" component={OrdersManagement} />
        <Route path="/student/teachers" component={StudentTeachers} />
        <Route path="/test-signup" component={TestSignup} />
        <Route path="/cloudinary-test" component={CloudinaryTest} />
        <Route component={NotFound} />
      </Switch>
      <ChatBot />
    </>
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
