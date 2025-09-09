import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  HardDrive, 
  Trash2, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Database,
  FolderOpen,
  Gauge
} from "lucide-react";

interface StorageInfo {
  totalLimit?: number;
  totalUsed: number;
  available?: number;
  usagePercentage: number;
  unlimited: boolean;
  formattedLimit: string;
  formattedUsed: string;
  formattedAvailable: string;
  usageInDrive: number;
  usageInTrash: number;
}

interface CleanupResult {
  success: boolean;
  spaceFeed: number;
  beforeUsage: number;
  afterUsage: number;
  actionsPerformed: string[];
  formattedSpaceFeed: string;
  message?: string;
  error?: string;
}

interface CleanupOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  danger: boolean;
  daysKept: number | 'custom';
  requiresInput?: boolean;
}

export default function StorageDashboard() {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  const [customLoading, setCustomLoading] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<CleanupResult | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [cleanupOptions, setCleanupOptions] = useState<CleanupOption[]>([]);
  const [customDays, setCustomDays] = useState('');
  
  const { toast } = useToast();

  const fetchStorageInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/drive/storage-info');
      const data = await response.json();
      
      if (data.success) {
        setStorageInfo(data.storage);
        setWarnings(data.warnings || []);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "خطأ في فحص المساحة",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCleanupOptions = async () => {
    try {
      const response = await fetch('/cleanup-options');
      const data = await response.json();
      
      if (data.success) {
        setCleanupOptions(data.options);
      }
    } catch (error: any) {
      console.error('Failed to fetch cleanup options:', error);
    }
  };

  const performCustomCleanup = async (timeOption: string, customDays?: string) => {
    setCustomLoading(true);
    try {
      const response = await fetch('/cleanup-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeOption, customDays })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "تم التنظيف المخصص بنجاح",
          description: data.message,
          variant: "default"
        });
        
        // Refresh storage info
        setTimeout(fetchStorageInfo, 1000);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "خطأ في التنظيف المخصص",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCustomLoading(false);
    }
  };

  const performCleanup = async (targetGB: number = 1) => {
    setCleanupLoading(true);
    try {
      const targetBytes = targetGB * 1024 * 1024 * 1024; // Convert GB to bytes
      
      const response = await fetch('/api/drive/free-space', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetBytes })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLastCleanup(data);
        toast({
          title: "تم التنظيف بنجاح",
          description: data.message,
          variant: "default"
        });
        
        // Refresh storage info
        setTimeout(fetchStorageInfo, 1000);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "خطأ في التنظيف",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCleanupLoading(false);
    }
  };

  const performEmergencyReset = async () => {
    const confirmReset = window.confirm(
      '⚠️ تحذير: هذا سيحذف معظم الملفات المخزنة!\n\nهذه العملية خطيرة وغير قابلة للتراجع. هل أنت متأكد؟'
    );
    
    if (!confirmReset) return;
    
    const confirmCode = window.prompt(
      'أدخل كود التأكيد للمتابعة:\nRESTORAGE_RESET_NOW'
    );
    
    if (confirmCode !== 'RESET_STORAGE_NOW') {
      toast({
        title: "كود التأكيد خاطئ",
        description: "تم إلغاء العملية",
        variant: "destructive"
      });
      return;
    }

    setEmergencyLoading(true);
    try {
      const response = await fetch('/api/drive/emergency-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmCode })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "تم تصفير المساحة",
          description: data.message,
          variant: "default"
        });
        
        // Refresh storage info
        setTimeout(fetchStorageInfo, 2000);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "خطأ في التصفير",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setEmergencyLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageInfo();
    fetchCleanupOptions();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchStorageInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 75) return "text-orange-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-green-600";
  };

  const getUsageBadgeVariant = (percentage: number) => {
    if (percentage >= 90) return "destructive";
    if (percentage >= 75) return "default";
    return "secondary";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6" dir="rtl">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Database className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              لوحة إدارة مساحة التخزين
            </h1>
          </div>
          <p className="text-gray-600">
            مراقبة وإدارة مساحة جوجل درايف للنظام
          </p>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <div className="space-y-1">
                {warnings.map((warning, index) => (
                  <div key={index} className="text-orange-800">{warning}</div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Storage Info Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              إحصائيات المساحة
              <Button
                variant="outline" 
                size="sm"
                onClick={fetchStorageInfo}
                disabled={loading}
                className="mr-auto text-white border-white hover:bg-white hover:text-blue-600"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {storageInfo ? (
              <div className="space-y-6">
                {/* Usage Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {storageInfo.formattedUsed}
                    </div>
                    <div className="text-sm text-gray-600">مساحة مستخدمة</div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {storageInfo.formattedAvailable}
                    </div>
                    <div className="text-sm text-gray-600">مساحة متاحة</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">
                      {storageInfo.formattedLimit}
                    </div>
                    <div className="text-sm text-gray-600">إجمالي المساحة</div>
                  </div>
                </div>

                {/* Progress Bar */}
                {!storageInfo.unlimited && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">نسبة الاستخدام</span>
                      <Badge variant={getUsageBadgeVariant(storageInfo.usagePercentage)}>
                        {storageInfo.usagePercentage.toFixed(1)}%
                      </Badge>
                    </div>
                    <Progress 
                      value={storageInfo.usagePercentage} 
                      className="h-3"
                    />
                  </div>
                )}

                {/* Detailed Breakdown */}
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-blue-500" />
                      ملفات الدرايف
                    </span>
                    <span className="font-medium">
                      {Math.round(storageInfo.usageInDrive / 1024 / 1024)} ميجابايت
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4 text-red-500" />
                      سلة المحذوفات
                    </span>
                    <span className="font-medium">
                      {Math.round(storageInfo.usageInTrash / 1024 / 1024)} ميجابايت
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                <p>جاري تحميل معلومات المساحة...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cleanup Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Standard Cleanup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <HardDrive className="h-5 w-5" />
                تنظيف عادي
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                ينظف الملفات المؤقتة القديمة وسلة المحذوفات لتوفير مساحة
              </p>
              
              <div className="space-y-2">
                <Button
                  onClick={() => performCleanup(1)}
                  disabled={cleanupLoading}
                  className="w-full"
                  variant="outline"
                >
                  {cleanupLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <HardDrive className="h-4 w-4 ml-2" />
                  )}
                  تنظيف سريع (1 جيجابايت)
                </Button>
                
                <Button
                  onClick={() => performCleanup(5)}
                  disabled={cleanupLoading}
                  className="w-full"
                  variant="outline"
                >
                  {cleanupLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                  ) : (
                    <HardDrive className="h-4 w-4 ml-2" />
                  )}
                  تنظيف متقدم (5 جيجابايت)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Custom Cleanup Options */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600">
                <CheckCircle className="h-5 w-5" />
                خيارات مخصصة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                اختر المدة التي تريد الاحتفاظ بها
              </p>
              
              {cleanupOptions.length > 0 ? (
                <div className="space-y-2">
                  {cleanupOptions.map((option) => (
                    <div key={option.id}>
                      {option.requiresInput ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="عدد الأيام"
                              value={customDays}
                              onChange={(e) => setCustomDays(e.target.value)}
                              className="flex-1 px-3 py-2 border rounded text-sm"
                              min="0"
                              step="0.1"
                            />
                            <Button
                              onClick={() => performCustomCleanup('custom', customDays)}
                              disabled={customLoading || !customDays}
                              size="sm"
                              variant="outline"
                              className="px-3"
                            >
                              {option.icon}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={() => performCustomCleanup(option.id)}
                          disabled={customLoading}
                          variant={option.danger ? "destructive" : "outline"}
                          className="w-full text-sm"
                          size="sm"
                        >
                          {customLoading ? (
                            <RefreshCw className="h-3 w-3 animate-spin ml-1" />
                          ) : (
                            <span className="ml-1">{option.icon}</span>
                          )}
                          {option.name}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-sm text-gray-500">
                  جاري تحميل الخيارات...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Reset */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                تصفير الطوارئ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  ⚠️ خطر: سيحذف الملفات الأقدم من يوم واحد (24 ساعة)
                </AlertDescription>
              </Alert>
              
              <Button
                onClick={performEmergencyReset}
                disabled={emergencyLoading}
                variant="destructive"
                className="w-full"
              >
                {emergencyLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <Trash2 className="h-4 w-4 ml-2" />
                )}
                تصفير كامل للمساحة
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Last Cleanup Results */}
        {lastCleanup && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                نتائج آخر تنظيف
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-lg font-semibold text-green-700">
                  تم توفير: {lastCleanup.formattedSpaceFeed}
                </div>
                
                {lastCleanup.actionsPerformed.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 text-green-700">الإجراءات المنفذة:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {lastCleanup.actionsPerformed.map((action, index) => (
                        <li key={index} className="text-green-600">{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 space-y-1">
          <div>نظام إدارة المساحة | اطبعلي</div>
          <div>التحديث التلقائي كل 30 ثانية</div>
        </div>
      </div>
    </div>
  );
}