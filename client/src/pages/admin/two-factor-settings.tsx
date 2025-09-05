import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Smartphone, Key, Check, X, RefreshCw, AlertTriangle, QrCode } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface TwoFactorStatus {
  isEnabled: boolean;
  hasBackupCodes: boolean;
  lastUsed: string | null;
}

interface TwoFactorSetupData {
  secret: string;
  qrCode: string;
  manualEntryKey: string;
  backupCodes?: string[];
}

const TwoFactorSettings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<TwoFactorStatus>({ isEnabled: false, hasBackupCodes: false, lastUsed: null });
  const [setupData, setSetupData] = useState<TwoFactorSetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [error, setError] = useState<string>('');
  
  // Get current user from localStorage or session
  const [userId, setUserId] = useState<string>('');
  const [userType, setUserType] = useState<'admin' | 'driver'>('admin');

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        // Try admin auth first
        const adminAuth = localStorage.getItem('adminAuth');
        if (adminAuth) {
          const adminData = JSON.parse(adminAuth);
          const user = adminData.admin || adminData.user;
          if (user && user.id) {
            setUserId(user.id);
            setUserType('admin');
            return;
          }
        }
        
        // Fallback to security user for drivers
        const securityUser = localStorage.getItem('securityUser');
        if (securityUser) {
          const userData = JSON.parse(securityUser);
          if (userData.id) {
            setUserId(userData.id);
            setUserType(userData.role === 'admin' ? 'admin' : 'driver');
            return;
          }
        }
        
        setError('لم يتم العثور على بيانات المستخدم. يرجى تسجيل الدخول مرة أخرى.');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('خطأ في تحميل بيانات المستخدم');
    }
  }, []);

  useEffect(() => {
    if (userId) {
      loadTwoFactorStatus();
    }
  }, [userId]);

  const loadTwoFactorStatus = async () => {
    try {
      // Get the appropriate token based on user type
      let token = '';
      if (userType === 'admin') {
        token = localStorage.getItem('adminToken') || '';
      } else {
        token = localStorage.getItem('securityToken') || '';
      }
      
      const response = await fetch(`/api/auth/2fa/status/${userId}/${userType}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error loading 2FA status:', error);
    }
  };

  const startSetup = async () => {
    setLoading(true);
    try {
      // Get the appropriate token based on user type
      let token = '';
      if (userType === 'admin') {
        token = localStorage.getItem('adminToken') || '';
      } else {
        token = localStorage.getItem('securityToken') || '';
      }
      
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, userType }),
      });

      if (response.ok) {
        const data = await response.json();
        setSetupData(data);
        toast({
          title: "تم إنشاء QR Code",
          description: "امسح الكود باستخدام تطبيق Google Authenticator أو أي تطبيق مصادقة آخر",
        });
      } else {
        const error = await response.json();
        toast({
          title: "خطأ",
          description: error.message || "فشل في إعداد المصادقة الثنائية",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في الاتصال بالخادم",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const enableTwoFactor = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رمز التحقق المكون من 6 أرقام",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get the appropriate token based on user type
      let token = '';
      if (userType === 'admin') {
        token = localStorage.getItem('adminToken') || '';
      } else {
        token = localStorage.getItem('securityToken') || '';
      }
      
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, userType, token: verificationCode }),
      });

      if (response.ok) {
        const data = await response.json();
        setSetupData({ ...setupData!, backupCodes: data.backupCodes });
        setStatus({ isEnabled: true, hasBackupCodes: true, lastUsed: null });
        setVerificationCode('');
        
        toast({
          title: "تم تفعيل المصادقة الثنائية",
          description: "احفظ أكواد الطوارئ في مكان آمن",
        });
      } else {
        const error = await response.json();
        toast({
          title: "خطأ",
          description: error.message || "رمز التحقق غير صحيح",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في الاتصال بالخادم",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    if (!disableCode || disableCode.length !== 6) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رمز التحقق المكون من 6 أرقام",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get the appropriate token based on user type
      let token = '';
      if (userType === 'admin') {
        token = localStorage.getItem('adminToken') || '';
      } else {
        token = localStorage.getItem('securityToken') || '';
      }
      
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, userType, token: disableCode }),
      });

      if (response.ok) {
        setStatus({ isEnabled: false, hasBackupCodes: false, lastUsed: null });
        setSetupData(null);
        setDisableCode('');
        setShowDisableDialog(false);
        
        toast({
          title: "تم إلغاء المصادقة الثنائية",
          description: "لم تعد المصادقة الثنائية مفعلة على حسابك",
        });
      } else {
        const error = await response.json();
        toast({
          title: "خطأ",
          description: error.message || "رمز التحقق غير صحيح",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ في الاتصال بالخادم",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: `تم نسخ ${label} إلى الحافظة`,
    });
  };

  // Show error message if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center" dir="rtl">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">خطأ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{error}</p>
            <Button 
              onClick={() => window.location.href = '/admin/secure-login'}
              className="mt-4 w-full"
            >
              العودة إلى تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">المصادقة الثنائية</h1>
              <p className="text-gray-600">إضافة طبقة حماية إضافية لحسابك</p>
            </div>
          </div>
        </motion.div>

        {/* Current Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                حالة المصادقة الثنائية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {status.isEnabled ? (
                    <>
                      <Check className="w-5 h-5 text-green-500" />
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        مفعلة
                      </Badge>
                    </>
                  ) : (
                    <>
                      <X className="w-5 h-5 text-red-500" />
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        غير مفعلة
                      </Badge>
                    </>
                  )}
                </div>
                {status.lastUsed && (
                  <p className="text-sm text-gray-500">
                    آخر استخدام: {new Date(status.lastUsed).toLocaleDateString('ar-EG')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Setup or Management */}
        {!status.isEnabled ? (
          /* Setup Flow */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  إعداد المصادقة الثنائية
                </CardTitle>
                <CardDescription>
                  تتطلب المصادقة الثنائية تطبيق مصادقة على هاتفك مثل Google Authenticator
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!setupData ? (
                  /* Step 1: Start Setup */
                  <div className="text-center">
                    <div className="mb-4">
                      <QrCode className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">ابدأ إعداد المصادقة الثنائية</h3>
                      <p className="text-gray-600 mb-6">
                        ستحتاج إلى تطبيق مصادقة على هاتفك للمتابعة
                      </p>
                    </div>
                    <Button 
                      onClick={startSetup} 
                      disabled={loading}
                      className="w-full sm:w-auto"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          جاري الإعداد...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          بدء الإعداد
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  /* Step 2: Setup with QR Code */
                  <div className="space-y-6">
                    {/* QR Code Display */}
                    <div className="text-center">
                      <h3 className="text-lg font-semibold mb-4">امسح رمز QR</h3>
                      <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 inline-block">
                        <img 
                          src={setupData.qrCode} 
                          alt="QR Code for 2FA Setup"
                          className="w-48 h-48 mx-auto"
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Manual Entry Option */}
                    <div>
                      <h4 className="font-medium mb-2">أو أدخل الكود يدوياً:</h4>
                      <div className="bg-gray-50 p-3 rounded border font-mono text-sm break-all">
                        {setupData.manualEntryKey}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mr-2"
                          onClick={() => copyToClipboard(setupData.manualEntryKey, 'الكود السري')}
                        >
                          نسخ
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Verification Step */}
                    <div>
                      <Label htmlFor="verification-code">
                        أدخل الرمز من تطبيق المصادقة
                      </Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="verification-code"
                          type="text"
                          placeholder="000000"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="text-center text-lg font-mono"
                          maxLength={6}
                        />
                        <Button 
                          onClick={enableTwoFactor}
                          disabled={loading || verificationCode.length !== 6}
                        >
                          {loading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            'تفعيل'
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Show Backup Codes if Generated */}
                    {setupData.backupCodes && setupData.backupCodes.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-yellow-800 mb-2">
                              أكواد الطوارئ
                            </h4>
                            <p className="text-yellow-700 text-sm mb-3">
                              احفظ هذه الأكواد في مكان آمن. يمكنك استخدامها للدخول في حالة فقدان هاتفك
                            </p>
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              {setupData.backupCodes.map((code, index) => (
                                <div key={index} className="bg-white p-2 rounded border font-mono text-sm">
                                  {code}
                                </div>
                              ))}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(setupData.backupCodes!.join('\n'), 'أكواد الطوارئ')}
                            >
                              نسخ جميع الأكواد
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* Management when enabled */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  إدارة المصادقة الثنائية
                </CardTitle>
                <CardDescription>
                  المصادقة الثنائية مفعلة على حسابك
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">المصادقة الثنائية مفعلة</p>
                      <p className="text-sm text-green-600">حسابك محمي بطبقة أمان إضافية</p>
                    </div>
                  </div>
                  {status.hasBackupCodes && (
                    <Badge variant="outline" className="border-green-300 text-green-700">
                      يتوفر أكواد طوارئ
                    </Badge>
                  )}
                </div>

                <Separator />

                <div className="pt-4">
                  <Button
                    variant="destructive"
                    onClick={() => setShowDisableDialog(true)}
                    className="w-full sm:w-auto"
                  >
                    إلغاء المصادقة الثنائية
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Disable Confirmation Dialog */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد إلغاء المصادقة الثنائية</AlertDialogTitle>
            <AlertDialogDescription>
              هذا الإجراء سيقوم بإلغاء المصادقة الثنائية من حسابك. ستحتاج لإدخال رمز التحقق الحالي للمتابعة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="disable-code">رمز التحقق من تطبيق المصادقة</Label>
            <Input
              id="disable-code"
              type="text"
              placeholder="000000"
              value={disableCode}
              onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-lg font-mono mt-2"
              maxLength={6}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={disableTwoFactor}
              disabled={loading || disableCode.length !== 6}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  جاري الإلغاء...
                </>
              ) : (
                'إلغاء المصادقة الثنائية'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TwoFactorSettings;