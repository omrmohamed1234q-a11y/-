import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bell, 
  Settings, 
  Users, 
  ShoppingCart, 
  CreditCard,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCcw,
  Plus,
  Edit,
  Trash2,
  Eye,
  Send
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AutomaticNotifications = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [configTab, setConfigTab] = useState('triggers');
  
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

  // Filter notifications
  const filteredNotifications = notifications?.filter(notification => {
    const matchesSearch = notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || notification.type === filterType;
    return matchesSearch && matchesFilter;
  }) || [];

  const getNotificationTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      'order_created': ShoppingCart,
      'payment_success': CreditCard,
      'payment_failed': XCircle,
      'order_processing': Clock,
      'order_delivered': CheckCircle,
      'order_cancelled': XCircle,
      'review_received': Star,
      'system_alert': AlertTriangle,
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

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الإشعارات التلقائية</h1>
          <p className="text-muted-foreground mt-1">
            إدارة وتخصيص الإشعارات التلقائية للنظام
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            size="sm"
            data-testid="button-refresh-notifications"
          >
            <RefreshCcw className="w-4 h-4 ml-2" />
            تحديث
          </Button>
          <Button 
            variant="default"
            onClick={() => sendSystemAlertMutation.mutate({
              title: alertTitle,
              message: alertMessage,
              urgent: isUrgent
            })}
            disabled={!alertTitle || !alertMessage || sendSystemAlertMutation.isPending}
            data-testid="button-send-system-alert"
          >
            <Send className="w-4 h-4 ml-2" />
            {sendSystemAlertMutation.isPending ? 'جاري الإرسال...' : 'إرسال تنبيه نظام'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الإشعارات</p>
                <p className="text-2xl font-bold" data-testid="text-total-notifications">{stats.total}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">تم الإرسال</p>
                <p className="text-2xl font-bold text-green-600" data-testid="text-sent-notifications">{stats.sent}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">فشل الإرسال</p>
                <p className="text-2xl font-bold text-red-600" data-testid="text-failed-notifications">{stats.failed}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">في الانتظار</p>
                <p className="text-2xl font-bold text-yellow-600" data-testid="text-pending-notifications">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={configTab} onValueChange={setConfigTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="triggers" data-testid="tab-triggers">مشغلات الإشعارات</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">سجل الإشعارات</TabsTrigger>
          <TabsTrigger value="system-alerts" data-testid="tab-system-alerts">تنبيهات النظام</TabsTrigger>
        </TabsList>

        {/* Notification Triggers Configuration */}
        <TabsContent value="triggers" className="space-y-6">
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
                          {key === 'systemAlert' && 'تنبيه النظام'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {key === 'systemAlert' ? 'للأدمن فقط' : 'للعملاء'}
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
                      </p>
                    </div>
                  )}
                </div>
              ))}
              
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="default"
                  data-testid="button-save-config"
                >
                  حفظ الإعدادات
                </Button>
                <Button 
                  variant="outline"
                  data-testid="button-test-notifications"
                >
                  اختبار الإشعارات
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications History */}
        <TabsContent value="history" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="البحث في الإشعارات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-notifications"
              />
            </div>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-md"
              data-testid="select-filter-type"
            >
              <option value="all">جميع الأنواع</option>
              <option value="order_created">إنشاء الطلب</option>
              <option value="payment_success">نجاح الدفع</option>
              <option value="payment_failed">فشل الدفع</option>
              <option value="order_delivered">تسليم الطلب</option>
              <option value="system_alert">تنبيه النظام</option>
            </select>
          </div>

          {/* Notifications List */}
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 text-center">
                  <RefreshCcw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  جاري تحميل الإشعارات...
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  لا توجد إشعارات مطابقة للبحث
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notification, index) => (
                    <div key={notification.id || index} className="p-4 hover:bg-muted/50">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                          {getNotificationTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium" data-testid={`text-notification-title-${index}`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="secondary" 
                                className={getStatusColor(notification.status)}
                                data-testid={`badge-notification-status-${index}`}
                              >
                                {notification.status === 'sent' && 'تم الإرسال'}
                                {notification.status === 'failed' && 'فشل'}
                                {notification.status === 'pending' && 'انتظار'}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {notification.createdAt && new Date(notification.createdAt).toLocaleDateString('ar-EG')}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground" data-testid={`text-notification-message-${index}`}>
                            {notification.message}
                          </p>
                          {notification.userId && (
                            <p className="text-xs text-muted-foreground">
                              المستخدم: {notification.userId}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Alerts (Admin Only) */}
        <TabsContent value="system-alerts" className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              تنبيهات النظام مخصصة للأدمن فقط ولا تظهر للعملاء
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>إرسال تنبيه نظام جديد</CardTitle>
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
                  data-testid="input-alert-title"
                />
              </div>
              <div>
                <Label htmlFor="alert-message">رسالة التنبيه</Label>
                <Textarea 
                  id="alert-message" 
                  placeholder="تفاصيل التنبيه..."
                  rows={3}
                  data-testid="textarea-alert-message"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch data-testid="switch-alert-urgent" />
                <Label>تنبيه عاجل</Label>
              </div>
              <Button 
                className="w-full"
                data-testid="button-send-alert"
              >
                <Send className="w-4 h-4 ml-2" />
                إرسال التنبيه
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutomaticNotifications;