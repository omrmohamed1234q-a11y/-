/**
 * خدمة مراقبة ومحسن الأداء للتطبيق المحمول
 * تشمل: caching، performance monitoring، memory management، offline support
 */

// استيراد AsyncStorage (safe loading)
let AsyncStorage;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default || require('@react-native-async-storage/async-storage');
  console.log('✅ AsyncStorage loaded successfully');
} catch (error) {
  // Fallback لبيئة الويب
  AsyncStorage = {
    getItem: (key) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
    removeItem: (key) => Promise.resolve(localStorage.removeItem(key)),
    clear: () => Promise.resolve(localStorage.clear())
  };
  console.warn('⚠️ AsyncStorage not available, using localStorage fallback');
}

class PerformanceService {
  constructor() {
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    this.performanceMetrics = new Map();
    this.memoryWarnings = [];
    this.isInitialized = false;
    
    // إعدادات Cache
    this.cacheConfig = {
      defaultTTL: 5 * 60 * 1000, // 5 دقائق
      maxCacheSize: 100, // أقصى عدد عناصر مخزنة
      enablePersistence: true // حفظ بعض البيانات محلياً
    };

    // إعدادات Performance Monitoring
    this.performanceConfig = {
      enableMetrics: true,
      sampleRate: 0.1, // 10% من العمليات
      memoryThreshold: 100 * 1024 * 1024, // 100 MB تحذير
      networkTimeout: 10000 // 10 ثوان timeout
    };

    // معالجات الأحداث
    this.eventHandlers = {
      onPerformanceWarning: [],
      onMemoryWarning: [],
      onCacheCleared: [],
      onOfflineModeChanged: []
    };
  }

  /**
   * تهيئة خدمة الأداء
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('⚡ تهيئة خدمة الأداء والتحسينات...');

      // تحميل البيانات المخزنة محلياً
      await this.loadPersistedCache();

      // مراقبة الذاكرة
      this.startMemoryMonitoring();

      // تنظيف دوري للـ cache
      this.startCacheCleanup();

      // مراقبة حالة الشبكة
      this.initializeNetworkMonitoring();

      this.isInitialized = true;
      console.log('✅ خدمة الأداء جاهزة للعمل');

    } catch (error) {
      console.error('❌ خطأ في تهيئة خدمة الأداء:', error);
    }
  }

  /**
   * نظام Cache ذكي مع TTL
   */
  async setCache(key, data, customTTL = null) {
    try {
      const ttl = customTTL || this.cacheConfig.defaultTTL;
      const timestamp = Date.now();
      
      // التحقق من حجم الـ cache
      if (this.cache.size >= this.cacheConfig.maxCacheSize) {
        await this.cleanOldestCacheItems(5); // إزالة أقدم 5 عناصر
      }

      this.cache.set(key, data);
      this.cacheTimestamps.set(key, timestamp + ttl);

      // حفظ محلياً للبيانات المهمة
      if (this.cacheConfig.enablePersistence && this.isImportantData(key)) {
        await this.persistCacheItem(key, data, timestamp + ttl);
      }

      console.log(`💾 Cached: ${key} (TTL: ${ttl}ms)`);
    } catch (error) {
      console.warn('⚠️ فشل في حفظ Cache:', error.message);
    }
  }

  /**
   * استرجاع من Cache مع فحص TTL
   */
  async getCache(key) {
    try {
      const now = Date.now();
      const expirationTime = this.cacheTimestamps.get(key);

      // فحص انتهاء الصلاحية
      if (expirationTime && now > expirationTime) {
        this.removeCache(key);
        return null;
      }

      // استرجاع من الذاكرة
      if (this.cache.has(key)) {
        console.log(`⚡ Cache hit: ${key}`);
        return this.cache.get(key);
      }

      // محاولة استرجاع من التخزين المحلي
      if (this.cacheConfig.enablePersistence) {
        const persistedData = await this.getPersistedCacheItem(key);
        if (persistedData) {
          this.cache.set(key, persistedData.data);
          this.cacheTimestamps.set(key, persistedData.expiration);
          console.log(`📱 Cache restored from storage: ${key}`);
          return persistedData.data;
        }
      }

      return null;
    } catch (error) {
      console.warn('⚠️ خطأ في استرجاع Cache:', error.message);
      return null;
    }
  }

  /**
   * إزالة عنصر من Cache
   */
  removeCache(key) {
    this.cache.delete(key);
    this.cacheTimestamps.delete(key);
    
    // إزالة من التخزين المحلي
    if (this.cacheConfig.enablePersistence) {
      AsyncStorage.removeItem(`cache_${key}`).catch(e => 
        console.warn('⚠️ Failed to remove persisted cache:', e.message)
      );
    }
  }

  /**
   * تنظيف Cache مع إشعار
   */
  async clearCache() {
    const size = this.cache.size;
    this.cache.clear();
    this.cacheTimestamps.clear();

    // تنظيف التخزين المحلي
    if (this.cacheConfig.enablePersistence) {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(key => key.startsWith('cache_'));
        await AsyncStorage.multiRemove(cacheKeys);
      } catch (error) {
        console.warn('⚠️ فشل في تنظيف التخزين المحلي:', error.message);
      }
    }

    console.log(`🧹 Cache cleared: ${size} items removed`);
    this.notifyHandlers('onCacheCleared', { itemsRemoved: size });
  }

  /**
   * مراقبة أداء العمليات
   */
  startPerformanceTimer(operationName) {
    if (!this.performanceConfig.enableMetrics) return null;
    
    const startTime = performance.now();
    const timerId = `${operationName}_${Date.now()}`;
    
    return {
      end: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        this.recordPerformanceMetric(operationName, duration);
        console.log(`⏱️ ${operationName}: ${duration.toFixed(2)}ms`);
        
        // تحذير للعمليات البطيئة
        if (duration > 1000) {
          this.notifyHandlers('onPerformanceWarning', {
            operation: operationName,
            duration: duration,
            threshold: 1000
          });
        }
        
        return duration;
      }
    };
  }

  /**
   * تسجيل مقياس الأداء
   */
  recordPerformanceMetric(operation, duration) {
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, {
        count: 0,
        totalTime: 0,
        averageTime: 0,
        maxTime: 0,
        minTime: Infinity
      });
    }

    const metrics = this.performanceMetrics.get(operation);
    metrics.count++;
    metrics.totalTime += duration;
    metrics.averageTime = metrics.totalTime / metrics.count;
    metrics.maxTime = Math.max(metrics.maxTime, duration);
    metrics.minTime = Math.min(metrics.minTime, duration);
  }

  /**
   * مراقبة الذاكرة (تقديرية)
   */
  startMemoryMonitoring() {
    setInterval(() => {
      // تقدير تقريبي للذاكرة المستخدمة
      const memoryEstimate = this.estimateMemoryUsage();
      
      if (memoryEstimate > this.performanceConfig.memoryThreshold) {
        this.memoryWarnings.push({
          timestamp: new Date(),
          usage: memoryEstimate,
          threshold: this.performanceConfig.memoryThreshold
        });

        console.warn(`⚠️ Memory warning: ${(memoryEstimate / 1024 / 1024).toFixed(1)} MB`);
        
        this.notifyHandlers('onMemoryWarning', {
          usage: memoryEstimate,
          threshold: this.performanceConfig.memoryThreshold
        });

        // تنظيف تلقائي
        this.performEmergencyCleanup();
      }
    }, 30000); // كل 30 ثانية
  }

  /**
   * تقدير استخدام الذاكرة
   */
  estimateMemoryUsage() {
    let estimate = 0;
    
    // تقدير حجم الـ cache
    for (const [key, value] of this.cache) {
      estimate += this.estimateObjectSize(value);
    }
    
    // إضافة تقدير للبيانات الأخرى
    estimate += this.estimateObjectSize(this.performanceMetrics);
    estimate += this.estimateObjectSize(this.memoryWarnings);
    
    return estimate;
  }

  /**
   * تقدير حجم الكائن (تقريبي)
   */
  estimateObjectSize(obj) {
    try {
      const jsonString = JSON.stringify(obj);
      return jsonString.length * 2; // تقدير تقريبي (UTF-16)
    } catch {
      return 1000; // تقدير افتراضي
    }
  }

  /**
   * تنظيف طارئ للذاكرة
   */
  async performEmergencyCleanup() {
    console.log('🚨 Emergency memory cleanup started...');
    
    // تنظيف نصف الـ cache
    const cacheSize = this.cache.size;
    await this.cleanOldestCacheItems(Math.floor(cacheSize / 2));
    
    // تنظيف تحذيرات الذاكرة القديمة
    this.memoryWarnings = this.memoryWarnings.slice(-10); // الاحتفاظ بآخر 10 فقط
    
    // تنظيف مقاييس الأداء القديمة
    for (const [operation, metrics] of this.performanceMetrics) {
      if (metrics.count > 1000) {
        // إعادة تعيين المقاييس للعمليات التي لها عدد كبير
        this.performanceMetrics.set(operation, {
          count: 1,
          totalTime: metrics.averageTime,
          averageTime: metrics.averageTime,
          maxTime: metrics.averageTime,
          minTime: metrics.averageTime
        });
      }
    }
    
    console.log('✅ Emergency cleanup completed');
  }

  /**
   * تنظيف أقدم عناصر الـ cache
   */
  async cleanOldestCacheItems(count) {
    const sortedItems = Array.from(this.cacheTimestamps.entries())
      .sort((a, b) => a[1] - b[1]) // ترتيب حسب وقت انتهاء الصلاحية
      .slice(0, count);

    for (const [key] of sortedItems) {
      this.removeCache(key);
    }

    console.log(`🧹 Cleaned ${count} oldest cache items`);
  }

  /**
   * مراقبة حالة الشبكة
   */
  initializeNetworkMonitoring() {
    // Web environment
    if (typeof window !== 'undefined' && 'navigator' in window) {
      window.addEventListener('online', () => {
        console.log('🌐 Network: Online');
        this.notifyHandlers('onOfflineModeChanged', { isOffline: false });
      });

      window.addEventListener('offline', () => {
        console.log('📴 Network: Offline');
        this.notifyHandlers('onOfflineModeChanged', { isOffline: true });
      });
    }
  }

  /**
   * فحص ما إذا كانت البيانات مهمة للحفظ المحلي
   */
  isImportantData(key) {
    const importantKeys = [
      'captain_profile',
      'captain_stats',
      'recent_orders',
      'app_settings',
      'performance_metrics'
    ];
    
    return importantKeys.some(importantKey => key.includes(importantKey));
  }

  /**
   * حفظ عنصر cache محلياً
   */
  async persistCacheItem(key, data, expiration) {
    try {
      const cacheItem = {
        data: data,
        expiration: expiration,
        timestamp: Date.now()
      };
      
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('⚠️ فشل في حفظ Cache محلياً:', error.message);
    }
  }

  /**
   * استرجاع عنصر cache من التخزين المحلي
   */
  async getPersistedCacheItem(key) {
    try {
      const item = await AsyncStorage.getItem(`cache_${key}`);
      if (item) {
        const parsed = JSON.parse(item);
        
        // فحص انتهاء الصلاحية
        if (Date.now() > parsed.expiration) {
          await AsyncStorage.removeItem(`cache_${key}`);
          return null;
        }
        
        return parsed;
      }
      return null;
    } catch (error) {
      console.warn('⚠️ فشل في استرجاع Cache من التخزين:', error.message);
      return null;
    }
  }

  /**
   * تحميل Cache المحفوظ محلياً
   */
  async loadPersistedCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      
      for (const storageKey of cacheKeys) {
        const cacheKey = storageKey.replace('cache_', '');
        const item = await this.getPersistedCacheItem(cacheKey);
        
        if (item) {
          this.cache.set(cacheKey, item.data);
          this.cacheTimestamps.set(cacheKey, item.expiration);
        }
      }
      
      console.log(`📱 Loaded ${cacheKeys.length} persisted cache items`);
    } catch (error) {
      console.warn('⚠️ فشل في تحميل Cache المحفوظ:', error.message);
    }
  }

  /**
   * تنظيف دوري للـ cache
   */
  startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      const expiredKeys = [];
      
      for (const [key, expiration] of this.cacheTimestamps) {
        if (now > expiration) {
          expiredKeys.push(key);
        }
      }
      
      for (const key of expiredKeys) {
        this.removeCache(key);
      }
      
      if (expiredKeys.length > 0) {
        console.log(`🧹 Auto-cleaned ${expiredKeys.length} expired cache items`);
      }
    }, 2 * 60 * 1000); // كل دقيقتين
  }

  /**
   * الحصول على إحصائيات الأداء
   */
  getPerformanceReport() {
    const cacheStats = {
      size: this.cache.size,
      hitRatio: this.calculateCacheHitRatio(),
      memoryUsage: this.estimateMemoryUsage()
    };

    const performanceStats = Object.fromEntries(
      Array.from(this.performanceMetrics.entries()).map(([key, metrics]) => [
        key,
        {
          ...metrics,
          averageTime: Math.round(metrics.averageTime * 100) / 100
        }
      ])
    );

    return {
      cache: cacheStats,
      performance: performanceStats,
      memoryWarnings: this.memoryWarnings.length,
      isHealthy: this.isSystemHealthy()
    };
  }

  /**
   * حساب نسبة نجاح الـ cache
   */
  calculateCacheHitRatio() {
    // This is a simplified version - in production you'd track hits/misses
    return this.cache.size > 0 ? 0.85 : 0; // تقدير
  }

  /**
   * فحص صحة النظام
   */
  isSystemHealthy() {
    const memoryUsage = this.estimateMemoryUsage();
    const recentWarnings = this.memoryWarnings.filter(
      w => Date.now() - w.timestamp.getTime() < 5 * 60 * 1000
    ).length;

    return memoryUsage < this.performanceConfig.memoryThreshold && recentWarnings < 3;
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
    for (const event in this.eventHandlers) {
      this.eventHandlers[event] = [];
    }
    console.log('🧹 PerformanceService: All event listeners removed');
  }

  /**
   * تنظيف الموارد
   */
  cleanup() {
    this.clearCache();
    this.performanceMetrics.clear();
    this.memoryWarnings = [];
    
    // تنظيف المعالجات
    this.removeAllEventListeners();
    
    console.log('🧹 PerformanceService cleaned up');
  }
}

// إنشاء نسخة وحيدة
const performanceService = new PerformanceService();

export default performanceService;