import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bell, 
  Settings, 
  ShoppingCart, 
  CreditCard,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCcw,
  Send,
  Gift,
  Eye
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import heroImage from '@assets/image_1758240368311.png';

const AutomaticNotifications = () => {
  // إضافة عنوان واضح للصفحة
  document.title = "نظام الإشعارات الشامل - إدارة اطبعلي";
  const [showDetails, setShowDetails] = useState(false);
  
  // System alert state
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  // Fetch notifications data
  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/notifications/history'],
    queryFn: () => apiRequest('/api/admin/notifications/history?admin=true'),
    select: (data) => Array.isArray(data?.notifications) ? data.notifications : []
  });

  // Fetch notification configuration
  const { data: configData } = useQuery({
    queryKey: ['/api/admin/notifications/config'],
    queryFn: () => apiRequest('/api/admin/notifications/config?admin=true'),
    select: (data) => data?.config || {}
  });

  // Default configuration
  const defaultConfig = {
    orderCreated: { enabled: true, template: 'تم إنشاء طلبك بنجاح #{{orderNumber}}' },
    paymentSuccess: { enabled: true, template: 'تم تأكيد الدفع للطلب #{{orderNumber}}' },
    paymentFailed: { enabled: true, template: 'فشل في عملية الدفع للطلب #{{orderNumber}}' },
    orderProcessing: { enabled: true, template: 'طلبك #{{orderNumber}} قيد المعالجة' },
    orderDelivered: { enabled: true, template: 'تم تسليم طلبك #{{orderNumber}} بنجاح' },
    orderCancelled: { enabled: true, template: 'تم إلغاء طلبك #{{orderNumber}}' },
    reviewReceived: { enabled: true, template: 'شكراً لتقييمك للطلب #{{orderNumber}}' },
    rewardGranted: { enabled: true, template: '🎁 تم منحك {{points}} نقطة كمكافأة: {{reason}}' },
    pointsEarned: { enabled: true, template: '⭐ حصلت على {{points}} نقطة من طلبك #{{orderNumber}}' },
    levelUp: { enabled: true, template: '🏆 تهانينا! وصلت للمستوى {{level}} الجديد' },
    rewardRedeemed: { enabled: true, template: '✨ تم استخدام المكافأة "{{rewardName}}" بنجاح' },
    systemAlert: { enabled: true, template: 'تنبيه النظام: {{message}}' }
  };

  // Configuration state with proper hydration
  const [notificationConfig, setNotificationConfig] = useState(defaultConfig);

  // Sync configuration when data is loaded from server
  useEffect(() => {
    if (configData && Object.keys(configData).length > 0) {
      setNotificationConfig({ ...defaultConfig, ...configData });
    }
  }, [configData]);

  // Get notification stats
  const getNotificationStats = () => {
    if (!notifications?.length) return { total: 0, sent: 0, failed: 0, pending: 0 };
    
    const total = notifications.length;
    const sent = notifications.filter(n => n.status === 'sent').length;
    const failed = notifications.filter(n => n.status === 'failed').length;
    const pending = notifications.filter(n => n.status === 'pending').length;
    
    return { total, sent, failed, pending };
  };

  const stats = getNotificationStats();

  // Mutations for backend interaction
  const saveConfigMutation = useMutation({
    mutationFn: (config: any) => apiRequest('/api/admin/notifications/config?admin=true', {
      method: 'POST',
      body: { config }
    }),
    onSuccess: () => {
      console.log('✅ Configuration saved successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications/config'] });
    }
  });

  const sendSystemAlertMutation = useMutation({
    mutationFn: (alertData: any) => apiRequest('/api/admin/notifications/system-alert?admin=true', {
      method: 'POST',
      body: alertData
    }),
    onSuccess: () => {
      setAlertTitle('');
      setAlertMessage('');
      setIsUrgent(false);
      console.log('🚨 System alert sent successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications/history'] });
    }
  });

  const getNotificationTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      'order_created': ShoppingCart,
      'orderCreated': ShoppingCart,
      'payment_success': CreditCard,
      'paymentSuccess': CreditCard,
      'payment_failed': XCircle,
      'paymentFailed': XCircle,
      'order_processing': Clock,
      'orderProcessing': Clock,
      'order_delivered': CheckCircle,
      'orderDelivered': CheckCircle,
      'order_cancelled': XCircle,
      'orderCancelled': XCircle,
      'review_received': Star,
      'reviewReceived': Star,
      'reward_granted': Gift,
      'rewardGranted': Gift,
      'points_earned': Star,
      'pointsEarned': Star,
      'level_up': Star,
      'levelUp': Star,
      'reward_redeemed': Gift,
      'rewardRedeemed': Gift,
      'system_alert': AlertTriangle,
      'systemAlert': AlertTriangle,
      'default': Bell
    };
    const IconComponent = icons[type] || icons.default;
    return <IconComponent className="w-4 h-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!showDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6" dir="rtl">
        <div className="max-w-2xl w-full">
          {/* Hero Card Based on the Uploaded Image */}
          <div className="relative bg-gradient-to-br from-slate-800 to-slate-700 rounded-3xl p-8 border border-slate-600 shadow-2xl">
            {/* Notification Icon */}
            <div className="absolute top-6 left-6">
              <div className="bg-red-500 p-3 rounded-xl shadow-lg">
                <Bell className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Main Content */}
            <div className="text-center space-y-6 pt-4">
              <div className="flex items-center justify-center gap-3">
                <h1 className="text-3xl font-bold text-white">نظام الإشعارات الشامل</h1>
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                </div>
              </div>

              <p className="text-slate-300 text-lg leading-relaxed max-w-lg mx-auto">
                إدارة الإشعارات التلقائية والبريدية وتنبيهات النظام - شامل كل أنواع الإشعارات
              </p>

              {/* Stats Summary */}
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-white">{stats.total}</div>
                  <div className="text-slate-400 text-sm">إجمالي الإشعارات</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-400">{stats.sent}</div>
                  <div className="text-slate-400 text-sm">تم الإرسال</div>
                </div>
              </div>

              {/* Action Button */}
              <Button 
                onClick={() => setShowDetails(true)}
                className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-3 rounded-xl font-semibold text-lg shadow-lg"
                data-testid="button-show-details"
              >
                <Eye className="w-5 h-5 ml-2" />
                عرض التفاصيل
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Simple Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">إدارة الإشعارات التلقائية</h1>
          <p className="text-muted-foreground">إدارة وتخصيص الإشعارات التلقائية للنظام</p>
        </div>
        <Button 
          onClick={() => setShowDetails(false)}
          variant="outline"
          data-testid="button-back-to-overview"
        >
          العودة للعرض العام
        </Button>
      </div>

      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            إعدادات مشغلات الإشعارات
          </CardTitle>
          <CardDescription>
            تخصيص الإشعارات التلقائية لكل حدث في النظام
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(notificationConfig).map(([key, config]) => (
            <div key={key} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getNotificationTypeIcon(key)}
                  <div>
                    <h4 className="font-medium">
                      {key === 'orderCreated' && 'إنشاء الطلب'}
                      {key === 'paymentSuccess' && 'نجاح الدفع'}
                      {key === 'paymentFailed' && 'فشل الدفع'}
                      {key === 'orderProcessing' && 'معالجة الطلب'}
                      {key === 'orderDelivered' && 'تسليم الطلب'}
                      {key === 'orderCancelled' && 'إلغاء الطلب'}
                      {key === 'reviewReceived' && 'استلام التقييم'}
                      {key === 'rewardGranted' && '🎁 منح مكافأة يدوية'}
                      {key === 'pointsEarned' && '⭐ كسب نقاط من الطلبات'}
                      {key === 'levelUp' && '🏆 الوصول لمستوى جديد'}
                      {key === 'rewardRedeemed' && '✨ استخدام المكافأة'}
                      {key === 'systemAlert' && 'تنبيه النظام'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {key === 'systemAlert' ? 'للأدمن فقط' : 'للعملاء'}
                      {(key === 'rewardGranted' || key === 'pointsEarned' || key === 'levelUp' || key === 'rewardRedeemed') && ' - نظام المكافآت'}
                    </p>
                  </div>
                </div>
                <Switch 
                  checked={config.enabled}
                  onCheckedChange={(checked) => 
                    setNotificationConfig(prev => ({
                      ...prev,
                      [key]: { ...prev[key], enabled: checked }
                    }))
                  }
                  data-testid={`switch-${key}-enabled`}
                />
              </div>
              
              {config.enabled && (
                <div className="space-y-2">
                  <Label htmlFor={`template-${key}`}>قالب الرسالة</Label>
                  <Textarea
                    id={`template-${key}`}
                    value={config.template}
                    onChange={(e) => 
                      setNotificationConfig(prev => ({
                        ...prev,
                        [key]: { ...prev[key], template: e.target.value }
                      }))
                    }
                    rows={2}
                    data-testid={`textarea-${key}-template`}
                  />
                  <p className="text-xs text-muted-foreground">
                    يمكن استخدام متغيرات مثل: {`{{orderNumber}}, {{userName}}, {{message}}`}
                    {(key === 'rewardGranted' || key === 'pointsEarned' || key === 'levelUp' || key === 'rewardRedeemed') && 
                      `, {{points}}, {{reason}}, {{level}}, {{rewardName}}`
                    }
                  </p>
                </div>
              )}
            </div>
          ))}
          
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={() => saveConfigMutation.mutate(notificationConfig)}
              disabled={saveConfigMutation.isPending}
              data-testid="button-save-config"
            >
              {saveConfigMutation.isPending ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => refetch()}
              data-testid="button-refresh-notifications"
            >
              <RefreshCcw className="w-4 h-4 ml-2" />
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick System Alert */}
      <Card>
        <CardHeader>
          <CardTitle>إرسال تنبيه نظام سريع</CardTitle>
          <CardDescription>
            إرسال تنبيه عاجل لجميع الأدمن في النظام
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="alert-title">عنوان التنبيه</Label>
            <Input 
              id="alert-title" 
              placeholder="مثال: صيانة النظام"
              value={alertTitle}
              onChange={(e) => setAlertTitle(e.target.value)}
              data-testid="input-alert-title"
            />
          </div>
          <div>
            <Label htmlFor="alert-message">رسالة التنبيه</Label>
            <Textarea 
              id="alert-message" 
              placeholder="تفاصيل التنبيه..."
              rows={3}
              value={alertMessage}
              onChange={(e) => setAlertMessage(e.target.value)}
              data-testid="textarea-alert-message"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              checked={isUrgent}
              onCheckedChange={setIsUrgent}
              data-testid="switch-alert-urgent" 
            />
            <Label>تنبيه عاجل</Label>
          </div>
          <Button 
            onClick={() => sendSystemAlertMutation.mutate({
              title: alertTitle,
              message: alertMessage,
              urgent: isUrgent
            })}
            disabled={!alertTitle || !alertMessage || sendSystemAlertMutation.isPending}
            className="w-full"
            data-testid="button-send-alert"
          >
            <Send className="w-4 h-4 ml-2" />
            {sendSystemAlertMutation.isPending ? 'جاري الإرسال...' : 'إرسال التنبيه'}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Notifications Summary */}
      {notifications && notifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>آخر الإشعارات</CardTitle>
            <CardDescription>
              عرض آخر {Math.min(5, notifications.length)} إشعارات تم إرسالها
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.slice(0, 5).map((notification, index) => (
                <div key={notification.id || index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="p-2 rounded-full bg-primary/10">
                    {getNotificationTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={getStatusColor(notification.status)}
                  >
                    {notification.status === 'sent' && 'تم الإرسال'}
                    {notification.status === 'failed' && 'فشل'}
                    {notification.status === 'pending' && 'انتظار'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AutomaticNotifications;