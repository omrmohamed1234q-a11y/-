/**
 * خدمة API للتطبيق المحمول - React Native Compatible
 * تتعامل مع جميع APIs الخاصة بالكابتن مع النظام الحقيقي
 */

// Enhanced storage solution that works with both web and React Native
const SimpleStorage = {
  // Try to detect if AsyncStorage is available (React Native)
  _asyncStorage: null,
  _memory: {},
  
  // Initialize storage and detect environment
  async _init() {
    if (this._asyncStorage !== null) return; // Already initialized
    
    try {
      // Try to import AsyncStorage dynamically (React Native)
      if (typeof window === 'undefined' || window.ReactNativeWebView) {
        // React Native environment
        try {
          const AsyncStorage = await import('@react-native-async-storage/async-storage');
          this._asyncStorage = AsyncStorage.default || AsyncStorage;
          console.log('📱 AsyncStorage detected and initialized for React Native');
          return;
        } catch (importError) {
          console.log('📱 AsyncStorage not available, checking for built-in storage...');
          
          // Fallback: Check for global storage in React Native (sometimes available as global object)
          if (typeof global !== 'undefined' && global.storage) {
            this._asyncStorage = global.storage;
            console.log('📱 Global storage detected');
            return;
          }
        }
      }
      
      // Web environment - use localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        this._asyncStorage = {
          getItem: async (key) => window.localStorage.getItem(key),
          setItem: async (key, value) => window.localStorage.setItem(key, value),
          removeItem: async (key) => window.localStorage.removeItem(key)
        };
        console.log('🌐 localStorage detected and initialized for web');
        return;
      }
      
      // Final fallback - in-memory storage (not persistent!)
      this._asyncStorage = 'memory';
      console.warn('⚠️ Using in-memory storage (not persistent across restarts)');
      
    } catch (error) {
      console.error('❌ Storage initialization failed:', error);
      this._asyncStorage = 'memory';
    }
  },

  async setItem(key, value) {
    await this._init();
    
    try {
      if (this._asyncStorage === 'memory') {
        this._memory[key] = value;
        console.log(`💾 Stored in memory: ${key}`);
        return;
      }
      
      await this._asyncStorage.setItem(key, value);
      console.log(`💾 Stored persistently: ${key}`);
      
    } catch (error) {
      console.warn('Storage setItem failed, using memory fallback:', error);
      this._memory[key] = value;
    }
  },

  async getItem(key) {
    await this._init();
    
    try {
      if (this._asyncStorage === 'memory') {
        const value = this._memory[key] || null;
        console.log(`📖 Retrieved from memory: ${key} =`, value ? 'EXISTS' : 'NULL');
        return value;
      }
      
      const value = await this._asyncStorage.getItem(key);
      console.log(`📖 Retrieved persistently: ${key} =`, value ? 'EXISTS' : 'NULL');
      return value;
      
    } catch (error) {
      console.warn('Storage getItem failed, checking memory fallback:', error);
      const value = this._memory[key] || null;
      console.log(`📖 Retrieved from memory fallback: ${key} =`, value ? 'EXISTS' : 'NULL');
      return value;
    }
  },

  async removeItem(key) {
    await this._init();
    
    try {
      if (this._asyncStorage === 'memory') {
        delete this._memory[key];
        console.log(`🗑️ Removed from memory: ${key}`);
        return;
      }
      
      await this._asyncStorage.removeItem(key);
      console.log(`🗑️ Removed persistently: ${key}`);
      
    } catch (error) {
      console.warn('Storage removeItem failed, using memory fallback:', error);
      delete this._memory[key];
    }
  }
};

// Configuration - will be updated based on environment
const API_CONFIG = {
  baseURL: 'https://f26bb11c-218a-4594-bd57-714b53576ecf-00-15rco3z6ir6rr.picard.replit.dev',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  // JWT secrets should never be exposed client-side - removed for security
};

class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.authToken = null;
    this.captainData = null;
    this.isInitialized = false;
  }

  /**
   * تهيئة الخدمة وتحميل البيانات المحفوظة
   */
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      // تحميل بيانات المصادقة المحفوظة
      const savedToken = await SimpleStorage.getItem('captain_jwt_token');
      const savedCaptain = await SimpleStorage.getItem('captain_data');
      
      if (savedToken && savedCaptain) {
        this.authToken = savedToken;
        try {
          this.captainData = JSON.parse(savedCaptain);
          console.log('📱 تم تحميل بيانات المصادقة المحفوظة:', this.captainData?.username);
        } catch (parseError) {
          console.warn('⚠️ فشل في تحليل بيانات الكابتن المحفوظة:', parseError);
          await this.clearAuthData();
        }
      }
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ فشل في تهيئة ApiService:', error);
      this.isInitialized = true; // Mark as initialized even on error
      return false;
    }
  }

  /**
   * حفظ بيانات المصادقة
   */
  async saveAuthData(token, captainData) {
    try {
      this.authToken = token;
      this.captainData = captainData;
      
      await SimpleStorage.setItem('captain_jwt_token', token);
      await SimpleStorage.setItem('captain_data', JSON.stringify(captainData));
      
      console.log('💾 تم حفظ بيانات المصادقة');
    } catch (error) {
      console.error('❌ فشل في حفظ بيانات المصادقة:', error);
    }
  }

  /**
   * مسح بيانات المصادقة
   */
  async clearAuthData() {
    try {
      this.authToken = null;
      this.captainData = null;
      
      await SimpleStorage.removeItem('captain_jwt_token');
      await SimpleStorage.removeItem('captain_data');
      
      console.log('🗑️ تم مسح بيانات المصادقة');
    } catch (error) {
      console.error('❌ فشل في مسح بيانات المصادقة:', error);
    }
  }

  /**
   * طلب HTTP عام مع retry logic
   */
  async makeRequest(method, endpoint, data = null, customHeaders = {}, retryCount = 0) {
    await this.initialize();
    
    const url = `${this.baseURL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };

    // إضافة رؤوس المصادقة - JWT token is the primary auth method
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const config = {
      method,
      headers,
      // Remove credentials: 'include' for React Native compatibility
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    try {
      console.log(`📡 ${method} ${endpoint}`, data ? data : '');
      
      // Add timeout support for React Native
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
      config.signal = controller.signal;
      
      const response = await fetch(url, config);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text();
        }
        
        console.error(`❌ API Error ${response.status}:`, errorData);
        
        // Handle specific error cases
        if (response.status === 401) {
          // Token expired or invalid - clear auth data
          await this.clearAuthData();
          throw new Error('انتهت صلاحية جلسة العمل، يرجى تسجيل الدخول مرة أخرى');
        }
        
        const errorMessage = errorData?.error || errorData?.message || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log(`✅ ${method} ${endpoint} success`);
      return responseData;
      
    } catch (error) {
      console.error(`💥 Network Error (attempt ${retryCount + 1}):`, error.message);
      
      // Retry logic for network errors (not auth errors)
      if (retryCount < API_CONFIG.retryAttempts && 
          !error.message.includes('انتهت صلاحية') &&
          (error.name === 'AbortError' || error.message.includes('Network'))) {
        
        console.log(`🔄 Retrying request in ${API_CONFIG.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay));
        return this.makeRequest(method, endpoint, data, customHeaders, retryCount + 1);
      }
      
      throw error;
    }
  }

  // === APIs المصادقة ===

  /**
   * تسجيل دخول الكابتن الآمن - الطريقة الأساسية
   */
  async secureLogin(username, password, driverCode = undefined) {
    const response = await this.makeRequest('POST', '/api/captain/secure-login', {
      username,
      password,
      driverCode
    });

    if (response.success && response.user) {
      // Handle different token field names from server responses
      const token = response.session_token || response.sessionToken || response.token;
      
      if (token) {
        // Save JWT token and captain data
        const captainData = {
          id: response.user.id,
          username: response.user.username,
          fullName: response.user.fullName,
          email: response.user.email,
          phone: response.user.phone,
          driverCode: response.user.driverCode,
          role: 'captain'
        };
        
        await this.saveAuthData(token, captainData);
        console.log('✅ Secure login token saved:', token ? 'YES' : 'NO');
      } else {
        console.error('❌ No valid token found in response:', Object.keys(response));
      }
    }

    return response;
  }

  /**
   * تسجيل دخول الكابتن العادي (للتوافق مع النظام القديم)
   */
  async regularLogin(username, password) {
    const response = await this.makeRequest('POST', '/api/driver/secure-auth', {
      username,
      password
    });

    if (response.success && response.user) {
      // Handle different token field names from server responses
      const token = response.session_token || response.sessionToken || response.token;
      
      if (token) {
        // Save JWT token and captain data
        const captainData = {
          id: response.user.id,
          username: response.user.username,
          fullName: response.user.fullName,
          email: response.user.email,
          phone: response.user.phone,
          driverCode: response.user.driverCode,
          role: 'captain'
        };
        
        await this.saveAuthData(token, captainData);
        console.log('✅ Regular login token saved:', token ? 'YES' : 'NO');
      } else {
        console.error('❌ No valid token found in response:', Object.keys(response));
      }
    }

    return response;
  }

  // === APIs الطلبات ===

  /**
   * جلب الطلبات المتاحة للكابتن
   */
  async getAvailableOrders(captainId) {
    return await this.makeRequest('GET', `/api/captain/${captainId}/available-orders`);
  }

  /**
   * قبول طلب محدد
   */
  async acceptOrder(captainId, orderId) {
    return await this.makeRequest('POST', `/api/captain/${captainId}/accept-order/${orderId}`, {});
  }

  /**
   * تحديث حالة طلب
   */
  async updateOrderStatus(captainId, orderId, status, notes = null, location = null) {
    return await this.makeRequest('POST', `/api/captain/${captainId}/order/${orderId}/status`, {
      status,
      notes,
      location
    });
  }

  // === APIs الموقع ===

  /**
   * تحديث موقع الكابتن
   */
  async updateLocation(captainId, locationData) {
    const { latitude: lat, longitude: lng, heading, speed, accuracy } = locationData;
    
    return await this.makeRequest('POST', `/api/captain/${captainId}/location`, {
      lat,
      lng,
      heading,
      speed,
      accuracy
    });
  }

  // === APIs الإحصائيات ===

  /**
   * جلب إحصائيات الكابتن
   */
  async getCaptainStats(captainId) {
    try {
      return await this.makeRequest('GET', `/api/captain/${captainId}/stats`);
    } catch (error) {
      // إذا لم يكن endpoint متاح، أرجع بيانات افتراضية
      console.warn('⚠️ Stats endpoint not available, returning default data');
      return {
        success: true,
        stats: {
          todayOrders: 0,
          todayEarnings: 0,
          rating: 4.8,
          totalDeliveries: 0
        }
      };
    }
  }

  /**
   * جلب تاريخ الأرباح
   */
  async getEarningsHistory(captainId, period = 'week') {
    try {
      return await this.makeRequest('GET', `/api/captain/${captainId}/earnings?period=${period}`);
    } catch (error) {
      // بيانات افتراضية في حالة عدم توفر endpoint
      console.warn('⚠️ Earnings endpoint not available, returning default data');
      return {
        success: true,
        earnings: {
          daily: 0,
          weekly: 0,
          monthly: 0,
          total: 0
        }
      };
    }
  }

  // === Helper Methods ===

  /**
   * تسجيل خروج الكابتن
   */
  async logout() {
    await this.clearAuthData();
    console.log('🚪 تم تسجيل الخروج من ApiService');
  }

  /**
   * التحقق من حالة المصادقة
   */
  isAuthenticated() {
    return !!(this.authToken && this.captainData);
  }

  /**
   * الحصول على بيانات الكابتن المحفوظة
   */
  getCaptainData() {
    return this.captainData;
  }

  /**
   * الحصول على JWT token
   */
  getAuthToken() {
    console.log('🔑 getAuthToken called, current token:', this.authToken ? 'EXISTS' : 'NULL');
    return this.authToken;
  }

  /**
   * اختبار اتصال API
   */
  async testConnection() {
    try {
      const response = await fetch(`${this.baseURL}/api/health`);
      return response.ok;
    } catch (error) {
      console.error('🔥 Connection test failed:', error);
      return false;
    }
  }

  /**
   * تحديث configuration URL إذا احتجنا
   */
  updateBaseURL(newURL) {
    this.baseURL = newURL;
    API_CONFIG.baseURL = newURL;
    console.log('🔧 تم تحديث Base URL:', newURL);
  }
}

// إنشاء instance واحد للاستخدام في التطبيق
const apiService = new ApiService();

export default apiService;

// تصدير الفئة أيضاً للاستخدام المتقدم
export { ApiService, API_CONFIG };