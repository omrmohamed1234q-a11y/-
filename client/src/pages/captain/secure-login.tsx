import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Truck, Shield, Eye, EyeOff, LogIn } from 'lucide-react';

export default function CaptainSecureLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast({
        variant: "destructive",
        title: "بيانات ناقصة",
        description: "أدخل اسم المستخدم وكلمة المرور"
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/captain/secure-login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      if (!response.ok) {
        throw new Error(`خطأ في الخادم: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.user) {
        // Save captain session
        localStorage.setItem('captainAuth', JSON.stringify({
          user: result.user,
          token: result.token,
          loginTime: new Date().toISOString()
        }));

        toast({
          title: "تم تسجيل الدخول بنجاح! 🎉",
          description: `أهلاً وسهلاً ${result.user.full_name || result.user.fullName}`,
        });

        // Navigate to dashboard
        setTimeout(() => {
          navigate('/captain/dashboard');
        }, 1000);
        
      } else {
        throw new Error(result.error || 'فشل في تسجيل الدخول');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "خطأ في تسجيل الدخول",
        description: "تحقق من البيانات والاتصال وحاول مرة أخرى"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center mb-4 shadow-xl">
            <Truck className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            اطبعلي
          </h1>
          <p className="text-gray-600 mt-2 text-lg">دخول الكباتن</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-6">
            <CardTitle className="flex items-center gap-3 text-2xl text-center justify-center">
              <Shield className="h-6 w-6 text-blue-600" />
              دخول آمن
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-right text-lg font-medium">
                  اسم المستخدم
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="h-12 text-lg text-center border-2 focus:border-blue-500"
                  placeholder="captain"
                  disabled={loading}
                  data-testid="input-username"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-right text-lg font-medium">
                  كلمة المرور
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="h-12 text-lg text-center border-2 focus:border-blue-500 pl-12"
                    placeholder="123456"
                    disabled={loading}
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={loading}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <Button 
                type="submit" 
                disabled={loading || !formData.username || !formData.password}
                className="w-full h-14 text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300"
                data-testid="button-login"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري الدخول...
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <LogIn className="h-6 w-6" />
                    دخول
                  </div>
                )}
              </Button>
            </form>

            {/* Helper Text */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">
                بيانات تجريبية:
              </p>
              <p className="text-xs text-blue-600 font-mono bg-blue-50 py-2 px-4 rounded">
                captain / 123456
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            خدمة توصيل اطبعلي © 2025
          </p>
        </div>
      </div>
    </div>
  );
}