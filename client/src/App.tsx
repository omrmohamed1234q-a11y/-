import { Switch, Route, Router } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ProgressProvider } from "@/contexts/ProgressContext";
import { DetailedProgress } from "@/components/progress/DetailedProgress";
// import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, lazy } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import NotFound from "@/pages/not-found";
import EnhancedLanding from "@/pages/enhanced-landing";
import Signup from "@/pages/auth/signup";
import AdminSignup from "@/pages/auth/admin-signup";
import AuthCallback from "@/pages/auth-callback";
import SecureAdminLogin from "@/pages/auth/secure-admin-login";
import Home from "@/pages/home-new";
import Print from "@/pages/print";
import Store from "@/pages/store";
import RewardsNew from "@/pages/rewards-new";
import Profile from "@/pages/profile";
import Payment from "@/pages/payment";
import Scan from "@/pages/scan";
import AdminDashboard from "@/pages/admin/dashboard-new";
import AdminProfile from "@/pages/admin/admin-profile";
import AdminProducts from "@/pages/admin-products";
import AdminInventory from "@/pages/admin/inventory";
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
import OrdersManagementEnhanced from '@/pages/admin/orders-management-enhanced';
import AdminOrders from '@/pages/admin/orders';
import OrderTrackingEnhanced from '@/pages/order-tracking-enhanced';
import OrderTrackingTalabatStyle from '@/pages/order-tracking-talabat-style';
import OrdersPage from "@/pages/orders";
import TestSignup from "@/pages/test-signup";
import Checkout from "@/pages/checkout";
import OrderTracking from "@/pages/order-tracking";
import DriversManagement from "@/pages/admin/drivers";
import AdminPartners from "@/pages/admin/partners";
import SecurityManagement from "@/pages/admin/security-management";
import RewardsManagement from "@/pages/admin/rewards-management";
import QuickAccess from "@/pages/quick-access";
import TestAnnouncements from "@/pages/test-announcements";
import ArticlePage from "@/pages/article";
import SecurityTest from "@/pages/security-test";
import SetupComplete from "@/pages/setup-complete";
import ApiConnectionTest from "@/pages/api-connection-test";
import ConnectivityDashboard from "@/pages/connectivity-dashboard";
import SQLGenerator from "@/pages/sql-generator";
import PaymobTestPage from "@/pages/paymob-test";
import PaymobSetupPage from "@/pages/paymob-setup";
import LocationTest from "@/pages/location-test";
import SecureSecurityDashboard from '@/pages/admin/secure-security-dashboard';
import SecurityAccess from '@/pages/admin/security-access';
import TwoFactorSettings from '@/pages/admin/two-factor-settings';
import MainAdmin from '@/pages/admin/main-admin';
import ApiDocumentation from '@/pages/admin/api-documentation';
import TermsManagement from '@/pages/admin/terms-management';
import PrivacyPolicyManagement from '@/pages/admin/privacy-policy-management';
import WebSocketTest from '@/pages/websocket-test';
import MapsTest from '@/pages/maps-test';
import DriverLocationTest from '@/pages/driver-location-test';
import PaymentSuccess from '@/pages/payment-success';
import DonationsPage from '@/pages/donations';
import TermsAndConditions from '@/pages/terms-and-conditions';
import PrivacyPolicy from '@/pages/privacy-policy';
import SmartNotifications from '@/pages/admin/SmartNotifications';
import { AdminProtectedRoute } from '@/components/AdminProtectedRoute';
import CaptainSimpleLogin from '@/pages/captain/simple-login';
import CaptainDashboard from '@/pages/captain/dashboard';
import StorageDashboard from '@/pages/storage-dashboard';


function AppRouter() {
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
      <Router>
        <Switch>
          <Route path="/auth/signup" component={Signup} />
          <Route path="/auth/admin-signup" component={AdminSignup} />
          <Route path="/auth/callback" component={AuthCallback} />
          
          {/* Hidden secure routes - direct access only */}
          <Route path="/admin/secure-login" component={SecureAdminLogin} />
          <Route path="/secure-admin-login" component={SecureAdminLogin} />
          <Route path="/captain/secure-login" component={CaptainSimpleLogin} />
          <Route path="/captain/login" component={CaptainSimpleLogin} />
          <Route path="/captain/dashboard" component={CaptainDashboard} />
          <Route path="/admin" component={() => <AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
          <Route path="/admin/profile" component={() => <AdminProtectedRoute><AdminProfile /></AdminProtectedRoute>} />
          <Route path="/admin/store" component={() => <AdminProtectedRoute><AdminStore /></AdminProtectedRoute>} />
          <Route path="/admin/products" component={() => <AdminProtectedRoute><AdminProducts /></AdminProtectedRoute>} />
          <Route path="/admin-products" component={() => <AdminProtectedRoute><AdminProducts /></AdminProtectedRoute>} />
          <Route path="/admin/inventory" component={() => <AdminProtectedRoute><AdminInventory /></AdminProtectedRoute>} />
          <Route path="/admin/teachers-corner" component={() => <AdminProtectedRoute><TeachersCorner /></AdminProtectedRoute>} />
          <Route path="/admin/users" component={() => <AdminProtectedRoute><AdminUsers /></AdminProtectedRoute>} />
          <Route path="/admin/coupons" component={() => <AdminProtectedRoute><AdminCoupons /></AdminProtectedRoute>} />
          <Route path="/admin/inquiries" component={() => <AdminProtectedRoute><AdminInquiries /></AdminProtectedRoute>} />
          <Route path="/admin/announcements" component={() => <AdminProtectedRoute><AdminAnnouncements /></AdminProtectedRoute>} />
          <Route path="/admin/reports" component={() => <AdminProtectedRoute><SimpleAnalytics /></AdminProtectedRoute>} />
          <Route path="/admin/orders" component={() => <AdminProtectedRoute><AdminOrders /></AdminProtectedRoute>} />
          <Route path="/admin/partners" component={() => <AdminProtectedRoute><AdminPartners /></AdminProtectedRoute>} />
          <Route path="/admin/security" component={() => <AdminProtectedRoute><SecurityManagement /></AdminProtectedRoute>} />
          <Route path="/admin/security-access" component={() => <AdminProtectedRoute><SecurityAccess /></AdminProtectedRoute>} />
          <Route path="/admin/security-dashboard" component={() => <AdminProtectedRoute><SecureSecurityDashboard /></AdminProtectedRoute>} />
          <Route path="/admin/two-factor-settings" component={() => <AdminProtectedRoute><TwoFactorSettings /></AdminProtectedRoute>} />
          <Route path="/admin/api-documentation" component={() => <AdminProtectedRoute><ApiDocumentation /></AdminProtectedRoute>} />
          <Route path="/admin/terms-management" component={() => <AdminProtectedRoute><TermsManagement /></AdminProtectedRoute>} />
          <Route path="/admin/privacy-policy-management" component={() => <AdminProtectedRoute><PrivacyPolicyManagement /></AdminProtectedRoute>} />
          <Route path="/admin/smart-notifications" component={() => <AdminProtectedRoute><SmartNotifications /></AdminProtectedRoute>} />
          <Route path="/quick-access" component={QuickAccess} />

          <Route path="/test-signup" component={TestSignup} />
          <Route path="/cloudinary-test" component={CloudinaryTest} />
          <Route path="/websocket-test" component={WebSocketTest} />
          <Route path="/maps-test" component={MapsTest} />
          <Route path="/driver-location-test" component={DriverLocationTest} />
          <Route path="/security-test" component={SecurityTest} />
          <Route path="/setup-complete" component={SetupComplete} />
          <Route path="/api-test" component={ApiConnectionTest} />
          <Route path="/connectivity" component={ConnectivityDashboard} />
          <Route path="/sql-generator" component={SQLGenerator} />
          <Route path="/paymob-test" component={PaymobTestPage} />
          <Route path="/paymob-setup" component={PaymobSetupPage} />

          <Route path="/article/:id" component={ArticlePage} />
          <Route path="/donations" component={DonationsPage} />
          <Route path="/terms-and-conditions" component={TermsAndConditions} />
          <Route path="/terms" component={TermsAndConditions} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          
          <Route path="/" component={EnhancedLanding} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // Show authenticated app
  return (
    <Router>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/home" component={Home} />
        <Route path="/test-announcements" component={TestAnnouncements} />
        <Route path="/auth/callback" component={AuthCallback} />
        <Route path="/print" component={Print} />
        <Route path="/scan" component={Scan} />
        <Route path="/store" component={Store} />
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/orders" component={OrdersPage} />
        <Route path="/rewards" component={RewardsNew} />
        <Route path="/profile" component={Profile} />
        <Route path="/payment" component={Payment} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/order-tracking/:id" component={OrderTracking} />
        <Route path="/order-tracking-enhanced/:orderNumber?" component={OrderTrackingTalabatStyle} />
        <Route path="/student/teachers" component={StudentTeachers} />
        <Route path="/donations" component={DonationsPage} />
        
        {/* Admin routes - available for authenticated users too */}
        <Route path="/admin" component={() => <AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
        <Route path="/admin/profile" component={() => <AdminProtectedRoute><AdminProfile /></AdminProtectedRoute>} />
        <Route path="/admin/store" component={() => <AdminProtectedRoute><AdminStore /></AdminProtectedRoute>} />
        <Route path="/admin/products" component={() => <AdminProtectedRoute><AdminProducts /></AdminProtectedRoute>} />
        <Route path="/admin-products" component={() => <AdminProtectedRoute><AdminProducts /></AdminProtectedRoute>} />
        <Route path="/admin/teachers-corner" component={() => <AdminProtectedRoute><TeachersCorner /></AdminProtectedRoute>} />
        <Route path="/admin/users" component={() => <AdminProtectedRoute><AdminUsers /></AdminProtectedRoute>} />
        <Route path="/admin/coupons" component={() => <AdminProtectedRoute><AdminCoupons /></AdminProtectedRoute>} />
        <Route path="/admin/inquiries" component={() => <AdminProtectedRoute><AdminInquiries /></AdminProtectedRoute>} />
        <Route path="/admin/announcements" component={() => <AdminProtectedRoute><AdminAnnouncements /></AdminProtectedRoute>} />
        <Route path="/admin/reports" component={() => <AdminProtectedRoute><SimpleAnalytics /></AdminProtectedRoute>} />
        <Route path="/admin/orders" component={() => <AdminProtectedRoute><AdminOrders /></AdminProtectedRoute>} />
        <Route path="/admin/partners" component={() => <AdminProtectedRoute><AdminPartners /></AdminProtectedRoute>} />
        <Route path="/admin/security" component={() => <AdminProtectedRoute><SecurityManagement /></AdminProtectedRoute>} />
        <Route path="/admin/security-access" component={() => <AdminProtectedRoute><SecurityAccess /></AdminProtectedRoute>} />
        <Route path="/admin/security-dashboard" component={() => <AdminProtectedRoute><SecureSecurityDashboard /></AdminProtectedRoute>} />
        <Route path="/admin/two-factor-settings" component={() => <AdminProtectedRoute><TwoFactorSettings /></AdminProtectedRoute>} />
        <Route path="/admin/api-documentation" component={() => <AdminProtectedRoute><ApiDocumentation /></AdminProtectedRoute>} />
        <Route path="/admin/apis" component={() => <AdminProtectedRoute><ApiDocumentation /></AdminProtectedRoute>} />
        <Route path="/admin/terms-management" component={() => <AdminProtectedRoute><TermsManagement /></AdminProtectedRoute>} />
        <Route path="/admin/privacy-policy-management" component={() => <AdminProtectedRoute><PrivacyPolicyManagement /></AdminProtectedRoute>} />
        <Route path="/admin/rewards-management" component={() => <AdminProtectedRoute><RewardsManagement /></AdminProtectedRoute>} />
        <Route path="/admin/storage-dashboard" component={() => <AdminProtectedRoute><StorageDashboard /></AdminProtectedRoute>} />

        
        {/* Driver routes - New Professional System */}
        
        {/* Secure login routes - available always */}
        <Route path="/admin/secure-login" component={SecureAdminLogin} />
        <Route path="/secure-admin-login" component={SecureAdminLogin} />
        <Route path="/captain/secure-login" component={CaptainSecureLogin} />
        <Route path="/captain/dashboard" component={CaptainDashboard} />
        
        <Route path="/test-signup" component={TestSignup} />
        <Route path="/cloudinary-test" component={CloudinaryTest} />
        <Route path="/websocket-test" component={WebSocketTest} />
        <Route path="/maps-test" component={MapsTest} />
        <Route path="/driver-location-test" component={DriverLocationTest} />
        <Route path="/paymob-test" component={PaymobTestPage} />
        <Route path="/paymob-setup" component={PaymobSetupPage} />
        <Route path="/location-test" component={LocationTest} />
        <Route path="/connectivity" component={ConnectivityDashboard} />
        <Route path="/sql-generator" component={SQLGenerator} />
        <Route path="/article/:id" component={ArticlePage} />
        
        {/* Terms and Privacy Policy pages - available for authenticated users */}
        <Route path="/terms-and-conditions" component={TermsAndConditions} />
        <Route path="/terms" component={TermsAndConditions} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProgressProvider>
        <div className="min-h-screen bg-background font-arabic text-foreground" dir="rtl">
          <Toaster />
          <AppRouter />
          
          {/* 🎯 GLOBAL PROGRESS OVERLAY: Shows detailed progress for all operations */}
          <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <DetailedProgress 
              className="bg-white dark:bg-gray-900 border shadow-lg rounded-lg p-4"
              showSteps={true}
              showTimeEstimate={true}
            />
          </div>
        </div>
      </ProgressProvider>
    </QueryClientProvider>
  );
}

export default App;
