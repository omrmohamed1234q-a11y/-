import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import ChatBot from "@/components/ChatBot";
import NotFound from "@/pages/not-found";
import EnhancedLanding from "@/pages/enhanced-landing";
import Login from "@/pages/auth/login";
import Signup from "@/pages/auth/signup";
import AdminSignup from "@/pages/auth/admin-signup";
import AuthCallback from "@/pages/auth-callback";
import SecureAdminLogin from "@/pages/auth/secure-admin-login";
import SecureAdminLoginV2 from "@/pages/auth/secure-admin-login-v2";
import SimpleAdminLogin from "@/pages/auth/simple-admin-login";
import SecureDriverLogin from "@/pages/auth/secure-driver-login";
import Home from "@/pages/home-new";
import Print from "@/pages/print";
import Store from "@/pages/store";
import Rewards from "@/pages/rewards";
import ProfileSimple from "@/pages/profile-simple";
import Payment from "@/pages/payment";
import Scan from "@/pages/scan";
import AdminDashboard from "@/pages/admin/dashboard-new";
import AdminProfile from "@/pages/admin/admin-profile";
import AdminProducts from "@/pages/admin-products";
import AdminStore from "@/pages/admin/store";
import TeachersCorner from "@/pages/admin/teachers-corner";
import CloudinaryTest from "@/pages/cloudinary-test";
import CheckoutPage from "@/pages/checkout";
import StudentTeachers from "@/pages/student/teachers";
import AdminUsers from "@/pages/admin/users";
import AdminCoupons from "@/pages/admin/coupons";
import AdminInquiries from "@/pages/admin/inquiries";
import AdminAnnouncements from "@/pages/admin/announcements";
import SimpleAnalytics from "@/pages/admin/simple-analytics";
import OrdersManagement from "@/pages/admin/orders-management";
import TestSignup from "@/pages/test-signup";
import Checkout from "@/pages/checkout";
import OrderTracking from "@/pages/order-tracking";
import DriverLogin from "@/pages/driver/driver-login";
import DriverDashboard from "@/pages/driver/driver-dashboard";
import DriversManagement from "@/pages/admin/drivers";
import AdminPartners from "@/pages/admin/partners";
import SecurityManagement from "@/pages/admin/security-management";
import QuickAccess from "@/pages/quick-access";
import TestAnnouncements from "@/pages/test-announcements";
import ArticlePage from "@/pages/article";
import SecurityTest from "@/pages/security-test";
import SetupComplete from "@/pages/setup-complete";
import ApiConnectionTest from "@/pages/api-connection-test";
import ConnectivityDashboard from "@/pages/connectivity-dashboard";
import SQLGenerator from "@/pages/sql-generator";
import SecureSecurityDashboard from '@/pages/admin/secure-security-dashboard';
import SecurityAccess from '@/pages/admin/security-access';
import SecureDriverControl from '@/pages/driver/secure-driver-control';
import MainAdmin from '@/pages/admin/main-admin';
import { AdminProtectedRoute } from '@/components/AdminProtectedRoute';

// Admin redirect component for unauthorized access
function AdminRedirect() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    console.log('AdminRedirect: redirecting to /admin/secure-login');
    // Add a small delay to ensure proper navigation
    const timer = setTimeout(() => {
      setLocation('/admin/secure-login');
    }, 100);
    return () => clearTimeout(timer);
  }, [setLocation]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">جاري التوجيه للصفحة الآمنة...</p>
      </div>
    </div>
  );
}


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
        
        {/* Hidden secure routes - direct access only */}
        <Route path="/admin/secure-login">
          <SimpleAdminLogin />
        </Route>
        <Route path="/secure-admin-login">
          <SimpleAdminLogin />
        </Route>
        <Route path="/driver/secure-login">
          <SecureDriverLogin />
        </Route>
        <Route path="/secure-driver-login">
          <SecureDriverLogin />
        </Route>
        
        {/* Admin routes - all redirect to secure login if not authenticated */}
        <Route path="/admin">
          {() => {
            console.log('Redirecting /admin to /admin/secure-login');
            window.location.href = '/admin/secure-login';
            return <div>جاري التحويل...</div>;
          }}
        </Route>
        <Route path="/admin/profile">
          {() => {
            window.location.replace('/admin/secure-login');
            return null;
          }}
        </Route>
        <Route path="/admin/store">
          {() => {
            window.location.replace('/admin/secure-login');
            return null;
          }}
        </Route>
        <Route path="/admin/products">
          {() => {
            window.location.replace('/admin/secure-login');
            return null;
          }}
        </Route>
        <Route path="/admin-products">
          {() => {
            window.location.replace('/admin/secure-login');
            return null;
          }}
        </Route>
        <Route path="/admin/teachers-corner">
          {() => {
            window.location.replace('/admin/secure-login');
            return null;
          }}
        </Route>
        <Route path="/admin/users">
          {() => {
            window.location.replace('/admin/secure-login');
            return null;
          }}
        </Route>
        <Route path="/admin/coupons">
          {() => {
            window.location.replace('/admin/secure-login');
            return null;
          }}
        </Route>
        <Route path="/admin/inquiries">
          {() => {
            window.location.replace('/admin/secure-login');
            return null;
          }}
        </Route>
        <Route path="/admin/announcements">
          {() => {
            window.location.replace('/admin/secure-login');
            return null;
          }}
        </Route>
        <Route path="/admin/reports">
          {() => {
            window.location.replace('/admin/secure-login');
            return null;
          }}
        </Route>
        <Route path="/admin/orders">
          {() => {
            window.location.replace('/admin/secure-login');
            return null;
          }}
        </Route>
        <Route path="/admin/partners">
          {() => {
            window.location.replace('/admin/secure-login');
            return null;
          }}
        </Route>
        <Route path="/admin/security">
          {() => {
            window.location.replace('/admin/secure-login');
            return null;
          }}
        </Route>
        <Route path="/admin/security-access">
          {() => {
            window.location.replace('/admin/secure-login');
            return null;
          }}
        </Route>
        <Route path="/admin/security-dashboard">
          {() => {
            window.location.replace('/admin/secure-login');
            return null;
          }}
        </Route>
        <Route path="/driver/secure-dashboard" component={SecureDriverControl} />

        <Route path="/driver/dashboard" component={SecureDriverControl} />
        <Route path="/quick-access" component={QuickAccess} />

        <Route path="/test-signup" component={TestSignup} />
        <Route path="/cloudinary-test" component={CloudinaryTest} />
        <Route path="/security-test" component={SecurityTest} />
        <Route path="/setup-complete" component={SetupComplete} />
        <Route path="/api-test" component={ApiConnectionTest} />
        <Route path="/connectivity" component={ConnectivityDashboard} />
        <Route path="/sql-generator" component={SQLGenerator} />
        <Route path="/article/:id" component={ArticlePage} />
        <Route path="/" component={EnhancedLanding} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Show authenticated app
  return (
    <>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/home" component={Home} />
        <Route path="/test-announcements" component={TestAnnouncements} />
        <Route path="/auth/callback" component={AuthCallback} />
        <Route path="/print" component={Print} />
        <Route path="/scan" component={Scan} />
        <Route path="/store" component={Store} />
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/rewards" component={Rewards} />
        <Route path="/profile" component={ProfileSimple} />
        <Route path="/payment" component={Payment} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/order-tracking/:id" component={OrderTracking} />
        <Route path="/student/teachers" component={StudentTeachers} />
        <Route path="/test-signup" component={TestSignup} />
        <Route path="/cloudinary-test" component={CloudinaryTest} />
        <Route path="/article/:id" component={ArticlePage} />
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
