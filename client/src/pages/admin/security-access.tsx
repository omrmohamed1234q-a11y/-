import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

export default function SecurityAccess() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Check password
    if (password === 'S3519680s') {
      toast({
        title: "✅ تم منح الوصول",
        description: "مرحباً بك في لوحة الأمان المتقدمة",
      });
      
      // Redirect to security dashboard
      setTimeout(() => {
        setLocation('/admin/security-dashboard');
      }, 1000);
    } else {
      toast({
        title: "❌ كلمة مرور خاطئة",
        description: "يرجى إدخال كلمة المرور الصحيحة",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-10 w-10 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            لوحة الأمان المتقدمة
          </CardTitle>
          <CardDescription>
            يتطلب الوصول كلمة مرور خاصة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAccess} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-right flex items-center gap-2">
                <Lock className="h-4 w-4" />
                كلمة المرور
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="أدخل كلمة المرور..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="text-right"
                dir="ltr"
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading || !password.trim()}
            >
              {loading ? 'جاري التحقق...' : 'دخول لوحة الأمان'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/admin')}
              className="text-sm"
            >
              العودة إلى لوحة الإدارة
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}