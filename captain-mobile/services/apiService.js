/**
 * خدمة API للتطبيق المحمول - React Native Compatible
 * تتعامل مع جميع APIs الخاصة بالكابتن مع النظام الحقيقي
 */

// Simple storage solution that works with both web and React Native
const SimpleStorage = {
  async setItem(key, value) {
    try {
      if (typeof global !== 'undefined' && global.localStorage) {
        // Web environment
        global.localStorage.setItem(key, value);
      } else if (typeof window !== 'undefined' && window.localStorage) {
        // Web environment (fallback)
        window.localStorage.setItem(key, value);
      } else {
        // React Native - use in-memory storage as fallback
        SimpleStorage._memory = SimpleStorage._memory || {};
        SimpleStorage._memory[key] = value;
      }
    } catch (error) {
      console.warn('Storage setItem failed:', error);
      // Fallback to memory
      SimpleStorage._memory = SimpleStorage._memory || {};
      SimpleStorage._memory[key] = value;
    }
  },

  async getItem(key) {
    try {
      if (typeof global !== 'undefined' && global.localStorage) {
        return global.localStorage.getItem(key);
      } else if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      } else {
        // React Native - use in-memory storage as fallback
        SimpleStorage._memory = SimpleStorage._memory || {};
        return SimpleStorage._memory[key] || null;
      }
    } catch (error) {
      console.warn('Storage getItem failed:', error);
      SimpleStorage._memory = SimpleStorage._memory || {};
      return SimpleStorage._memory[key] || null;
    }
  },

  async removeItem(key) {
    try {
      if (typeof global !== 'undefined' && global.localStorage) {
        global.localStorage.removeItem(key);
      } else if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      } else {
        // React Native
        SimpleStorage._memory = SimpleStorage._memory || {};
        delete SimpleStorage._memory[key];
      }
    } catch (error) {
      console.warn('Storage removeItem failed:', error);
      SimpleStorage._memory = SimpleStorage._memory || {};
      delete SimpleStorage._memory[key];
    }
  }
};

// Configuration - will be updated based on environment
const API_CONFIG = {
  baseURL: 'https://f26bb11c-218a-4594-bd57-714b53576ecf-00-15rco3z6ir6rr.picard.replit.dev',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  jwtSecret: 'atbaali-captain-secret-key-2025' // Should match server secret
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
  async secureLogin(username, password, driverCode = null) {
    const response = await this.makeRequest('POST', '/api/captain/secure-login', {
      username,
      password,
      driverCode
    });

    if (response.success && response.session_token) {
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
      
      await this.saveAuthData(response.session_token, captainData);
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

    if (response.success && response.token) {
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
      
      await this.saveAuthData(response.token, captainData);
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