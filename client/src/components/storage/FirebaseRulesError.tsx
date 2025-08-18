import { AlertTriangle, ExternalLink, Copy } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface FirebaseRulesErrorProps {
  error: string;
  onRetry?: () => void;
}

export function FirebaseRulesError({ error, onRetry }: FirebaseRulesErrorProps) {
  const { toast } = useToast();

  const storageRules = `rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read/write for all users (development only)
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}`;

  const copyRules = () => {
    navigator.clipboard.writeText(storageRules);
    toast({
      title: "تم النسخ",
      description: "تم نسخ قواعد Firebase Storage إلى الحافظة",
    });
  };

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5" />
          خطأ في رفع الملف
        </CardTitle>
        <CardDescription className="text-red-600">
          {error}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>مطلوب تحديث إعدادات Firebase Storage</AlertTitle>
          <AlertDescription>
            يبدو أن قواعد Firebase Storage Rules تمنع رفع الملفات. اتبع الخطوات التالية لحل المشكلة:
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h4 className="font-semibold text-sm">خطوات الحل:</h4>
          
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              افتح{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal underline"
                onClick={() => window.open('https://console.firebase.google.com/', '_blank')}
              >
                Firebase Console
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </li>
            <li>اذهب إلى Storage ← Rules</li>
            <li>استبدل القواعد الحالية بالقواعد التالية:</li>
          </ol>

          <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono relative">
            <pre className="whitespace-pre-wrap">{storageRules}</pre>
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 left-2"
              onClick={copyRules}
            >
              <Copy className="w-3 h-3 ml-1" />
              نسخ
            </Button>
          </div>

          <ol className="list-decimal list-inside space-y-2 text-sm" start={4}>
            <li>اضغط على "Publish" لحفظ التغييرات</li>
            <li>انتظر بضع ثوان ثم جرب رفع الملف مرة أخرى</li>
          </ol>
        </div>

        <div className="flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} variant="outline">
              إعادة المحاولة
            </Button>
          )}
          <Button 
            onClick={() => window.open('https://console.firebase.google.com/', '_blank')}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <ExternalLink className="w-4 h-4 ml-2" />
            افتح Firebase Console
          </Button>
        </div>

        <Alert>
          <AlertTitle>ملاحظة مهمة</AlertTitle>
          <AlertDescription>
            هذه القواعد مخصصة للتطوير فقط. في بيئة الإنتاج، يجب استخدام قواعد أمان أكثر تقييداً.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}