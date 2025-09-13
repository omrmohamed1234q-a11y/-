/**
 * خدمة الكابتن الرئيسية - تدمج جميع الخدمات الفرعية
 * تدير حالة الكابتن والتكامل مع النظام الحقيقي - React Native Compatible
 */

import apiService from './apiService.js';
import webSocketService from './webSocketService.js';
import locationService from './locationService.js';

class CaptainService {
  constructor() {
    // حالة الكابتن
    this.captain = null;
    this.isAuthenticated = false;
    this.isOnline = false;
    this.isAvailable = true;
    
    // بيانات التطبيق
    this.orders = [];
    this.activeOrder = null;
    this.dailyStats = {
      orders: 0,
      earnings: 0,
      distance: 0,
      onlineTime: 0
    };
    
    // callbacks للأحداث
    this.eventHandlers = {
      onAuthChange: [],
      onOrdersUpdate: [],
      onNewOrder: [],
      onStatsUpdate: [],
      onLocationUpdate: [],
      onConnectionChange: []
    };
    
    // تهيئة الخدمات
    this.initializeServices();
  }

  /**
   * تهيئة الخدمات الفرعية
   */
  initializeServices() {
    // تهيئة WebSocket مع المعالجات الجديدة
    webSocketService.addConnectionListener('onConnect', () => {
      console.log('🔗 WebSocket connected');
      this.notifyHandlers('onConnectionChange', { isConnected: true });
    });
    
    webSocketService.addConnectionListener('onDisconnect', () => {
      console.log('❌ WebSocket disconnected');
      this.notifyHandlers('onConnectionChange', { isConnected: false });
    });

    webSocketService.addConnectionListener('onAuthenticated', (data) => {
      console.log('✅ WebSocket authenticated successfully');
      this.notifyHandlers('onConnectionChange', { 
        isConnected: true, 
        isAuthenticated: true 
      });
    });

    webSocketService.addConnectionListener('onAuthFailed', (data) => {
      console.error('❌ WebSocket authentication failed');
      this.notifyHandlers('onConnectionChange', { 
        isConnected: false, 
        isAuthenticated: false,
        error: 'Authentication failed'
      });
    });

    // الاستماع للطلبات الجديدة
    webSocketService.addEventListener('new_order_available', (orderData) => {
      this.handleNewOrder(orderData);
    });

    // الاستماع لتحديثات الطلبات
    webSocketService.addEventListener('order_status_update', (updateData) => {
      this.handleOrderUpdate(updateData);
    });

    // تهيئة خدمة الموقع
    locationService.addLocationUpdateListener((location) => {
      this.handleLocationUpdate(location);
    });

    locationService.addLocationErrorListener((error, message) => {
      console.error('❌ Location error:', message, error);
    });
  }

  /**
   * تسجيل دخول الكابتن
   */
  async login(username, password, driverCode = null) {
    try {
      console.log('🔐 Attempting captain login:', username);
      
      // Initialize ApiService first
      await apiService.initialize();
      
      // محاولة التسجيل الآمن أولاً
      let response = await apiService.secureLogin(username, password, driverCode);
      
      if (!response.success) {
        // محاولة التسجيل العادي كـ fallback
        console.log('🔄 Trying regular login...');
        response = await apiService.regularLogin(username, password);
      }

      if (response.success) {
        // Get captain data from ApiService
        this.captain = apiService.getCaptainData();
        this.isAuthenticated = true;
        
        console.log('✅ Login successful:', this.captain?.username);

        // Connect to WebSocket with proper auth data
        this.connectWebSocket();

        // بدء تتبع الموقع إذا كان الكابتن متاح
        if (this.isAvailable) {
          await this.startLocationTracking();
        }

        // جلب الطلبات المتاحة
        await this.refreshOrders();

        // إخطار المستمعين
        this.notifyHandlers('onAuthChange', { 
          isAuthenticated: true, 
          captain: this.captain 
        });

        return { success: true, captain: this.captain };

      } else {
        throw new Error(response.error || 'Login failed');
      }

    } catch (error) {
      console.error('❌ Login failed:', error);
      return { 
        success: false, 
        error: error.message || 'Connection error' 
      };
    }
  }

  /**
   * تسجيل خروج الكابتن
   */
  async logout() {
    console.log('🚪 Captain logout...');

    // إيقاف جميع الخدمات
    webSocketService.disconnect();
    await locationService.stopTracking();
    
    // مسح البيانات
    this.captain = null;
    this.isAuthenticated = false;
    this.isOnline = false;
    this.orders = [];
    this.activeOrder = null;

    // مسح خدمة API
    await apiService.logout();

    // إخطار المستمعين
    this.notifyHandlers('onAuthChange', { 
      isAuthenticated: false, 
      captain: null 
    });
  }

  /**
   * الاتصال بـ WebSocket مع JWT token صحيح
   */
  connectWebSocket() {
    const authToken = apiService.getAuthToken();
    const captainData = apiService.getCaptainData();
    
    if (this.captain && authToken) {
      const baseURL = apiService.baseURL;
      console.log('🔗 Connecting WebSocket with JWT token');
      webSocketService.connect(baseURL, authToken, this.captain.id, captainData);
    } else {
      console.error('❌ Cannot connect WebSocket - missing auth token or captain data');
    }
  }

  /**
   * بدء تتبع الموقع
   */
  async startLocationTracking() {
    try {
      const success = await locationService.startTracking();
      if (success) {
        console.log('📍 Location tracking started');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to start location tracking:', error);
    }
    return false;
  }

  /**
   * تحديث حالة الكابتن (متاح/غير متاح)
   */
  async setAvailability(isAvailable) {
    this.isAvailable = isAvailable;
    this.isOnline = isAvailable;

    // إرسال تحديث الحالة عبر WebSocket
    if (webSocketService.isHealthy()) {
      webSocketService.sendStatusUpdate(
        isAvailable ? 'online' : 'offline',
        isAvailable
      );
    }

    // بدء أو إيقاف تتبع الموقع
    if (isAvailable) {
      await this.startLocationTracking();
    } else {
      await locationService.stopTracking();
    }

    console.log(`📱 Captain status updated: ${isAvailable ? 'available' : 'unavailable'}`);
  }

  /**
   * معالج تحديث الموقع
   */
  async handleLocationUpdate(location) {
    if (this.captain && this.isOnline) {
      try {
        // إرسال الموقع للخادم عبر API
        await apiService.updateLocation(this.captain.id, location);
        
        // إرسال الموقع عبر WebSocket للتحديث المباشر
        if (webSocketService.isHealthy()) {
          webSocketService.sendLocationUpdate(location);
        }

        // إخطار المستمعين
        this.notifyHandlers('onLocationUpdate', location);

      } catch (error) {
        console.error('❌ Failed to send location update:', error);
      }
    }
  }

  /**
   * جلب الطلبات المتاحة
   */
  async refreshOrders() {
    if (!this.captain) return;

    try {
      const response = await apiService.getAvailableOrders(this.captain.id);
      
      if (response.success && response.orders) {
        this.orders = response.orders;
        console.log(`📋 Fetched ${this.orders.length} available orders`);
        
        // إخطار المستمعين
        this.notifyHandlers('onOrdersUpdate', this.orders);
      }

    } catch (error) {
      console.error('❌ Failed to fetch orders:', error);
    }
  }

  /**
   * قبول طلب
   */
  async acceptOrder(orderId) {
    if (!this.captain) return { success: false, error: 'Not logged in' };

    try {
      const response = await apiService.acceptOrder(this.captain.id, orderId);
      
      if (response.success) {
        // تحديث الطلب النشط
        this.activeOrder = this.orders.find(order => order.id === orderId);
        
        // إزالة الطلب من القائمة المتاحة
        this.orders = this.orders.filter(order => order.id !== orderId);
        
        console.log('✅ Order accepted:', orderId);
        
        // إخطار المستمعين
        this.notifyHandlers('onOrdersUpdate', this.orders);
        
        return response;
      } else {
        throw new Error(response.error || 'Failed to accept order');
      }

    } catch (error) {
      console.error('❌ Failed to accept order:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * تحديث حالة طلب
   */
  async updateOrderStatus(orderId, status, notes = null, location = null) {
    if (!this.captain) return { success: false, error: 'Not logged in' };

    try {
      const response = await apiService.updateOrderStatus(
        this.captain.id, 
        orderId, 
        status, 
        notes, 
        location
      );
      
      if (response.success) {
        // تحديث الطلب النشط إذا كان نفس الطلب
        if (this.activeOrder && this.activeOrder.id === orderId) {
          this.activeOrder.status = status;
        }
        
        console.log('✅ Order status updated:', orderId, status);
        return response;
      } else {
        throw new Error(response.error || 'Failed to update order status');
      }

    } catch (error) {
      console.error('❌ Failed to update order status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * معالج الطلب الجديد
   */
  handleNewOrder(orderData) {
    console.log('🚚 New order available:', orderData);
    
    // إضافة الطلب للقائمة
    this.orders.push(orderData);
    
    // إخطار المستمعين
    this.notifyHandlers('onNewOrder', orderData);
    this.notifyHandlers('onOrdersUpdate', this.orders);
  }

  /**
   * معالج تحديث الطلب
   */
  handleOrderUpdate(updateData) {
    console.log('📱 Order update received:', updateData);
    
    // تحديث الطلب في القائمة أو الطلب النشط
    const orderId = updateData.orderId || updateData.id;
    
    if (this.activeOrder && this.activeOrder.id === orderId) {
      Object.assign(this.activeOrder, updateData);
    }
    
    const orderIndex = this.orders.findIndex(order => order.id === orderId);
    if (orderIndex >= 0) {
      Object.assign(this.orders[orderIndex], updateData);
    }
    
    // إخطار المستمعين
    this.notifyHandlers('onOrdersUpdate', this.orders);
  }

  /**
   * جلب إحصائيات الكابتن
   */
  async getStats() {
    if (!this.captain) return null;

    try {
      const response = await apiService.getCaptainStats(this.captain.id);
      
      if (response.success && response.stats) {
        this.dailyStats = response.stats;
        
        // إخطار المستمعين
        this.notifyHandlers('onStatsUpdate', this.dailyStats);
        
        return this.dailyStats;
      }

    } catch (error) {
      console.error('❌ Failed to fetch stats:', error);
    }
    
    return this.dailyStats;
  }

  /**
   * تحديث العارض للحدث
   */
  addEventListener(eventType, handler) {
    if (!this.eventHandlers[eventType]) {
      this.eventHandlers[eventType] = [];
    }
    this.eventHandlers[eventType].push(handler);
  }

  /**
   * إزالة العارض للحدث
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
   * إخطار المعالجات
   */
  notifyHandlers(eventType, data) {
    if (this.eventHandlers[eventType]) {
      this.eventHandlers[eventType].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`❌ Error in ${eventType} handler:`, error);
        }
      });
    }
  }

  /**
   * تحميل بيانات المصادقة المحفوظة
   */
  async loadSavedAuth() {
    try {
      await apiService.initialize();
      
      if (apiService.isAuthenticated()) {
        this.captain = apiService.getCaptainData();
        this.isAuthenticated = true;
        
        console.log('📱 Restored saved authentication:', this.captain?.username);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Failed to load saved auth:', error);
      return false;
    }
  }

  /**
   * الحصول على حالة الكابتن
   */
  getState() {
    return {
      captain: this.captain,
      isAuthenticated: this.isAuthenticated,
      isOnline: this.isOnline,
      isAvailable: this.isAvailable,
      orders: this.orders,
      activeOrder: this.activeOrder,
      dailyStats: this.dailyStats,
      connectionState: webSocketService.getConnectionState(),
      locationTracking: locationService.isLocationTracking()
    };
  }

  /**
   * تنظيف الموارد
   */
  async cleanup() {
    await this.logout();
    await locationService.cleanup();
    webSocketService.disconnect();
    
    // مسح المعالجات
    Object.keys(this.eventHandlers).forEach(key => {
      this.eventHandlers[key] = [];
    });
  }
}

// إنشاء instance واحد للاستخدام في التطبيق
const captainService = new CaptainService();

export default captainService;
export { CaptainService };