/**
 * خدمة إدارة الإشعارات المحلية للكابتن
 * تدير حفظ واسترجاع وعرض الإشعارات في التطبيق المحمول
 */

// استيراد آمن لـ AsyncStorage للحفظ المحلي
let AsyncStorage = null;
try {
  // محاولة استيراد AsyncStorage من React Native
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (error) {
  console.warn('⚠️ AsyncStorage not available, using fallback storage');
}

class NotificationService {
  constructor() {
    this.notifications = [];
    this.isInitialized = false;
    this.storageKey = 'captain_notifications';
    this.maxStoredNotifications = 100;
    
    // معالجات الأحداث
    this.eventHandlers = {
      onNewNotification: [],
      onNotificationRead: [],
      onNotificationDeleted: []
    };
  }

  /**
   * تهيئة خدمة الإشعارات
   */
  async initialize() {
    try {
      console.log('🔔 تهيئة خدمة الإشعارات...');
      
      // تحميل الإشعارات المحفوظة
      await this.loadStoredNotifications();
      
      // تهيئة إشعارات النظام (إذا متوفرة)
      await this.initializeSystemNotifications();
      
      this.isInitialized = true;
      console.log('✅ خدمة الإشعارات جاهزة');
      
    } catch (error) {
      console.error('❌ خطأ في تهيئة خدمة الإشعارات:', error);
    }
  }

  /**
   * تهيئة إشعارات النظام المحلية
   */
  async initializeSystemNotifications() {
    try {
      // في بيئة React Native، يمكن استخدام مكتبة إشعارات محلية
      // هنا نضع placeholder للتهيئة المستقبلية
      console.log('📱 تهيئة إشعارات النظام المحلية...');
      
      // TODO: إضافة مكتبة local notifications مثل:
      // - @react-native-async-storage/async-storage
      // - react-native-push-notification  
      // - @react-native-community/push-notification-ios
      
    } catch (error) {
      console.warn('⚠️ لا يمكن تهيئة إشعارات النظام:', error.message);
    }
  }

  /**
   * تحميل الإشعارات المحفوظة
   */
  async loadStoredNotifications() {
    try {
      let storedData = null;
      
      if (AsyncStorage) {
        // React Native - استخدام AsyncStorage
        const stored = await AsyncStorage.getItem(this.storageKey);
        storedData = stored ? JSON.parse(stored) : [];
      } else {
        // Web fallback - استخدام localStorage
        if (typeof localStorage !== 'undefined') {
          const stored = localStorage.getItem(this.storageKey);
          storedData = stored ? JSON.parse(stored) : [];
        } else {
          storedData = [];
        }
      }
      
      // تحويل timestamps إلى Date objects
      this.notifications = storedData.map(notification => ({
        ...notification,
        timestamp: new Date(notification.timestamp)
      }));
      
      console.log(`📋 تم تحميل ${this.notifications.length} إشعار محفوظ`);
      
    } catch (error) {
      console.error('❌ خطأ في تحميل الإشعارات:', error);
      this.notifications = [];
    }
  }

  /**
   * حفظ الإشعارات في التخزين المحلي
   */
  async saveNotifications(notifications = null) {
    try {
      const toSave = notifications || this.notifications;
      
      // تحويل Date objects إلى strings للحفظ
      const serializable = toSave.map(notification => ({
        ...notification,
        timestamp: notification.timestamp.toISOString()
      }));
      
      if (AsyncStorage) {
        // React Native
        await AsyncStorage.setItem(this.storageKey, JSON.stringify(serializable));
      } else {
        // Web fallback
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(this.storageKey, JSON.stringify(serializable));
        }
      }
      
      console.log(`💾 تم حفظ ${serializable.length} إشعار`);
      
    } catch (error) {
      console.error('❌ خطأ في حفظ الإشعارات:', error);
    }
  }

  /**
   * الحصول على الإشعارات المحفوظة
   */
  async getStoredNotifications() {
    if (!this.isInitialized) {
      await this.loadStoredNotifications();
    }
    
    return this.notifications;
  }

  /**
   * إضافة إشعار جديد
   */
  addNotification(notification) {
    // التأكد من وجود id فريد
    if (!notification.id) {
      notification.id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // إضافة timestamp إذا لم يوجد
    if (!notification.timestamp) {
      notification.timestamp = new Date();
    }
    
    // إضافة للقائمة (الأحدث أولاً)
    this.notifications.unshift(notification);
    
    // الاحتفاظ بعدد محدود من الإشعارات
    if (this.notifications.length > this.maxStoredNotifications) {
      this.notifications = this.notifications.slice(0, this.maxStoredNotifications);
    }
    
    // حفظ في التخزين
    this.saveNotifications();
    
    // إشعار المستمعين
    this.notifyHandlers('onNewNotification', notification);
    
    console.log('✅ تم إضافة إشعار جديد:', notification.title);
    
    return notification.id;
  }

  /**
   * عرض إشعار محلي - Production Implementation
   */
  async showLocalNotification(title, message, data = null) {
    try {
      console.log('🔔 عرض إشعار محلي:', { title, message });
      
      // Method 1: Web Browser Notifications API
      if (typeof window !== 'undefined' && 'Notification' in window) {
        // Request permission if not granted
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.warn('⚠️ Notification permission denied');
            return this.showInAppToast(title, message, data);
          }
        }
        
        if (Notification.permission === 'granted') {
          const notification = new Notification(title, {
            body: message,
            icon: '/icon-192.png', // App icon
            badge: '/icon-180.png',
            data: data,
            tag: data?.id || `notif_${Date.now()}`, // Prevent duplicate notifications
            renotify: true,
            silent: false,
            timestamp: Date.now()
          });
          
          // Handle notification click
          notification.onclick = () => {
            console.log('🔔 Notification clicked:', { title, message, data });
            window.focus(); // Bring app to focus
            notification.close();
            
            // Trigger notification click handlers
            this.notifyHandlers('onNotificationClick', { title, message, data });
          };
          
          // Auto-close after 10 seconds
          setTimeout(() => {
            notification.close();
          }, 10000);
          
          console.log('✅ Browser notification displayed successfully');
          return true;
        }
      }
      
      // Method 2: React Native Local Notifications (if available)
      if (typeof require !== 'undefined') {
        try {
          // Try to use React Native local notifications
          const PushNotification = require('react-native-push-notification');
          
          PushNotification.localNotification({
            title: title,
            message: message,
            data: data,
            playSound: true,
            soundName: 'default',
            vibrate: true,
            vibration: 300,
            ongoing: false,
            priority: 'high',
            visibility: 'public',
            importance: 'high',
            allowWhileIdle: true,
            ignoreInForeground: false,
            shortcutId: 'captain_notifications',
            channelId: 'captain_notifications',
            id: data?.id || Math.floor(Math.random() * 1000000)
          });
          
          console.log('✅ React Native notification sent successfully');
          return true;
        } catch (rnError) {
          console.warn('⚠️ React Native notifications not available:', rnError.message);
        }
      }
      
      // Method 3: Web Push API (Service Worker)
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, {
            body: message,
            icon: '/icon-192.png',
            badge: '/icon-180.png',
            data: data,
            tag: data?.id || `notif_${Date.now()}`,
            renotify: true,
            requireInteraction: true,
            actions: [
              {
                action: 'view',
                title: 'عرض',
                icon: '/icon-32.png'
              },
              {
                action: 'dismiss',
                title: 'إغلاق',
                icon: '/icon-32.png'
              }
            ]
          });
          
          console.log('✅ Service Worker notification displayed successfully');
          return true;
        } catch (swError) {
          console.warn('⚠️ Service Worker notifications failed:', swError.message);
        }
      }
      
      // Method 4: Custom In-App Toast Notification (Fallback)
      return this.showInAppToast(title, message, data);
      
    } catch (error) {
      console.error('❌ خطأ في عرض الإشعار المحلي:', error);
      // Fallback to in-app toast
      return this.showInAppToast(title, message, data);
    }
  }

  /**
   * عرض إشعار داخل التطبيق كـ fallback
   */
  showInAppToast(title, message, data = null) {
    try {
      // Create toast notification element
      if (typeof document !== 'undefined') {
        const toast = document.createElement('div');
        toast.className = 'captain-notification-toast';
        toast.innerHTML = `
          <div class="notification-header">
            <strong>🔔 ${title}</strong>
            <button class="close-btn" onclick="this.parentElement.parentElement.remove()">×</button>
          </div>
          <div class="notification-body">${message}</div>
          <div class="notification-time">${new Date().toLocaleTimeString('ar-EG')}</div>
        `;
        
        // Add styles
        toast.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          z-index: 10000;
          max-width: 350px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          animation: slideInRight 0.3s ease-out;
          border: 1px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(10px);
        `;
        
        // Add animation keyframes if not exists
        if (!document.querySelector('#captain-notification-styles')) {
          const style = document.createElement('style');
          style.id = 'captain-notification-styles';
          style.textContent = `
            @keyframes slideInRight {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
            .notification-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
            }
            .close-btn {
              background: none;
              border: none;
              color: white;
              font-size: 18px;
              cursor: pointer;
              padding: 0;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .close-btn:hover {
              background: rgba(255,255,255,0.2);
            }
            .notification-body {
              margin-bottom: 8px;
              font-size: 14px;
              line-height: 1.4;
            }
            .notification-time {
              font-size: 12px;
              opacity: 0.8;
              text-align: right;
            }
          `;
          document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
          if (toast.parentNode) {
            toast.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => toast.remove(), 300);
          }
        }, 8000);
        
        // Click to remove
        toast.addEventListener('click', () => {
          toast.style.animation = 'slideInRight 0.3s ease-out reverse';
          setTimeout(() => toast.remove(), 300);
        });
        
        console.log('✅ In-app toast notification displayed');
        return true;
      } else {
        // Pure console fallback
        console.log(`📱 NOTIFICATION: ${title} - ${message}`);
        console.log(`📱 Time: ${new Date().toLocaleTimeString('ar-EG')}`);
        if (data) {
          console.log(`📱 Data:`, data);
        }
        return true;
      }
      
    } catch (error) {
      console.error('❌ خطأ في عرض الإشعار داخل التطبيق:', error);
      // Final fallback
      console.log(`📱 FALLBACK NOTIFICATION: ${title} - ${message}`);
      return false;
    }
  }

  /**
   * تحديد إشعار كمقروء
   */
  markAsRead(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.notifications[index].isRead = true;
      this.saveNotifications();
      this.notifyHandlers('onNotificationRead', this.notifications[index]);
    }
  }

  /**
   * تحديد جميع الإشعارات كمقروءة
   */
  markAllAsRead() {
    this.notifications.forEach(notification => {
      notification.isRead = true;
    });
    this.saveNotifications();
  }

  /**
   * حذف إشعار
   */
  deleteNotification(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      const deleted = this.notifications.splice(index, 1)[0];
      this.saveNotifications();
      this.notifyHandlers('onNotificationDeleted', deleted);
    }
  }

  /**
   * حذف جميع الإشعارات
   */
  clearAllNotifications() {
    this.notifications = [];
    this.saveNotifications();
  }

  /**
   * الحصول على عدد الإشعارات غير المقروءة
   */
  getUnreadCount() {
    return this.notifications.filter(n => !n.isRead).length;
  }

  /**
   * الحصول على الإشعارات حسب النوع
   */
  getNotificationsByType(type) {
    return this.notifications.filter(n => n.type === type);
  }

  /**
   * الحصول على الإشعارات الحديثة (آخر 24 ساعة)
   */
  getRecentNotifications() {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.notifications.filter(n => n.timestamp > dayAgo);
  }

  /**
   * تنظيف الإشعارات القديمة
   */
  cleanupOldNotifications(daysToKeep = 30) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const before = this.notifications.length;
    
    this.notifications = this.notifications.filter(n => n.timestamp > cutoffDate);
    
    const removed = before - this.notifications.length;
    if (removed > 0) {
      console.log(`🧹 تم حذف ${removed} إشعار قديم`);
      this.saveNotifications();
    }
  }

  /**
   * تسجيل معالج حدث
   */
  addEventListener(eventType, handler) {
    if (this.eventHandlers[eventType]) {
      this.eventHandlers[eventType].push(handler);
    } else {
      // إضافة event types جديدة إذا لم تكن موجودة
      this.eventHandlers[eventType] = [handler];
    }
  }

  /**
   * إلغاء تسجيل معالج حدث
   */
  removeEventListener(eventType, handler) {
    if (this.eventHandlers[eventType]) {
      const index = this.eventHandlers[eventType].indexOf(handler);
      if (index > -1) {
        this.eventHandlers[eventType].splice(index, 1);
      }
    }
  }

  /**
   * إشعار معالجات الأحداث
   */
  notifyHandlers(eventType, data) {
    if (this.eventHandlers[eventType]) {
      this.eventHandlers[eventType].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`❌ خطأ في معالج الحدث ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * إحصائيات الإشعارات
   */
  getStats() {
    return {
      total: this.notifications.length,
      unread: this.getUnreadCount(),
      byType: {
        new_order: this.getNotificationsByType('new_order').length,
        order_update: this.getNotificationsByType('order_update').length,
        system: this.getNotificationsByType('system').length,
        location: this.getNotificationsByType('location').length
      },
      recent: this.getRecentNotifications().length
    };
  }
}

// إنشاء نسخة واحدة من الخدمة
const notificationService = new NotificationService();

export default notificationService;