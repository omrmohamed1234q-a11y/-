/**
 * خدمة العمل بدون اتصال (Offline Mode) للكابتن
 * تدعم: offline data، sync when online، queue management
 */

// استيراد المكتبات المطلوبة
let AsyncStorage;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default || require('@react-native-async-storage/async-storage');
} catch (error) {
  // Fallback لبيئة الويب
  AsyncStorage = {
    getItem: (key) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
    removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
    clear: () => Promise.resolve(localStorage.clear())
  };
}

class OfflineService {
  constructor() {
    this.isOnline = true;
    this.offlineQueue = [];
    this.offlineData = new Map();
    this.syncQueue = [];
    this.lastSyncTime = null;
    this.isInitialized = false;

    // إعدادات Offline
    this.config = {
      enableOfflineMode: true,
      maxQueueSize: 100,
      syncInterval: 30000, // 30 ثانية عند العودة للاتصال
      maxOfflineTime: 24 * 60 * 60 * 1000, // 24 ساعة
      enableAutoSync: true
    };

    // معالجات الأحداث
    this.eventHandlers = {
      onOnlineStatusChanged: [],
      onOfflineDataCached: [],
      onSyncCompleted: [],
      onSyncFailed: []
    };
  }

  /**
   * تهيئة خدمة العمل بدون اتصال
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('📱 تهيئة خدمة العمل بدون اتصال...');

      // تحديد حالة الشبكة الأولية
      this.isOnline = await this.checkNetworkStatus();

      // تحميل البيانات المحفوظة
      await this.loadOfflineData();
      await this.loadOfflineQueue();

      // مراقبة حالة الشبكة
      this.startNetworkMonitoring();

      // بدء التزامن التلقائي
      if (this.config.enableAutoSync) {
        this.startAutoSync();
      }

      this.isInitialized = true;
      console.log('✅ خدمة العمل بدون اتصال جاهزة');

    } catch (error) {
      console.error('❌ خطأ في تهيئة خدمة العمل بدون اتصال:', error);
    }
  }

  /**
   * فحص حالة الشبكة
   */
  async checkNetworkStatus() {
    try {
      // Web environment
      if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
        return navigator.onLine;
      }

      // React Native environment - simple connectivity test
      try {
        const response = await fetch('https://www.google.com', {
          method: 'HEAD',
          mode: 'no-cors',
          timeout: 5000
        });
        return true;
      } catch {
        return false;
      }
    } catch {
      return true; // افتراضي متفائل
    }
  }

  /**
   * مراقبة حالة الشبكة
   */
  startNetworkMonitoring() {
    // Web environment - bind methods to preserve context
    if (typeof window !== 'undefined' && 'navigator' in window) {
      this.boundOnlineHandler = () => this.handleOnlineStatusChange(true);
      this.boundOfflineHandler = () => this.handleOnlineStatusChange(false);
      
      window.addEventListener('online', this.boundOnlineHandler);
      window.addEventListener('offline', this.boundOfflineHandler);
    }

    // فحص دوري للاتصال
    this.networkMonitorInterval = setInterval(async () => {
      const currentStatus = await this.checkNetworkStatus();
      if (currentStatus !== this.isOnline) {
        this.handleOnlineStatusChange(currentStatus);
      }
    }, 10000); // كل 10 ثوان
  }

  /**
   * معالجة تغيير حالة الاتصال
   */
  async handleOnlineStatusChange(isOnline) {
    const wasOffline = !this.isOnline;
    this.isOnline = isOnline;

    console.log(`🌐 Network status changed: ${isOnline ? 'Online' : 'Offline'}`);

    // إشعار المعالجات
    this.notifyHandlers('onOnlineStatusChanged', { 
      isOnline,
      wasOffline,
      timestamp: new Date() 
    });

    // بدء التزامن عند العودة للاتصال
    if (isOnline && wasOffline && this.config.enableAutoSync) {
      console.log('🔄 Starting sync after reconnection...');
      setTimeout(() => {
        this.syncOfflineData();
      }, 2000); // انتظار 2 ثانية للتأكد من استقرار الاتصال
    }
  }

  /**
   * حفظ بيانات للعمل بدون اتصال
   */
  async cacheOfflineData(key, data, type = 'general') {
    try {
      const cacheItem = {
        key,
        data,
        type,
        timestamp: Date.now(),
        synced: false
      };

      this.offlineData.set(key, cacheItem);

      // حفظ محلياً
      await AsyncStorage.setItem(`offline_${key}`, JSON.stringify(cacheItem));

      console.log(`💾 Cached offline data: ${key} (${type})`);
      
      this.notifyHandlers('onOfflineDataCached', { key, type, size: this.offlineData.size });

    } catch (error) {
      console.error('❌ خطأ في حفظ البيانات بدون اتصال:', error);
    }
  }

  /**
   * استرجاع البيانات المحفوظة
   */
  async getOfflineData(key) {
    try {
      // محاولة الاسترجاع من الذاكرة أولاً
      if (this.offlineData.has(key)) {
        const item = this.offlineData.get(key);
        
        // فحص انتهاء الصلاحية
        if (Date.now() - item.timestamp < this.config.maxOfflineTime) {
          console.log(`📱 Retrieved offline data: ${key}`);
          return item.data;
        } else {
          // إزالة البيانات المنتهية الصلاحية
          this.removeOfflineData(key);
        }
      }

      // محاولة الاسترجاع من التخزين المحلي
      const stored = await AsyncStorage.getItem(`offline_${key}`);
      if (stored) {
        const item = JSON.parse(stored);
        
        if (Date.now() - item.timestamp < this.config.maxOfflineTime) {
          this.offlineData.set(key, item);
          return item.data;
        } else {
          await AsyncStorage.removeItem(`offline_${key}`);
        }
      }

      return null;
    } catch (error) {
      console.error('❌ خطأ في استرجاع البيانات بدون اتصال:', error);
      return null;
    }
  }

  /**
   * إزالة البيانات المحفوظة
   */
  async removeOfflineData(key) {
    try {
      this.offlineData.delete(key);
      await AsyncStorage.removeItem(`offline_${key}`);
      console.log(`🗑️ Removed offline data: ${key}`);
    } catch (error) {
      console.error('❌ خطأ في إزالة البيانات:', error);
    }
  }

  /**
   * إضافة عملية إلى طابور المزامنة
   */
  async queueOperation(operation) {
    try {
      if (this.offlineQueue.length >= this.config.maxQueueSize) {
        // إزالة أقدم عملية
        this.offlineQueue.shift();
        console.warn('⚠️ Queue full, removed oldest operation');
      }

      const queueItem = {
        id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        operation,
        timestamp: Date.now(),
        retries: 0,
        maxRetries: 3
      };

      this.offlineQueue.push(queueItem);

      // حفظ الطابور محلياً
      await this.saveOfflineQueue();

      console.log(`📋 Queued operation: ${operation.type} (${queueItem.id})`);

      // محاولة تنفيذ فوري إذا كان متصل
      if (this.isOnline) {
        this.processQueueItem(queueItem);
      }

    } catch (error) {
      console.error('❌ خطأ في إضافة عملية للطابور:', error);
    }
  }

  /**
   * معالجة عنصر من الطابور
   */
  async processQueueItem(queueItem) {
    try {
      console.log(`⚙️ Processing queue item: ${queueItem.operation.type}`);

      const success = await this.executeOperation(queueItem.operation);

      if (success) {
        // إزالة من الطابور عند النجاح
        const index = this.offlineQueue.findIndex(item => item.id === queueItem.id);
        if (index > -1) {
          this.offlineQueue.splice(index, 1);
          await this.saveOfflineQueue();
        }
        console.log(`✅ Operation completed: ${queueItem.operation.type}`);
      } else {
        // زيادة عدد المحاولات
        queueItem.retries++;
        
        if (queueItem.retries >= queueItem.maxRetries) {
          // إزالة العملية بعد فشل كل المحاولات
          const index = this.offlineQueue.findIndex(item => item.id === queueItem.id);
          if (index > -1) {
            this.offlineQueue.splice(index, 1);
            await this.saveOfflineQueue();
          }
          console.error(`❌ Operation failed permanently: ${queueItem.operation.type}`);
        } else {
          await this.saveOfflineQueue();
          console.warn(`⚠️ Operation failed, will retry: ${queueItem.operation.type} (${queueItem.retries}/${queueItem.maxRetries})`);
        }
      }

    } catch (error) {
      console.error('❌ خطأ في معالجة عنصر الطابور:', error);
    }
  }

  /**
   * تنفيذ عملية محددة
   */
  async executeOperation(operation) {
    try {
      switch (operation.type) {
        case 'update_location':
          return await this.syncLocationUpdate(operation.data);
          
        case 'update_status':
          return await this.syncStatusUpdate(operation.data);
          
        case 'accept_order':
          return await this.syncOrderAcceptance(operation.data);
          
        case 'complete_order':
          return await this.syncOrderCompletion(operation.data);
          
        case 'send_message':
          return await this.syncMessage(operation.data);
          
        default:
          console.warn('⚠️ Unknown operation type:', operation.type);
          return false;
      }
    } catch (error) {
      console.error('❌ خطأ في تنفيذ العملية:', error);
      return false;
    }
  }

  /**
   * مزامنة تحديث الموقع
   */
  async syncLocationUpdate(locationData) {
    try {
      // هنا يتم استدعاء API لتحديث الموقع
      console.log('📍 Syncing location update:', locationData);
      // TODO: استدعاء API الفعلي
      return true;
    } catch (error) {
      console.error('❌ فشل في مزامنة الموقع:', error);
      return false;
    }
  }

  /**
   * مزامنة تحديث الحالة
   */
  async syncStatusUpdate(statusData) {
    try {
      console.log('📱 Syncing status update:', statusData);
      // TODO: استدعاء API الفعلي
      return true;
    } catch (error) {
      console.error('❌ فشل في مزامنة الحالة:', error);
      return false;
    }
  }

  /**
   * مزامنة قبول الطلب
   */
  async syncOrderAcceptance(orderData) {
    try {
      console.log('📦 Syncing order acceptance:', orderData);
      // TODO: استدعاء API الفعلي
      return true;
    } catch (error) {
      console.error('❌ فشل في مزامنة قبول الطلب:', error);
      return false;
    }
  }

  /**
   * مزامنة إكمال الطلب
   */
  async syncOrderCompletion(orderData) {
    try {
      console.log('✅ Syncing order completion:', orderData);
      // TODO: استدعاء API الفعلي
      return true;
    } catch (error) {
      console.error('❌ فشل في مزامنة إكمال الطلب:', error);
      return false;
    }
  }

  /**
   * مزامنة الرسائل
   */
  async syncMessage(messageData) {
    try {
      console.log('💬 Syncing message:', messageData);
      // TODO: استدعاء API الفعلي
      return true;
    } catch (error) {
      console.error('❌ فشل في مزامنة الرسالة:', error);
      return false;
    }
  }

  /**
   * مزامنة جميع البيانات المحفوظة
   */
  async syncOfflineData() {
    if (!this.isOnline) {
      console.log('📴 Cannot sync while offline');
      return;
    }

    try {
      console.log('🔄 Starting offline data sync...');
      const startTime = Date.now();

      // معالجة طابور العمليات
      const queueCopy = [...this.offlineQueue];
      let successCount = 0;
      let failureCount = 0;

      for (const queueItem of queueCopy) {
        const success = await this.processQueueItem(queueItem);
        if (success) {
          successCount++;
        } else {
          failureCount++;
        }
      }

      // تحديث آخر وقت مزامنة
      this.lastSyncTime = new Date();

      const duration = Date.now() - startTime;
      console.log(`✅ Sync completed: ${successCount} success, ${failureCount} failures (${duration}ms)`);

      this.notifyHandlers('onSyncCompleted', {
        successCount,
        failureCount,
        duration,
        timestamp: this.lastSyncTime
      });

    } catch (error) {
      console.error('❌ خطأ في مزامنة البيانات:', error);
      this.notifyHandlers('onSyncFailed', { error: error.message });
    }
  }

  /**
   * بدء المزامنة التلقائية
   */
  startAutoSync() {
    this.autoSyncInterval = setInterval(() => {
      if (this.isOnline && this.offlineQueue.length > 0) {
        this.syncOfflineData();
      }
    }, this.config.syncInterval);
  }

  /**
   * تحميل البيانات المحفوظة
   */
  async loadOfflineData() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => key.startsWith('offline_'));
      
      for (const storageKey of offlineKeys) {
        const key = storageKey.replace('offline_', '');
        const stored = await AsyncStorage.getItem(storageKey);
        
        if (stored) {
          const item = JSON.parse(stored);
          
          // فحص انتهاء الصلاحية
          if (Date.now() - item.timestamp < this.config.maxOfflineTime) {
            this.offlineData.set(key, item);
          } else {
            await AsyncStorage.removeItem(storageKey);
          }
        }
      }
      
      console.log(`📱 Loaded ${this.offlineData.size} offline data items`);
    } catch (error) {
      console.error('❌ خطأ في تحميل البيانات المحفوظة:', error);
    }
  }

  /**
   * تحميل طابور العمليات
   */
  async loadOfflineQueue() {
    try {
      const stored = await AsyncStorage.getItem('offline_queue');
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
        console.log(`📋 Loaded ${this.offlineQueue.length} queued operations`);
      }
    } catch (error) {
      console.error('❌ خطأ في تحميل طابور العمليات:', error);
    }
  }

  /**
   * حفظ طابور العمليات
   */
  async saveOfflineQueue() {
    try {
      await AsyncStorage.setItem('offline_queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('❌ خطأ في حفظ طابور العمليات:', error);
    }
  }

  /**
   * الحصول على تقرير حالة العمل بدون اتصال
   */
  getOfflineStatus() {
    return {
      isOnline: this.isOnline,
      cachedDataCount: this.offlineData.size,
      queuedOperations: this.offlineQueue.length,
      lastSyncTime: this.lastSyncTime,
      isHealthy: this.isOnline || this.offlineQueue.length < this.config.maxQueueSize / 2
    };
  }

  /**
   * تنظيف البيانات القديمة
   */
  async cleanupOldData() {
    const now = Date.now();
    let cleanedCount = 0;

    // تنظيف البيانات المحفوظة
    for (const [key, item] of this.offlineData) {
      if (now - item.timestamp > this.config.maxOfflineTime) {
        await this.removeOfflineData(key);
        cleanedCount++;
      }
    }

    // تنظيف العمليات القديمة من الطابور
    const oldQueueLength = this.offlineQueue.length;
    this.offlineQueue = this.offlineQueue.filter(item => 
      now - item.timestamp < this.config.maxOfflineTime
    );

    if (this.offlineQueue.length !== oldQueueLength) {
      await this.saveOfflineQueue();
      cleanedCount += oldQueueLength - this.offlineQueue.length;
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old offline items`);
    }
  }

  /**
   * إضافة معالج أحداث
   */
  addEventListener(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    }
  }

  /**
   * إزالة معالج أحداث
   */
  removeEventListener(event, handler) {
    if (this.eventHandlers[event]) {
      const index = this.eventHandlers[event].indexOf(handler);
      if (index > -1) {
        this.eventHandlers[event].splice(index, 1);
      }
    }
  }

  /**
   * إشعار المعالجات
   */
  notifyHandlers(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`❌ Error in ${event} handler:`, error);
        }
      });
    }
  }

  /**
   * إزالة جميع معالجات الأحداث
   */
  removeAllEventListeners() {
    try {
      // إزالة معالجات window events
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', this.handleOnlineStatusChange);
        window.removeEventListener('offline', this.handleOnlineStatusChange);
      }

      // تنظيف جميع معالجات الأحداث الداخلية
      for (const event in this.eventHandlers) {
        this.eventHandlers[event] = [];
      }

      // إيقاف المراقبة الدورية
      if (this.networkMonitorInterval) {
        clearInterval(this.networkMonitorInterval);
        this.networkMonitorInterval = null;
      }

      if (this.autoSyncInterval) {
        clearInterval(this.autoSyncInterval);
        this.autoSyncInterval = null;
      }

      console.log('🧹 All OfflineService event listeners removed');
    } catch (error) {
      console.error('❌ Error removing OfflineService listeners:', error);
    }
  }

  /**
   * تنظيف الموارد
   */
  cleanup() {
    this.removeAllEventListeners();
    this.offlineData.clear();
    this.offlineQueue = [];
    
    console.log('🧹 OfflineService cleaned up');
  }
}

// إنشاء نسخة وحيدة
const offlineService = new OfflineService();

export default offlineService;