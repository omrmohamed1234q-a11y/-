/**
 * خدمة WebSocket للتحديثات المباشرة في التطبيق المحمول
 * تتعامل مع الطلبات الجديدة وتحديثات الحالة - React Native Compatible
 */

class WebSocketService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.isAuthenticated = false;
    this.reconnectTimeout = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000;
    
    // Connection data for reconnection
    this.connectionData = {
      baseURL: null,
      authToken: null,
      captainId: null,
      captainData: null
    };
    
    // callbacks للأحداث المختلفة
    this.eventHandlers = {};
    this.connectionHandlers = {
      onConnect: [],
      onDisconnect: [],
      onError: [],
      onAuthenticated: [],
      onAuthFailed: []
    };
  }

  /**
   * الاتصال بـ WebSocket server مع authentication صحيح
   */
  connect(baseURL, authToken, captainId, captainData = null) {
    // Save connection data for reconnection
    this.connectionData = { baseURL, authToken, captainId, captainData };
    
    try {
      // استخراج الـ host من baseURL
      const url = new URL(baseURL);
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsURL = `${wsProtocol}//${url.host}/`;

      console.log('🔗 Connecting to WebSocket...', wsURL);

      // إنشاء اتصال WebSocket جديد بدون query parameters
      this.ws = new WebSocket(wsURL);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      
    } catch (error) {
      console.error('❌ فشل في إنشاء اتصال WebSocket:', error);
      this.handleError(error);
    }
  }

  /**
   * معالج فتح الاتصال - يرسل authenticate message
   */
  handleOpen(event) {
    console.log('✅ WebSocket connected successfully');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    // إشعار المستمعين بالاتصال
    this.connectionHandlers.onConnect.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('❌ خطأ في معالج الاتصال:', error);
      }
    });

    // إرسال رسالة authenticate فوراً بعد الاتصال
    this.authenticate();
  }

  /**
   * إرسال رسالة authenticate للخادم
   */
  authenticate() {
    console.log('🔐 authenticate() called with connection data:', {
      hasAuthToken: !!this.connectionData.authToken,
      hasCaptainId: !!this.connectionData.captainId,
      authTokenLength: this.connectionData.authToken?.length || 0,
      captainId: this.connectionData.captainId,
      baseURL: this.connectionData.baseURL
    });
    
    if (!this.connectionData.authToken || !this.connectionData.captainId) {
      console.error('⚠️ No valid JWT token available for WebSocket authentication');
      console.error('  - authToken exists:', !!this.connectionData.authToken);
      console.error('  - captainId exists:', !!this.connectionData.captainId);
      console.error('  - connectionData keys:', Object.keys(this.connectionData));
      return;
    }

    const authMessage = {
      type: 'authenticate',
      data: {
        userId: this.connectionData.captainId,
        userType: 'captain',
        token: this.connectionData.authToken
      }
    };

    console.log('🔐 Sending authentication message...');
    this.sendMessage(authMessage);
  }

  /**
   * معالج إغلاق الاتصال
   */
  handleClose(event) {
    console.log('❌ WebSocket connection closed:', event.code, event.reason);
    this.isConnected = false;
    this.isAuthenticated = false;
    
    // إشعار المستمعين بقطع الاتصال
    this.connectionHandlers.onDisconnect.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('❌ خطأ في معالج قطع الاتصال:', error);
      }
    });

    // محاولة إعادة الاتصال التلقائي
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  /**
   * معالج الأخطاء
   */
  handleError(error) {
    console.error('💥 خطأ WebSocket:', error);
    
    this.connectionHandlers.onError.forEach(handler => {
      try {
        handler(error);
      } catch (handlerError) {
        console.error('❌ خطأ في معالج الأخطاء:', handlerError);
      }
    });
  }

  /**
   * معالج الرسائل الواردة
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      console.log('📨 WebSocket message received:', data);

      const { type } = data;
      
      // معالجة رسائل النظام أولاً
      switch (type) {
        case 'authenticated':
          this.handleAuthenticated(data);
          break;
          
        case 'auth_failed':
          this.handleAuthFailed(data);
          break;
          
        default:
          // استدعاء المعالجات المخصصة
          if (this.eventHandlers[type]) {
            this.eventHandlers[type].forEach(handler => {
              try {
                handler(data);
              } catch (error) {
                console.error(`❌ خطأ في معالج ${type}:`, error);
              }
            });
          }
          
          // معالجة أحداث خاصة
          this.handleSpecialEvents(data);
          break;
      }
      
    } catch (error) {
      console.error('❌ خطأ في معالجة رسالة WebSocket:', error);
    }
  }

  /**
   * معالج نجاح المصادقة
   */
  handleAuthenticated(data) {
    console.log('✅ WebSocket authentication successful:', data);
    this.isAuthenticated = true;
    
    // إشعار المستمعين بنجاح المصادقة
    this.connectionHandlers.onAuthenticated.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('❌ خطأ في معالج المصادقة الناجحة:', error);
      }
    });

    // إرسال رسالة captain_online بعد المصادقة الناجحة
    this.sendMessage({
      type: 'captain_online',
      captainId: this.connectionData.captainId,
      timestamp: Date.now(),
      status: 'available'
    });
  }

  /**
   * معالج فشل المصادقة
   */
  handleAuthFailed(data) {
    console.error('❌ WebSocket authentication failed:', data);
    this.isAuthenticated = false;
    
    // إشعار المستمعين بفشل المصادقة
    this.connectionHandlers.onAuthFailed.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('❌ خطأ في معالج فشل المصادقة:', error);
      }
    });

    // إغلاق الاتصال
    if (this.ws) {
      this.ws.close(4001, 'Authentication failed');
    }
  }

  /**
   * معالجة الأحداث الخاصة
   */
  handleSpecialEvents(data) {
    switch (data.type) {
      case 'welcome':
        console.log('👋 مرحباً من الخادم:', data.message);
        break;
        
      case 'new_order_available':
        console.log('🚚 طلب جديد متاح:', data);
        this.showOrderNotification(data);
        break;
        
      case 'order_status_update':
        console.log('📱 تحديث حالة طلب:', data);
        break;
        
      case 'captain_location_update':
        console.log('📍 تحديث موقع كابتن:', data);
        break;
        
      default:
        console.log('📨 رسالة غير معروفة:', data.type, data);
    }
  }

  /**
   * عرض إشعار للطلب الجديد
   */
  showOrderNotification(orderData) {
    // هنا يمكن إضافة منطق إشعارات الـ mobile
    console.log('🔔 إشعار طلب جديد:', {
      title: '🚚 طلب جديد متاح!',
      message: `طلب رقم ${orderData.orderNumber || orderData.orderId} بقيمة ${orderData.totalAmount || 0} جنيه`,
      data: orderData
    });
  }

  /**
   * جدولة إعادة الاتصال
   */
  scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Scheduling WebSocket reconnection in ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      if (!this.isConnected && this.connectionData.baseURL) {
        console.log('🔄 Attempting WebSocket reconnection...');
        this.connect(
          this.connectionData.baseURL,
          this.connectionData.authToken,
          this.connectionData.captainId,
          this.connectionData.captainData
        );
      }
    }, delay);
  }

  /**
   * إرسال رسالة عبر WebSocket
   */
  sendMessage(data) {
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        const message = JSON.stringify(data);
        this.ws.send(message);
        console.log('📤 WebSocket message sent:', data.type);
      } catch (error) {
        console.error('❌ فشل إرسال رسالة WebSocket:', error);
      }
    } else {
      console.warn('⚠️ WebSocket غير متصل، لا يمكن إرسال الرسالة');
    }
  }

  /**
   * تسجيل معالج حدث
   */
  addEventListener(eventType, handler) {
    if (!this.eventHandlers[eventType]) {
      this.eventHandlers[eventType] = [];
    }
    this.eventHandlers[eventType].push(handler);
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
   * تسجيل معالج اتصال
   */
  addConnectionListener(type, handler) {
    if (this.connectionHandlers[type]) {
      this.connectionHandlers[type].push(handler);
    }
  }

  /**
   * إرسال تحديث الموقع
   */
  sendLocationUpdate(locationData) {
    if (!this.isAuthenticated) {
      console.warn('⚠️ Cannot send location update - not authenticated');
      return;
    }
    
    this.sendMessage({
      type: 'driver_location_update',
      captainId: this.connectionData.captainId,
      location: locationData,
      timestamp: Date.now()
    });
  }

  /**
   * إرسال تحديث حالة الكابتن
   */
  sendStatusUpdate(status, isAvailable) {
    if (!this.isAuthenticated) {
      console.warn('⚠️ Cannot send status update - not authenticated');
      return;
    }
    
    this.sendMessage({
      type: 'captain_status_update',
      captainId: this.connectionData.captainId,
      status,
      isAvailable,
      timestamp: Date.now()
    });
  }

  /**
   * إرسال ping للخادم للحفاظ على الاتصال
   */
  sendPing() {
    this.sendMessage({
      type: 'ping',
      timestamp: Date.now()
    });
  }

  /**
   * تحديث بيانات المصادقة (في حالة تجديد JWT token)
   */
  updateAuthData(authToken, captainId, captainData) {
    this.connectionData.authToken = authToken;
    this.connectionData.captainId = captainId;
    this.connectionData.captainData = captainData;
    
    // إعادة المصادقة إذا كان متصل ولكن غير مصادق
    if (this.isConnected && !this.isAuthenticated) {
      this.authenticate();
    }
  }

  /**
   * قطع الاتصال
   */
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      console.log('🚪 قطع اتصال WebSocket...');
      
      // إرسال رسالة captain_offline قبل القطع
      if (this.isAuthenticated) {
        this.sendMessage({
          type: 'captain_offline',
          captainId: this.connectionData.captainId,
          timestamp: Date.now()
        });
      }
      
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.isAuthenticated = false;
    this.reconnectAttempts = 0;
  }

  /**
   * الحصول على حالة الاتصال
   */
  getConnectionState() {
    return {
      isConnected: this.isConnected,
      isAuthenticated: this.isAuthenticated,
      reconnectAttempts: this.reconnectAttempts,
      captainId: this.connectionData.captainId,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  /**
   * إعادة تعيين محاولات إعادة الاتصال
   */
  resetReconnectAttempts() {
    this.reconnectAttempts = 0;
  }

  /**
   * التحقق من صحة الاتصال
   */
  isHealthy() {
    return this.isConnected && this.isAuthenticated && 
           this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

// إنشاء instance واحد للاستخدام في التطبيق
const webSocketService = new WebSocketService();

export default webSocketService;
export { WebSocketService };