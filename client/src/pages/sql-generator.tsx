import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Copy, 
  Download, 
  ExternalLink, 
  CheckCircle, 
  Database, 
  Code,
  Settings,
  Users,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SQLResponse {
  success: boolean;
  type: string;
  description: string;
  sql: string;
  instructions: string[];
}

const SQLGenerator = () => {
  const [sqlScripts, setSqlScripts] = useState<Record<string, SQLResponse>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('full');
  const { toast } = useToast();

  const scriptTypes = [
    {
      id: 'full',
      title: 'الإعداد الكامل',
      description: 'جداول الأمان + حسابات تجريبية',
      icon: <Database className="h-4 w-4" />,
      color: 'bg-green-50 text-green-700 border-green-200'
    },
    {
      id: 'tables',
      title: 'الجداول فقط',
      description: 'إنشاء الجداول بدون بيانات',
      icon: <Settings className="h-4 w-4" />,
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      id: 'accounts',
      title: 'الحسابات التجريبية',
      description: 'بيانات تجريبية فقط',
      icon: <Users className="h-4 w-4" />,
      color: 'bg-purple-50 text-purple-700 border-purple-200'
    }
  ];

  const fetchSQL = async (type: string) => {
    setLoading(type);
    try {
      const response = await fetch(`/api/get-setup-sql?type=${type}`);
      const data = await response.json();
      
      if (data.success) {
        setSqlScripts(prev => ({
          ...prev,
          [type]: data
        }));
      } else {
        toast({
          title: "خطأ",
          description: data.message || "فشل في تحميل كود SQL",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الاتصال",
        description: "تعذر تحميل كود SQL",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "تم النسخ!",
        description: `تم نسخ كود SQL (${scriptTypes.find(s => s.id === type)?.title}) إلى الحافظة`,
      });
    } catch (error) {
      toast({
        title: "خطأ في النسخ",
        description: "تعذر نسخ النص إلى الحافظة",
        variant: "destructive"
      });
    }
  };

  const downloadSQL = (sql: string, type: string) => {
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supabase-setup-${type}.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "تم التحميل!",
      description: `تم تحميل ملف SQL`,
    });
  };

  const openSupabaseDashboard = () => {
    window.open('https://supabase.com/dashboard', '_blank');
  };

  useEffect(() => {
    // Load the default full script
    fetchSQL('full');
  }, []);

  const SqlDisplay = ({ type }: { type: string }) => {
    const script = sqlScripts[type];
    const scriptType = scriptTypes.find(s => s.id === type);
    
    if (loading === type) {
      return (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل كود SQL...</p>
        </div>
      );
    }

    if (!script) {
      return (
        <div className="text-center py-8">
          <Button onClick={() => fetchSQL(type)}>
            تحميل كود SQL
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {scriptType?.icon}
              {script.description}
            </h3>
            <p className="text-sm text-gray-600">{scriptType?.description}</p>
          </div>
          <Badge className={scriptType?.color}>
            {scriptType?.title}
          </Badge>
        </div>

        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            <strong>التعليمات:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              {script.instructions.map((instruction, index) => (
                <li key={index} className="text-sm">{instruction}</li>
              ))}
            </ol>
          </AlertDescription>
        </Alert>

        <div className="flex gap-2 mb-4">
          <Button 
            onClick={() => copyToClipboard(script.sql, type)}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            نسخ الكود
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => downloadSQL(script.sql, type)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            تحميل كملف
          </Button>
          
          <Button 
            variant="outline"
            onClick={openSupabaseDashboard}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            فتح Supabase
          </Button>
        </div>

        <div className="relative">
          <Textarea
            value={script.sql}
            readOnly
            className="font-mono text-sm min-h-[400px] resize-none"
            dir="ltr"
          />
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-xs">
              {script.sql.split('\n').length} سطر
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl" dir="rtl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">مولد كود SQL للإعداد</h1>
        <p className="text-gray-600">
          احصل على كود SQL جاهز لإنشاء جداول الأمان في Supabase
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {scriptTypes.map(type => (
          <Card 
            key={type.id} 
            className={`cursor-pointer transition-all ${
              activeTab === type.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => {
              setActiveTab(type.id);
              if (!sqlScripts[type.id]) {
                fetchSQL(type.id);
              }
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {type.icon}
                {type.title}
              </CardTitle>
              <CardDescription className="text-xs">
                {type.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">
                  {sqlScripts[type.id] ? 'محمّل' : 'غير محمّل'}
                </Badge>
                {sqlScripts[type.id] && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            كود SQL للإعداد
          </CardTitle>
          <CardDescription>
            انسخ الكود أدناه والصقه في Supabase Dashboard &gt; SQL Editor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              {scriptTypes.map(type => (
                <TabsTrigger 
                  key={type.id} 
                  value={type.id}
                  className="flex items-center gap-1"
                >
                  {type.icon}
                  <span className="hidden sm:inline">{type.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {scriptTypes.map(type => (
              <TabsContent key={type.id} value={type.id}>
                <SqlDisplay type={type.id} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Alert className="mt-6">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>نصيحة:</strong> بعد تنفيذ كود SQL في Supabase، يمكنك اختبار النظام في 
          <code className="bg-gray-100 px-1 rounded mx-1">/api-test</code> أو 
          <code className="bg-gray-100 px-1 rounded mx-1">/connectivity</code>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default SQLGenerator;