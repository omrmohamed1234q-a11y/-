/**
 * خدمة WebSocket للتحديثات المباشرة في التطبيق المحمول
 * تتعامل مع الطلبات الجديدة وتحديثات الحالة - React Native Compatible
 */

// Safe notification service reference - avoid dynamic require()
let _notificationService = null;
try {
  // Try to import at module level if possible
  if (typeof require !== 'undefined') {
    _notificationService = require('./notificationService.js').default || require('./notificationService.js');
  }
} catch (error) {
  console.warn('⚠️ NotificationService not available at module level:', error.message);
}

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
    // Validate required parameters before attempting connection
    if (!baseURL) {
      console.error('❌ Cannot connect - baseURL is required');
      return;
    }
    
    // SECURE LOGGING: No sensitive data exposed
    console.log('🔗 WebSocket connect() called with:', {
      hasBaseURL: !!baseURL,
      baseURLProtocol: baseURL ? new URL(baseURL).protocol : 'none',
      hasAuthToken: !!authToken,
      tokenLength: authToken?.length || 0,
      hasCaptainId: !!captainId,
      idLength: captainId?.length || 0,
      hasCaptainData: !!captainData
    });
    
    // Save connection data for reconnection
    this.connectionData = { baseURL, authToken, captainId, captainData };
    
    // SECURE VERIFICATION: Connection data saved (no sensitive data)
    console.log('🔗 Connection data saved securely:', {
      hasAuthToken: !!this.connectionData.authToken,
      tokenLength: this.connectionData.authToken?.length || 0,
      hasCaptainId: !!this.connectionData.captainId,
      idLength: this.connectionData.captainId?.length || 0,
      hasBaseURL: !!this.connectionData.baseURL,
      hasCaptainData: !!this.connectionData.captainData
    });
    
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
   * إرسال رسالة authenticate للخادم - محدث ليتكامل مع web app authentication
   */
  authenticate() {
    console.log('🔐 authenticate() called - SECURE DIAGNOSTICS:', {
      hasAuthToken: !!this.connectionData.authToken,
      tokenLength: this.connectionData.authToken?.length || 0,
      hasCaptainId: !!this.connectionData.captainId,
      idLength: this.connectionData.captainId?.length || 0,
      hasCaptainData: !!this.connectionData.captainData,
      hasBaseURL: !!this.connectionData.baseURL
    });
    
    // استخدام نفس fallback approach مثل notification service
    let userId = this.connectionData.captainId;
    if (!userId) {
      try {
        // محاولة الحصول على user ID من captain service
        const captainService = require('./captainService.js').default || require('./captainService.js');
        const captain = captainService.captain;
        
        if (captain && captain.id) {
          userId = captain.id;
        } else {
          // fallback لـ test user ID مثل web app
          userId = '3e3882cc-81fa-48c9-bc69-c290128f4ff2';
        }
      } catch (error) {
        console.warn('⚠️ Could not get user ID from captain service, using test user');
        userId = '3e3882cc-81fa-48c9-bc69-c290128f4ff2';
      }
    }
    
    // استخدام dev-test-token مثل web app إذا لم يوجد token
    let authToken = this.connectionData.authToken;
    if (!authToken || authToken.length < 10) {
      console.warn('⚠️ Using dev-test-token for authentication (like web app)');
      authToken = 'dev-test-token';
    }
    
    if (!authToken || !userId) {
      console.error('⚠️ AUTHENTICATION FAILED: Still missing credentials after fallbacks');
      console.error('  - hasAuthToken:', !!authToken);
      console.error('  - hasUserId:', !!userId);
      
      // Close the connection with auth failure code to prevent reconnection
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(4001, 'Authentication required');
      }
      return;
    }

    // استخدام نفس format مثل web app authentication
    const authMessage = {
      type: 'authenticate',
      data: {
        userId: userId,
        userType: 'captain',
        token: authToken,
        // إضافة header tokens مثل web app
        headers: {
          'X-Admin-Token': 'dev-test-token',
          'X-User-ID': userId
        }
      }
    };

    console.log('🔐 Sending authentication message with enhanced format...');
    this.sendMessage(authMessage);
  }

  /**
   * معالج إغلاق الاتصال - FIXED to prevent infinite auth loops
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

    // CRITICAL: Always clear reconnect timeout first
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // STRICT AUTH VALIDATION: Check for valid JWT token and captain ID
    const hasValidAuthToken = this.connectionData.authToken && 
                             this.connectionData.authToken.length > 10 &&
                             this.connectionData.authToken !== 'null' &&
                             this.connectionData.authToken !== 'undefined';
    const hasValidCaptainId = this.connectionData.captainId && 
                             this.connectionData.captainId.length > 5;
    const hasValidCredentials = hasValidAuthToken && hasValidCaptainId;

    // STRICT RECONNECTION LOGIC: Absolute blocks for auth failures
    const isAuthFailure = event.code === 4001 || event.code === 4000;
    const maxAttemptsReached = this.reconnectAttempts >= this.maxReconnectAttempts;
    const isCleanClose = event.code === 1000;
    
    // ABSOLUTE BLOCK: Never reconnect on auth failures or without valid credentials
    if (isAuthFailure || !hasValidCredentials || maxAttemptsReached || isCleanClose) {
      console.warn('🚫 RECONNECTION PERMANENTLY BLOCKED:', {
        isAuthFailure,
        hasValidCredentials,
        maxAttemptsReached,
        isCleanClose,
        code: event.code,
        hasAuthToken: !!this.connectionData.authToken,
        tokenLength: this.connectionData.authToken?.length || 0,
        hasCaptainId: !!this.connectionData.captainId
      });
      
      // Reset attempts to prevent any future reconnection
      this.reconnectAttempts = this.maxReconnectAttempts + 1;
      
      // Clear connection data on auth failures to ensure no future attempts
      if (isAuthFailure || !hasValidCredentials) {
        console.warn('🗑️ Clearing connection data due to auth failure');
        this.connectionData = {
          baseURL: null,
          authToken: null,
          captainId: null,
          captainData: null
        };
      }
      
      if (event.code === 4001) {
        console.warn('⚠️ AUTHENTICATION FAILED - Connection stopped permanently');
        console.warn('⚠️ Please login again to restore WebSocket connection');
      } else if (event.code === 4000) {
        console.warn('⚠️ INVALID CONNECTION DATA - Connection stopped permanently');
      } else if (maxAttemptsReached) {
        console.warn('⚠️ MAXIMUM RECONNECTION ATTEMPTS REACHED - Connection stopped');
      } else if (!hasValidCredentials) {
        console.warn('⚠️ INVALID CREDENTIALS - Connection stopped permanently');
      }
      
      return; // ABSOLUTE STOP - No reconnection
    }
    
    // Only proceed with reconnection if ALL conditions are met
    console.log('🔄 Reconnection conditions met - scheduling reconnect');
    this.scheduleReconnect();
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
   * ENHANCED Schema validation for WebSocket messages - Production Ready with Better Error Messages
   */
  validateMessageSchema(messageData) {
    // CRITICAL: Basic structure validation
    if (!messageData || typeof messageData !== 'object') {
      throw new Error('Invalid message: must be a valid object');
    }
    
    if (!messageData.type || typeof messageData.type !== 'string') {
      throw new Error(`Invalid message: missing or invalid type field. Got: ${typeof messageData.type}`);
    }
    
    const { type } = messageData;
    
    // ENHANCED: Type-specific validation with detailed error messages
    switch (type) {
      case 'welcome':
        // Welcome messages are always valid
        break;
        
      case 'authenticated':
        if (!messageData.data || !messageData.data.userId) {
          throw new Error(`Invalid ${type} message: missing data.userId field`);
        }
        break;
        
      case 'auth_failed':
        // Auth failed messages need no additional validation
        break;
        
      case 'new_order_available':
        const orderData = messageData.data || messageData;
        if (!orderData.orderId && !orderData.id) {
          throw new Error(`Invalid ${type} message: missing orderId/id field`);
        }
        break;
        
      case 'order_status_update':
        const updateData = messageData.data || messageData;
        if (!updateData.orderId && !updateData.id) {
          throw new Error(`Invalid ${type} message: missing orderId/id field`);
        }
        if (!updateData.status) {
          throw new Error(`Invalid ${type} message: missing status field`);
        }
        break;
        
      case 'system_message':
        const systemData = messageData.data || messageData;
        if (!systemData.message && !systemData.title) {
          throw new Error(`Invalid ${type} message: missing message/title field`);
        }
        break;
        
      case 'ping':
      case 'pong':
        // Ping/pong messages need no additional validation
        break;
        
      default:
        // ENHANCED: Allow unknown message types but log them
        console.info(`🔍 Unknown message type: ${type} - proceeding with basic validation`);
        console.info(`🔍 Message structure:`, {
          hasData: !!messageData.data,
          hasTimestamp: !!messageData.timestamp,
          keys: Object.keys(messageData)
        });
        break;
    }
    
    return true;
  }

  /**
   * معالج الرسائل الواردة - ENHANCED with proper payload normalization
   */
  handleMessage(event) {
    let messageData;
    
    try {
      messageData = JSON.parse(event.data);
      console.log('📨 WebSocket message received:', {
        type: messageData.type,
        hasData: !!messageData.data,
        timestamp: messageData.timestamp || 'none'
      });

      // CRITICAL: Schema validation FIRST - FAIL FAST on invalid messages
      try {
        this.validateMessageSchema(messageData);
      } catch (validationError) {
        console.error('❌ WebSocket message validation failed:', validationError.message);
        console.error('❌ Message type:', messageData.type || 'unknown');
        console.error('❌ Message structure:', {
          hasType: !!messageData.type,
          hasData: !!messageData.data,
          keys: Object.keys(messageData || {})
        });
        // FAIL FAST - don't process invalid messages
        return;
      }

      const { type } = messageData;
      
      // SYSTEM MESSAGE HANDLING with proper payload extraction
      switch (type) {
        case 'authenticated':
          this.handleAuthenticated(messageData);
          break;
          
        case 'auth_failed':
          this.handleAuthFailed(messageData);
          break;
          
        default:
          // ENHANCED: Proper payload normalization for event handlers
          this.dispatchToEventHandlers(type, messageData);
          
          // ENHANCED: Special events with normalized payloads
          this.handleSpecialEvents(messageData);
          break;
      }
      
    } catch (parseError) {
      console.error('❌ Failed to parse WebSocket message:', parseError.message);
      console.error('❌ Raw message data:', event.data?.substring(0, 200) + '...');
      // FAIL FAST on parse errors
      return;
    }
  }
  
  /**
   * ENHANCED: Proper event handler dispatch with payload normalization
   */
  dispatchToEventHandlers(messageType, messageData) {
    const handlers = this.eventHandlers[messageType];
    
    if (!handlers || handlers.length === 0) {
      // EXPLICIT warning for unhandled message types
      console.warn(`⚠️ No handlers registered for message type: ${messageType}`);
      console.warn(`⚠️ Available handlers:`, Object.keys(this.eventHandlers));
      return;
    }
    
    // CRITICAL: Normalize payload - extract data field or use full message
    const normalizedPayload = messageData.data || messageData;
    
    // Enhanced logging for debugging
    console.log(`📤 Dispatching ${messageType} to ${handlers.length} handler(s)`);
    console.log(`📤 Normalized payload:`, {
      originalKeys: Object.keys(messageData || {}),
      normalizedKeys: Object.keys(normalizedPayload || {}),
      hasRequiredFields: this.checkRequiredFields(messageType, normalizedPayload)
    });
    
    // Dispatch to all registered handlers
    handlers.forEach((handler, index) => {
      try {
        handler(normalizedPayload);
        console.log(`✅ Handler ${index + 1}/${handlers.length} completed for ${messageType}`);
      } catch (handlerError) {
        console.error(`❌ Handler ${index + 1} failed for ${messageType}:`, handlerError.message);
        console.error(`❌ Handler payload keys:`, Object.keys(normalizedPayload || {}));
        console.error(`❌ Handler error:`, handlerError);
        // LOG but continue to other handlers
      }
    });
  }
  
  /**
   * ENHANCED: Check required fields based on message type
   */
  checkRequiredFields(messageType, payload) {
    const requirements = {
      'new_order_available': ['orderId'],
      'order_status_update': ['orderId', 'status'],
      'system_message': ['message']
    };
    
    const required = requirements[messageType];
    if (!required) {
      return true; // No specific requirements
    }
    
    const missing = required.filter(field => !payload || !payload[field]);
    if (missing.length > 0) {
      console.warn(`⚠️ Message ${messageType} missing required fields:`, missing);
      console.warn(`⚠️ Available fields:`, Object.keys(payload || {}));
      return false;
    }
    
    return true;
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
      captainId: this.connectionData.captainId, // Server needs this for routing
      timestamp: Date.now(),
      status: 'available'
    });
    
    // SECURE LOG: Confirmed online status (no sensitive data)
    console.log('✅ Captain status sent: ONLINE (id hidden for security)');
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
        this.showOrderUpdateNotification(data);
        break;
        
      case 'system_message':
        console.log('📢 رسالة نظام:', data);
        this.showSystemNotification(data);
        break;
        
      case 'location_update_request':
        console.log('📍 طلب تحديث الموقع:', data);
        this.showLocationNotification(data);
        break;
        
      case 'captain_location_update':
        console.log('📍 تحديث موقع كابتن:', data);
        this.showLocationNotification(data);
        break;
        
      case 'system_message':
        console.log('📢 رسالة نظام:', data);
        this.showSystemNotification(data);
        break;
        
      default:
        console.log('📨 رسالة غير معروفة:', data.type, data);
    }
  }

  /**
   * عرض إشعار للطلب الجديد - محسن مع NotificationService
   */
  showOrderNotification(orderData) {
    console.log('🔔 إشعار طلب جديد:', orderData);
    
    // Extract data with proper fallbacks for payload mismatch
    const orderId = orderData.orderId || orderData.id || orderData.data?.orderId || orderData.data?.id;
    const orderNumber = orderData.orderNumber || orderData.data?.orderNumber || orderId;
    const totalAmount = orderData.totalAmount || orderData.data?.totalAmount || 0;
    const priority = orderData.priority || orderData.data?.priority || 'medium';
    
    // إشعار محلي متطور
    const notification = {
      id: `order_${orderId}_${Date.now()}`,
      type: 'new_order',
      title: '🚚 طلب جديد متاح!',
      message: `طلب رقم ${orderNumber} بقيمة ${totalAmount} جنيه`,
      timestamp: new Date(),
      data: orderData,
      isRead: false,
      priority: priority === 'urgent' ? 'high' : 'medium'
    };
    
    // Safe notification service usage مع تحسين Local Notification
    if (this._tryNotificationService(notification)) {
      console.log('✅ تم إرسال الإشعار عبر NotificationService');
      
      // عرض إشعار محلي فوري للطلبات الجديدة (مهم)
      this._tryLocalNotification(notification);
    } else {
      // Fallback للـ console log
      console.log('🔔 Fallback notification:', {
        title: notification.title,
        message: notification.message,
        data: orderData
      });
    }
  }

  /**
   * عرض إشعار لتحديث حالة الطلب
   */
  showOrderUpdateNotification(updateData) {
    console.log('📱 إشعار تحديث طلب:', updateData);
    
    // Extract data with proper fallbacks for payload mismatch
    const orderId = updateData.orderId || updateData.id || updateData.data?.orderId || updateData.data?.id;
    const orderNumber = updateData.orderNumber || updateData.data?.orderNumber || orderId;
    const status = updateData.status || updateData.data?.status || 'تم التحديث';
    
    const notification = {
      id: `update_${orderId}_${Date.now()}`,
      type: 'order_update',
      title: '📱 تحديث حالة الطلب',
      message: `تم تحديث الطلب رقم ${orderNumber} - ${status}`,
      timestamp: new Date(),
      data: updateData,
      isRead: false,
      priority: 'medium'
    };
    
    if (this._tryNotificationService(notification)) {
      console.log('✅ تم إرسال إشعار تحديث الطلب');
    } else {
      console.log('📱 Order update fallback:', notification.message);
    }
  }

  /**
   * عرض إشعار لتحديث الموقع
   */
  showLocationNotification(locationData) {
    console.log('📍 إشعار تحديث موقع:', locationData);
    
    // Extract location data with proper fallbacks
    const captainId = locationData.captainId || locationData.data?.captainId || 'unknown';
    const location = locationData.location || locationData.data?.location || locationData;
    
    const notification = {
      id: `location_${Date.now()}`,
      type: 'location',
      title: '📍 تحديث الموقع',
      message: `تم تحديث موقع الكابتن ${captainId}`,
      timestamp: new Date(),
      data: { captainId, location, originalData: locationData },
      isRead: false,
      priority: 'low'
    };
    
    if (this._tryNotificationService(notification)) {
      console.log('✅ تم إرسال إشعار تحديث الموقع');
    } else {
      console.log('📍 Location update fallback:', notification.message);
    }
  }

  /**
   * عرض إشعار رسالة النظام
   */
  showSystemNotification(systemData) {
    console.log('📢 إشعار رسالة نظام:', systemData);
    
    // Extract system data with proper fallbacks for payload mismatch
    const title = systemData.title || systemData.data?.title || '📢 رسالة من النظام';
    const message = systemData.message || systemData.data?.message || 'تحديث جديد من النظام';
    const priority = systemData.priority || systemData.data?.priority || 'low';
    const type = systemData.type || systemData.data?.type || 'announcement';
    
    const notification = {
      id: `system_${Date.now()}`,
      type: 'system',
      title: title,
      message: message,
      timestamp: new Date(),
      data: { ...systemData, systemType: type },
      isRead: false,
      priority: priority
    };
    
    if (this._tryNotificationService(notification)) {
      // عرض إشعار محلي للرسائل المهمة
      if (priority === 'high' || priority === 'urgent') {
        this._tryLocalNotification(notification);
      }
      console.log('✅ تم إرسال إشعار رسالة النظام');
    } else {
      console.log('📢 System notification fallback:', notification.message);
    }
  }

  /**
   * Safe notification service helper - prevents dynamic require() issues
   */
  _tryNotificationService(notification) {
    try {
      // Try module-level reference first
      if (_notificationService) {
        _notificationService.addNotification(notification);
        return true;
      }
      
      // Try dynamic import as fallback
      if (typeof require !== 'undefined') {
        const notificationService = require('./notificationService.js').default || require('./notificationService.js');
        if (notificationService && notificationService.addNotification) {
          notificationService.addNotification(notification);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.warn('⚠️ NotificationService integration failed:', error.message);
      return false;
    }
  }
  
  /**
   * Safe local notification helper
   */
  _tryLocalNotification(notification) {
    try {
      if (_notificationService && _notificationService.showLocalNotification) {
        _notificationService.showLocalNotification(
          notification.title,
          notification.message,
          notification.data
        );
        return true;
      }
      
      // Try dynamic import as fallback
      if (typeof require !== 'undefined') {
        const notificationService = require('./notificationService.js').default || require('./notificationService.js');
        if (notificationService && notificationService.showLocalNotification) {
          notificationService.showLocalNotification(
            notification.title,
            notification.message,
            notification.data
          );
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.warn('⚠️ Local notification failed:', error.message);
      return false;
    }
  }

  /**
   * جدولة إعادة الاتصال مع validation محسن - FIXED to prevent infinite auth loops
   */
  scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // التحقق الصارم من صحة بيانات المصادقة (ليس فقط الوجود)
    const hasValidBaseURL = this.connectionData.baseURL && this.connectionData.baseURL.length > 10;
    const hasValidAuthToken = this.connectionData.authToken && this.connectionData.authToken.length > 10;
    const hasValidCaptainId = this.connectionData.captainId && this.connectionData.captainId.length > 5;

    if (!hasValidBaseURL || !hasValidAuthToken || !hasValidCaptainId) {
      console.warn('🚫 RECONNECT PERMANENTLY BLOCKED: Invalid or missing credentials');
      console.warn('  - baseURL valid:', hasValidBaseURL);
      console.warn('  - authToken valid:', hasValidAuthToken);
      console.warn('  - captainId valid:', hasValidCaptainId);
      console.warn('  - tokenLength:', this.connectionData.authToken?.length || 0);
      console.warn('  - idLength:', this.connectionData.captainId?.length || 0);
      console.warn('🚫 AUTHENTICATION REQUIRED: Please login again to restore WebSocket connection');
      
      // PERMANENT BLOCK: Stop all reconnection attempts
      this.reconnectAttempts = this.maxReconnectAttempts + 1;
      
      // Clear connection data to ensure no further attempts
      this.connectionData = {
        baseURL: null,
        authToken: null,
        captainId: null,
        captainData: null
      };
      
      // Notify handlers about permanent auth failure
      this.connectionHandlers.onAuthFailed.forEach(handler => {
        try {
          handler({ 
            error: 'Authentication required', 
            requiresLogin: true,
            reason: 'Invalid or missing JWT token' 
          });
        } catch (error) {
          console.error('❌ Error in auth failed handler:', error);
        }
      });
      
      return;
    }

    // Check max attempts BEFORE incrementing
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('🚫 RECONNECT BLOCKED: Maximum attempts reached');
      console.warn('🚫 Please restart app or login again to restore connection');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1), 30000); // Max 30s delay
    
    console.log(`🔄 Scheduling WebSocket reconnection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      if (!this.isConnected && this.connectionData.baseURL) {
        console.log(`🔄 Attempting WebSocket reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
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
   * تسجيل معالج اتصال - مع إصلاح connection state issues
   */
  addConnectionListener(type, handler) {
    // Ensure connection handlers array exists
    if (!this.connectionHandlers[type]) {
      this.connectionHandlers[type] = [];
    }
    this.connectionHandlers[type].push(handler);
    console.log(`🔔 Registered connection listener for: ${type}, total handlers: ${this.connectionHandlers[type].length}`);
  }

  /**
   * إرسال تحديث الموقع - fixed payload structure
   */
  sendLocationUpdate(captainId, locationData) {
    if (!this.isAuthenticated) {
      console.warn('⚠️ Cannot send location update - not authenticated');
      return;
    }
    
    // Use provided captainId or fallback to connection data
    const id = captainId || this.connectionData.captainId;
    
    // Ensure proper location data structure
    const location = {
      latitude: locationData.latitude || locationData.lat,
      longitude: locationData.longitude || locationData.lng,
      accuracy: locationData.accuracy,
      heading: locationData.heading,
      speed: locationData.speed,
      timestamp: locationData.timestamp || Date.now()
    };
    
    this.sendMessage({
      type: 'driver_location_update',
      captainId: id,
      location: location,
      timestamp: Date.now()
    });
  }

  /**
   * إرسال تحديث حالة الكابتن - improved payload structure
   */
  sendStatusUpdate(status, isAvailable) {
    if (!this.isAuthenticated) {
      console.warn('⚠️ Cannot send status update - not authenticated');
      return;
    }
    
    this.sendMessage({
      type: 'captain_status_update',
      captainId: this.connectionData.captainId,
      status: status,
      isAvailable: Boolean(isAvailable),
      timestamp: Date.now(),
      metadata: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'mobile-app',
        platform: 'captain-mobile'
      }
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
   * Get connection health status
   */
  isHealthy() {
    return this.isConnected && this.isAuthenticated && this.ws && this.ws.readyState === WebSocket.OPEN;
  }
  
  /**
   * Get connection state for debugging
   */
  getConnectionState() {
    return {
      isConnected: this.isConnected,
      isAuthenticated: this.isAuthenticated,
      reconnectAttempts: this.reconnectAttempts,
      hasAuthToken: !!this.connectionData.authToken,
      hasCaptainId: !!this.connectionData.captainId,
      wsReadyState: this.ws ? this.ws.readyState : null
    };
  }
  
  /**
   * Manual reconnection trigger
   */
  reconnect() {
    if (!this.connectionData.baseURL) {
      console.warn('⚠️ Cannot reconnect - no connection data available');
      return;
    }
    
    // Stop current reconnection attempts
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Close existing connection
    this.disconnect();
    
    // Reset attempts counter
    this.reconnectAttempts = 0;
    
    // Start fresh connection
    setTimeout(() => {
      this.connect(
        this.connectionData.baseURL,
        this.connectionData.authToken,
        this.connectionData.captainId,
        this.connectionData.captainData
      );
    }, 1000);
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
      
      // SECURE: Send captain offline status (server needs captainId for routing)
      if (this.isAuthenticated && this.connectionData.captainId) {
        this.sendMessage({
          type: 'captain_offline',
          captainId: this.connectionData.captainId, // Server routing requirement
          timestamp: Date.now()
        });
        console.log('ℹ️ Captain status sent: OFFLINE (id secured)');
      }
      
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.isAuthenticated = false;
    this.reconnectAttempts = 0;
  }

  /**
   * إعادة تعيين محاولات إعادة الاتصال
   */
  resetReconnectAttempts() {
    this.reconnectAttempts = 0;
  }
}

// إنشاء instance واحد للاستخدام في التطبيق
const webSocketService = new WebSocketService();

export default webSocketService;
export { WebSocketService };