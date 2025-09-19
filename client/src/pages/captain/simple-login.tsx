import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Truck } from 'lucide-react';

export default function CaptainSimpleLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });

  const handleLogin = () => {
    // Simple hardcoded validation - no server calls needed
    if (formData.username === 'captain' && formData.password === '123456') {
      // Save simple session
      localStorage.setItem('captainAuth', JSON.stringify({
        user: { id: 'captain-001', username: 'captain', full_name: 'كابتن التوصيل' },
        token: 'simple-token-' + Date.now(),
        loginTime: new Date().toISOString()
      }));

      toast({
        title: "تم الدخول بنجاح! 🎉",
        description: "أهلاً بك كابتن"
      });

      // Go to dashboard
      setTimeout(() => navigate('/captain/dashboard'), 1000);
    } else {
      toast({
        variant: "destructive",
        title: "خطأ في البيانات",
        description: "اسم المستخدم: captain | كلمة المرور: 123456"
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      handleLogin();
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
            <Truck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-green-800">اطبعلي - الكباتن</h1>
          <p className="text-gray-600 mt-2">دخول سريع</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-right font-medium mb-2">اسم المستخدم</label>
            <Input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="w-full h-12 text-center text-lg border-2"
              placeholder="captain"
              disabled={loading}
              data-testid="input-username"
            />
          </div>

          <div>
            <label className="block text-right font-medium mb-2">كلمة المرور</label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full h-12 text-center text-lg border-2"
              placeholder="123456"
              disabled={loading}
              data-testid="input-password"
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 text-lg font-bold bg-green-600 hover:bg-green-700"
            data-testid="button-login"
          >
            {loading ? 'جاري الدخول...' : 'دخول'}
          </Button>
        </form>

        {/* Helper */}
        <div className="text-center mt-6 p-4 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700 font-mono">
            captain / 123456
          </p>
        </div>
      </div>
    </div>
  );
}