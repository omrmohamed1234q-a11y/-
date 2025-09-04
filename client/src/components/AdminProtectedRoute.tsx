import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      // Check for admin token in localStorage
      const adminAuth = localStorage.getItem('adminAuth');
      const adminToken = localStorage.getItem('adminToken');
      
      console.log('Checking admin auth:', { hasAuth: !!adminAuth, hasToken: !!adminToken });
      
      if (!adminAuth || !adminToken) {
        console.log('Missing admin auth or token');
        redirectToLogin();
        return;
      }

      // Parse admin data
      const adminData = JSON.parse(adminAuth);
      
      console.log('Admin data parsed:', adminData);
      
      // Check for different data structures
      const token = adminData.token || adminToken;
      const hasValidAdmin = adminData.admin || adminData.user || adminData.username;
      
      if (!hasValidAdmin || !token) {
        console.log('Invalid admin data structure');
        redirectToLogin();
        return;
      }

      console.log('Admin authentication successful - using stored token');
      setIsAuthenticated(true);
      
    } catch (error) {
      console.error('Admin auth check failed:', error);
      redirectToLogin();
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToLogin = () => {
    setTimeout(() => {
      window.location.href = '/admin/secure-login';
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">جاري التحقق من الهوية...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Alert className="border-red-600 bg-red-900 bg-opacity-80 backdrop-blur-lg">
            <Shield className="h-6 w-6 text-red-400" />
            <AlertDescription className="text-red-100">
              <div className="space-y-4">
                <div className="text-center">
                  <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-2">وصول غير مصرح به</h2>
                  <p className="text-sm leading-relaxed">
                    هذه الصفحة محمية وتتطلب تسجيل دخول إداري. سيتم إعادة توجيهك إلى صفحة تسجيل الدخول الآمنة.
                  </p>
                </div>
                
                <div className="bg-red-800 bg-opacity-50 p-3 rounded-lg">
                  <p className="text-xs text-red-200">
                    🔒 نظام الأمان: جميع المحاولات مسجلة ومراقبة
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}