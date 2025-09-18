import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Gift } from 'lucide-react';

export default function RewardsManagement() {
  const { toast } = useToast();

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="rewards-management-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2" data-testid="page-title">
          إدارة المكافآت
        </h1>
        <p className="text-gray-600 dark:text-gray-400" data-testid="page-description">
          إدارة نظام المكافآت والتحديات للمستخدمين
        </p>
      </div>

      <Card data-testid="test-message-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            اختبار الصفحة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-green-600 text-lg font-semibold" data-testid="success-message">
              ✅ تم تحميل صفحة إدارة المكافآت بنجاح!
            </p>
            <p className="text-gray-600" data-testid="test-info">
              هذه رسالة اختبار للتأكد من أن الراوت يعمل بشكل صحيح.
            </p>
            <Button 
              onClick={() => toast({ title: "نجح الاختبار", description: "الصفحة تعمل بشكل طبيعي" })}
              data-testid="test-button"
            >
              اختبر التوست
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}