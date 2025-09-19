/**
 * 🚨 SECURITY ALERTS SYSTEM 🚨
 * 
 * نظام تنبيهات الأمان والمراقبة
 * الغرض: مراقبة وتنبيه عن المشاكل الأمنية والتلاعب في البيانات
 * 
 * هذا النظام يعمل كطبقة مراقبة أمنية بدون تعديل الكود الموجود
 * 
 * تاريخ الإنشاء: 2025-01-19
 * 🚨 END SECURITY HEADER 🚨
 */

import { CART_PROTECTION, PRINT_PROTECTION, calculateSafeCartTotal } from './core-protected';

// ===== أنواع التنبيهات الأمنية =====

export type SecurityAlertLevel = 'info' | 'warning' | 'danger' | 'critical';

export interface SecurityAlert {
  id: string;
  timestamp: string;
  level: SecurityAlertLevel;
  type: string;
  title: string;
  message: string;
  source: 'cart' | 'print' | 'payment' | 'session' | 'system';
  data?: any;
  suggestions?: string[];
  autoResolve?: boolean;
  resolved?: boolean;
  resolvedAt?: string;
}

export interface SecurityMetrics {
  totalAlerts: number;
  criticalAlerts: number;
  lastAlert: string | null;
  alertsByType: Record<string, number>;
  alertsBySource: Record<string, number>;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

export interface MonitoringRules {
  cartMonitoring: {
    enabled: boolean;
    maxItemsAlert: number;
    maxTotalValueAlert: number;
    suspiciousQuantityThreshold: number;
    priceChangeThreshold: number;
  };
  printMonitoring: {
    enabled: boolean;
    maxFileSizeAlert: number;
    maxFilesPerMinute: number;
    suspiciousFileTypes: string[];
    maxCopiesAlert: number;
  };
  sessionMonitoring: {
    enabled: boolean;
    maxActionsPerMinute: number;
    suspiciousPatterns: string[];
    maxIdleTime: number;
  };
}

// ===== إعدادات المراقبة الافتراضية =====

const DEFAULT_MONITORING_RULES: MonitoringRules = {
  cartMonitoring: {
    enabled: true,
    maxItemsAlert: 50,
    maxTotalValueAlert: 50000,
    suspiciousQuantityThreshold: 1000,
    priceChangeThreshold: 0.5 // 50% تغيير في السعر
  },
  printMonitoring: {
    enabled: true,
    maxFileSizeAlert: 100 * 1024 * 1024, // 100 MB
    maxFilesPerMinute: 20,
    suspiciousFileTypes: ['exe', 'bat', 'com', 'scr'],
    maxCopiesAlert: 500
  },
  sessionMonitoring: {
    enabled: true,
    maxActionsPerMinute: 100,
    suspiciousPatterns: ['rapid_clicks', 'price_manipulation', 'bulk_download'],
    maxIdleTime: 30 * 60 * 1000 // 30 دقيقة
  }
};

// ===== مدير التنبيهات الأمنية =====

class SecurityAlertsManager {
  private alerts: SecurityAlert[] = [];
  private rules: MonitoringRules;
  private listeners: Array<(alert: SecurityAlert) => void> = [];
  private metrics: SecurityMetrics;
  private sessionData: {
    actions: number[];
    lastAction: number;
    patterns: string[];
    startTime: number;
  };
  private sessionMonitoringInterval: ReturnType<typeof setInterval> | null = null;
  private isMonitoring: boolean = false;

  constructor(customRules?: Partial<MonitoringRules>) {
    this.rules = { ...DEFAULT_MONITORING_RULES, ...customRules };
    this.metrics = this.initializeMetrics();
    this.sessionData = {
      actions: [],
      lastAction: Date.now(),
      patterns: [],
      startTime: Date.now()
    };

    // لا نبدأ المراقبة تلقائياً - تبدأ عند أول استخدام
  }

  // ===== إدارة التنبيهات =====

  /**
   * إضافة تنبيه أمني جديد
   */
  addAlert(alertData: Omit<SecurityAlert, 'id' | 'timestamp' | 'resolved'>): SecurityAlert {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      resolved: false,
      ...alertData
    };

    this.alerts.unshift(alert); // إضافة في المقدمة (الأحدث أولاً)
    
    // الاحتفاظ بآخر 1000 تنبيه فقط
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(0, 1000);
    }

    this.updateMetrics();
    this.notifyListeners(alert);
    
    console.warn(`🚨 [SECURITY ALERT] [${alert.level.toUpperCase()}] ${alert.title}:`, alert);

    // إجراءات تلقائية للتنبيهات الحرجة
    if (alert.level === 'critical') {
      this.handleCriticalAlert(alert);
    }

    return alert;
  }

  /**
   * حل تنبيه أمني
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      this.updateMetrics();
      console.log(`✅ Security alert resolved: ${alert.title}`);
      return true;
    }
    return false;
  }

  /**
   * الحصول على جميع التنبيهات
   */
  getAlerts(filters?: {
    level?: SecurityAlertLevel;
    source?: string;
    resolved?: boolean;
    limit?: number;
  }): SecurityAlert[] {
    let filteredAlerts = [...this.alerts];

    if (filters) {
      if (filters.level) {
        filteredAlerts = filteredAlerts.filter(a => a.level === filters.level);
      }
      if (filters.source) {
        filteredAlerts = filteredAlerts.filter(a => a.source === filters.source);
      }
      if (filters.resolved !== undefined) {
        filteredAlerts = filteredAlerts.filter(a => a.resolved === filters.resolved);
      }
      if (filters.limit && filters.limit > 0) {
        filteredAlerts = filteredAlerts.slice(0, filters.limit);
      }
    }

    return filteredAlerts;
  }

  /**
   * الحصول على المقاييس الأمنية
   */
  getMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  // ===== مراقبة السلة =====

  /**
   * مراقبة إضافة عنصر للسلة
   */
  monitorCartAdd(item: any, currentCart: any[]): void {
    if (!this.rules.cartMonitoring.enabled) return;

    try {
      // فحص الكمية المشبوهة
      if (item.quantity > this.rules.cartMonitoring.suspiciousQuantityThreshold) {
        this.addAlert({
          level: 'warning',
          type: 'suspicious_quantity',
          title: 'كمية مشبوهة في السلة',
          message: `تم إضافة منتج بكمية ${item.quantity} وهي أكبر من المعتاد`,
          source: 'cart',
          data: { item, quantity: item.quantity },
          suggestions: ['تحقق من صحة الكمية المطلوبة', 'راجع تفاصيل المنتج']
        });
      }

      // فحص إجمالي عناصر السلة
      const newCartSize = currentCart.length + 1;
      if (newCartSize > this.rules.cartMonitoring.maxItemsAlert) {
        this.addAlert({
          level: 'info',
          type: 'large_cart',
          title: 'سلة كبيرة',
          message: `السلة تحتوي على ${newCartSize} عنصر`,
          source: 'cart',
          data: { cartSize: newCartSize },
          suggestions: ['راجع محتويات السلة', 'تأكد من صحة جميع العناصر']
        });
      }

      // فحص القيمة الإجمالية
      const totalValue = this.calculateCartTotal([...currentCart, item]);
      if (totalValue > this.rules.cartMonitoring.maxTotalValueAlert) {
        this.addAlert({
          level: 'warning',
          type: 'high_value_cart',
          title: 'قيمة سلة مرتفعة',
          message: `القيمة الإجمالية للسلة ${totalValue.toFixed(2)} جنيه`,
          source: 'cart',
          data: { totalValue, itemCount: newCartSize },
          suggestions: ['راجع الأسعار والكميات', 'تأكد من صحة الحسابات']
        });
      }

      this.trackUserAction('cart_add');

    } catch (error) {
      console.error('Error in cart monitoring:', error);
    }
  }

  /**
   * مراقبة تعديل السلة
   */
  monitorCartUpdate(oldItem: any, newItem: any): void {
    if (!this.rules.cartMonitoring.enabled) return;

    try {
      // فحص تغيير السعر المشبوه
      if (oldItem.price && newItem.price) {
        const priceChange = Math.abs(newItem.price - oldItem.price) / oldItem.price;
        
        if (priceChange > this.rules.cartMonitoring.priceChangeThreshold) {
          this.addAlert({
            level: 'danger',
            type: 'price_manipulation',
            title: 'تغيير مشبوه في السعر',
            message: `السعر تغير من ${oldItem.price} إلى ${newItem.price} (${(priceChange * 100).toFixed(1)}%)`,
            source: 'cart',
            data: { oldPrice: oldItem.price, newPrice: newItem.price, change: priceChange },
            suggestions: ['تحقق من مصدر التغيير', 'راجع سجل العمليات', 'اتصل بالدعم التقني']
          });
        }
      }

      this.trackUserAction('cart_update');

    } catch (error) {
      console.error('Error in cart update monitoring:', error);
    }
  }

  // ===== مراقبة الطباعة =====

  /**
   * مراقبة رفع ملف للطباعة
   */
  monitorFileUpload(file: File, copies: number = 1): void {
    if (!this.rules.printMonitoring.enabled) return;

    try {
      // فحص حجم الملف
      if (file.size > this.rules.printMonitoring.maxFileSizeAlert) {
        this.addAlert({
          level: 'warning',
          type: 'large_file',
          title: 'ملف كبير الحجم',
          message: `تم رفع ملف بحجم ${(file.size / 1024 / 1024).toFixed(2)} ميجابايت`,
          source: 'print',
          data: { fileName: file.name, fileSize: file.size },
          suggestions: ['تحقق من ضرورة هذا الحجم', 'فكر في ضغط الملف']
        });
      }

      // فحص نوع الملف المشبوه
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      if (this.rules.printMonitoring.suspiciousFileTypes.includes(fileExtension)) {
        this.addAlert({
          level: 'critical',
          type: 'suspicious_file_type',
          title: 'نوع ملف غير آمن',
          message: `تم رفع ملف من نوع ${fileExtension} وهو نوع مشبوه`,
          source: 'print',
          data: { fileName: file.name, fileType: fileExtension },
          suggestions: ['لا ترفع ملفات تنفيذية', 'استخدم أنواع ملفات آمنة فقط']
        });
      }

      // فحص عدد النسخ المرتفع
      if (copies > this.rules.printMonitoring.maxCopiesAlert) {
        this.addAlert({
          level: 'warning',
          type: 'excessive_copies',
          title: 'عدد نسخ مرتفع',
          message: `طلب طباعة ${copies} نسخة من الملف`,
          source: 'print',
          data: { fileName: file.name, copies },
          suggestions: ['تأكد من العدد المطلوب', 'راجع التكلفة المتوقعة']
        });
      }

      // مراقبة معدل رفع الملفات
      this.monitorFileUploadRate();
      this.trackUserAction('file_upload');

    } catch (error) {
      console.error('Error in file upload monitoring:', error);
    }
  }

  // ===== مراقبة الجلسة =====

  /**
   * تتبع أعمال المستخدم
   */
  private trackUserAction(action: string): void {
    // بدء المراقبة عند أول استخدام
    if (!this.isMonitoring) {
      this.startSessionMonitoring();
    }
    
    const now = Date.now();
    const timeWindow = 60 * 1000; // دقيقة واحدة
    
    // إضافة العملية الحالية
    this.sessionData.actions.push(now);
    this.sessionData.lastAction = now;
    
    // إزالة العمليات القديمة (خارج النافزة الزمنية)
    this.sessionData.actions = this.sessionData.actions.filter(time => now - time < timeWindow);
    
    // فحص معدل الأعمال السريع
    const actionsInWindow = this.sessionData.actions.length;
    
    if (actionsInWindow > this.rules.sessionMonitoring.maxActionsPerMinute) {
      this.addAlert({
        level: 'warning',
        type: 'rapid_actions',
        title: 'نشاط سريع غير عادي',
        message: `${actionsInWindow} عملية في آخر دقيقة`,
        source: 'session',
        data: { actionsCount: actionsInWindow, action },
        suggestions: ['تأكد من أن المستخدم حقيقي', 'راقب النشاط للتلاعب']
      });
    }
  }

  /**
   * مراقبة معدل رفع الملفات
   */
  private monitorFileUploadRate(): void {
    // فحص توفر localStorage
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage not available for upload rate monitoring');
      return;
    }

    const uploadKey = 'file_uploads_tracker';
    const now = Date.now();
    const timeWindow = 60 * 1000; // دقيقة

    try {
      const stored = localStorage.getItem(uploadKey);
      const uploads = stored ? JSON.parse(stored) : [];
      
      // التحقق من صحة البيانات
      if (!Array.isArray(uploads)) {
        console.warn('Invalid upload tracker data, resetting');
        localStorage.setItem(uploadKey, JSON.stringify([now]));
        return;
      }
      
      // إضافة الرفع الحالي
      uploads.push(now);
      
      // إزالة الرفعات القديمة (خارج النافزة الزمنية)
      const recentUploads = uploads.filter((time: number) => 
        typeof time === 'number' && now - time < timeWindow
      );
      
      // حفظ البيانات المحدثة
      localStorage.setItem(uploadKey, JSON.stringify(recentUploads));
      
      // فحص تجاوز الحد
      if (recentUploads.length > this.rules.printMonitoring.maxFilesPerMinute) {
        this.addAlert({
          level: 'danger',
          type: 'rapid_file_uploads',
          title: 'رفع ملفات سريع',
          message: `تم رفع ${recentUploads.length} ملف في آخر دقيقة`,
          source: 'print',
          data: { uploadsCount: recentUploads.length },
          suggestions: ['تأكد من ضرورة كل هذه الملفات', 'راقب النشاط المشبوه']
        });
      }

    } catch (error) {
      console.error('Error monitoring upload rate:', error);
    }
  }

  /**
   * بدء مراقبة الجلسة
   */
  startSessionMonitoring(): void {
    if (!this.rules.sessionMonitoring.enabled || this.isMonitoring) return;

    this.isMonitoring = true;
    
    // مراقبة الخمول
    this.sessionMonitoringInterval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - this.sessionData.lastAction;
      
      if (idleTime > this.rules.sessionMonitoring.maxIdleTime) {
        console.log('🕒 User session idle, resetting action counter');
        this.sessionData.actions = [];
      }
    }, 5 * 60 * 1000); // فحص كل 5 دقائق
    
    console.log('🔍 Session monitoring started');
  }

  /**
   * إيقاف مراقبة الجلسة
   */
  stopSessionMonitoring(): void {
    if (this.sessionMonitoringInterval) {
      clearInterval(this.sessionMonitoringInterval);
      this.sessionMonitoringInterval = null;
      this.isMonitoring = false;
      console.log('🔍 Session monitoring stopped');
    }
  }

  /**
   * تنظيف الموارد عند عدم الحاجة
   */
  cleanup(): void {
    this.stopSessionMonitoring();
    this.alerts = [];
    this.listeners = [];
    console.log('🧹 Security manager cleaned up');
  }

  /**
   * فحص حالة المراقبة
   */
  isSessionMonitoring(): boolean {
    return this.isMonitoring;
  }

  // ===== دوال مساعدة =====

  /**
   * حساب إجمالي السلة بأمان
   */
  private calculateCartTotal(items: any[]): number {
    try {
      return calculateSafeCartTotal(items);
    } catch (error) {
      console.warn('Error calculating cart total, using fallback:', error);
      return items.reduce((total, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return total + (price * quantity);
      }, 0);
    }
  }

  /**
   * معالجة التنبيهات الحرجة
   */
  private handleCriticalAlert(alert: SecurityAlert): void {
    // يمكن إضافة إجراءات تلقائية للتنبيهات الحرجة
    console.error('🚨 CRITICAL SECURITY ALERT:', alert);
    
    // إرسال للخادم فوراً (اختياري)
    // this.sendCriticalAlertToServer(alert);
  }

  /**
   * تحديث المقاييس
   */
  private updateMetrics(): void {
    const unresolved = this.alerts.filter(a => !a.resolved);
    
    this.metrics = {
      totalAlerts: this.alerts.length,
      criticalAlerts: unresolved.filter(a => a.level === 'critical').length,
      lastAlert: this.alerts.length > 0 ? this.alerts[0].timestamp : null,
      alertsByType: this.calculateAlertsByType(),
      alertsBySource: this.calculateAlertsBySource(),
      systemHealth: this.calculateSystemHealth()
    };
  }

  /**
   * حساب التنبيهات حسب النوع
   */
  private calculateAlertsByType(): Record<string, number> {
    const types: Record<string, number> = {};
    this.alerts.forEach(alert => {
      types[alert.type] = (types[alert.type] || 0) + 1;
    });
    return types;
  }

  /**
   * حساب التنبيهات حسب المصدر
   */
  private calculateAlertsBySource(): Record<string, number> {
    const sources: Record<string, number> = {};
    this.alerts.forEach(alert => {
      sources[alert.source] = (sources[alert.source] || 0) + 1;
    });
    return sources;
  }

  /**
   * تقييم صحة النظام
   */
  private calculateSystemHealth(): 'healthy' | 'warning' | 'critical' {
    const unresolved = this.alerts.filter(a => !a.resolved);
    const criticalCount = unresolved.filter(a => a.level === 'critical').length;
    const warningCount = unresolved.filter(a => a.level === 'warning' || a.level === 'danger').length;

    if (criticalCount > 0) return 'critical';
    if (warningCount > 5) return 'warning';
    return 'healthy';
  }

  /**
   * تهيئة المقاييس
   */
  private initializeMetrics(): SecurityMetrics {
    return {
      totalAlerts: 0,
      criticalAlerts: 0,
      lastAlert: null,
      alertsByType: {},
      alertsBySource: {},
      systemHealth: 'healthy'
    };
  }

  /**
   * إضافة مستمع للتنبيهات
   */
  addListener(callback: (alert: SecurityAlert) => void): void {
    this.listeners.push(callback);
  }

  /**
   * إزالة مستمع
   */
  removeListener(callback: (alert: SecurityAlert) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * إشعار المستمعين
   */
  private notifyListeners(alert: SecurityAlert): void {
    this.listeners.forEach(listener => {
      try {
        listener(alert);
      } catch (error) {
        console.error('Error notifying security alert listener:', error);
      }
    });
  }
}

// ===== مثيل المدير الرئيسي (Lazy Singleton) =====

let _securityManagerInstance: SecurityAlertsManager | null = null;

/**
 * الحصول على مثيل مدير الأمان (Lazy Singleton)
 */
export const getSecurityManager = (): SecurityAlertsManager => {
  if (!_securityManagerInstance) {
    _securityManagerInstance = new SecurityAlertsManager();
  }
  return _securityManagerInstance;
};

/**
 * إعادة تعيين مدير الأمان (للاختبارات أو التنظيف)
 */
export const resetSecurityManager = (): void => {
  if (_securityManagerInstance) {
    _securityManagerInstance.cleanup();
    _securityManagerInstance = null;
  }
};

/**
 * مثيل المدير للاستخدام المباشر (يبدأ بشكل lazy)
 */
export const securityManager = getSecurityManager();

// ===== دوال للاستخدام السريع =====

/**
 * مراقبة السلة - دالة سريعة
 */
export const monitorCart = {
  addItem: (item: any, currentCart: any[]) => getSecurityManager().monitorCartAdd(item, currentCart),
  updateItem: (oldItem: any, newItem: any) => getSecurityManager().monitorCartUpdate(oldItem, newItem),
};

/**
 * مراقبة الطباعة - دالة سريعة
 */
export const monitorPrint = {
  uploadFile: (file: File, copies?: number) => getSecurityManager().monitorFileUpload(file, copies),
};

/**
 * إدارة دورة الحياة
 */
export const securityLifecycle = {
  start: () => getSecurityManager().startSessionMonitoring(),
  stop: () => getSecurityManager().stopSessionMonitoring(),
  cleanup: () => resetSecurityManager(),
  isMonitoring: () => getSecurityManager().isSessionMonitoring(),
};

/**
 * إضافة تنبيه يدوي
 */
export const addSecurityAlert = (
  level: SecurityAlertLevel,
  title: string, 
  message: string,
  source: SecurityAlert['source'],
  data?: any
): SecurityAlert => {
  return securityManager.addAlert({
    level,
    type: 'manual',
    title,
    message,
    source,
    data
  });
};

/**
 * الحصول على التنبيهات
 */
export const getSecurityAlerts = (filters?: Parameters<typeof securityManager.getAlerts>[0]) => {
  return securityManager.getAlerts(filters);
};

/**
 * الحصول على مقاييس الأمان
 */
export const getSecurityMetrics = () => {
  return securityManager.getMetrics();
};

/**
 * تسجيل الاستماع للتنبيهات
 */
export const onSecurityAlert = (callback: (alert: SecurityAlert) => void) => {
  securityManager.addListener(callback);
  
  // إرجاع دالة لإلغاء الاستماع
  return () => securityManager.removeListener(callback);
};