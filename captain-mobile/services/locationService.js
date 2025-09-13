/**
 * خدمة الموقع الجغرافي للتطبيق المحمول - React Native Compatible
 * تتعامل مع GPS والتتبع المستمر للموقع باستخدام Expo Location APIs
 */

// For React Native with Expo, we need to import Location from expo-location
// This will work in both Expo and regular React Native environments
let Location = null;
let TaskManager = null;

// Try to import Expo location APIs
try {
  // For React Native environments that support dynamic imports
  if (typeof require !== 'undefined') {
    // Use require for React Native
    Location = require('expo-location').default || require('expo-location');
    TaskManager = require('expo-task-manager').default || require('expo-task-manager');
  }
} catch (error) {
  console.warn('⚠️ Expo Location not available, falling back to web geolocation:', error.message);
}

// Task name for background location tracking
const LOCATION_TASK_NAME = 'background-location-task';
const LOCATION_UPDATE_INTERVAL = 15000; // 15 seconds as in original system

class LocationService {
  constructor() {
    this.isTracking = false;
    this.watchId = null;
    this.lastLocation = null;
    this.trackingInterval = LOCATION_UPDATE_INTERVAL;
    this.intervalTimer = null;
    this.callbacks = {
      onLocationUpdate: [],
      onError: []
    };
    
    // Initialize background task if available
    this.initializeBackgroundTask();
  }

  /**
   * Initialize background task for location tracking
   */
  initializeBackgroundTask() {
    if (TaskManager && Location) {
      try {
        TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
          if (error) {
            console.error('❌ Background location error:', error);
            return;
          }
          if (data) {
            console.log('📍 Background location update:', data);
            // Handle background location updates here
          }
        });
      } catch (error) {
        console.warn('⚠️ Failed to define background task:', error);
      }
    }
  }

  /**
   * Initialize location service
   */
  async initialize() {
    try {
      console.log('🗺️ Initializing location service...');
      
      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('⚠️ Location permissions not granted');
        return false;
      }

      console.log('✅ Location service initialized successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to initialize location service:', error);
      return false;
    }
  }

  /**
   * Request location permissions (React Native/Expo)
   */
  async requestPermissions() {
    try {
      if (Location) {
        // Expo/React Native permissions
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        
        if (foregroundStatus !== 'granted') {
          throw new Error('Location permission denied');
        }

        console.log('✅ Foreground location permission granted');
        return true;
        
      } else {
        // Web fallback - check permissions API
        if ('permissions' in navigator) {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          return permission.state === 'granted' || permission.state === 'prompt';
        }
        return true; // Assume permission granted for web
      }
    } catch (error) {
      console.error('❌ Permission request failed:', error);
      return false;
    }
  }

  /**
   * بدء تتبع الموقع مع Expo Location APIs
   */
  async startTracking(options = {}) {
    try {
      console.log('🗺️ Starting location tracking...');
      
      // Request permissions first
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const trackingOptions = {
        accuracy: Location?.Accuracy?.High || 'high',
        timeInterval: this.trackingInterval,
        distanceInterval: 10, // meters
        ...options
      };

      this.isTracking = true;

      // Get current location immediately
      await this.getCurrentLocation();

      if (Location) {
        // Use Expo Location API for React Native
        console.log('📱 Using Expo Location API');
        
        // Start watching position with Expo
        this.watchId = await Location.watchPositionAsync(
          {
            accuracy: trackingOptions.accuracy,
            timeInterval: trackingOptions.timeInterval,
            distanceInterval: trackingOptions.distanceInterval,
          },
          (location) => {
            this.handleLocationUpdate(location);
          }
        );
        
      } else {
        // Fallback to web geolocation API
        console.log('🌐 Using Web Geolocation API');
        
        if (!navigator.geolocation) {
          throw new Error('Geolocation is not supported by this device');
        }

        // Use interval-based tracking for web
        this.intervalTimer = setInterval(async () => {
          try {
            await this.getCurrentLocation();
          } catch (error) {
            console.error('❌ Error getting location:', error);
          }
        }, this.trackingInterval);
      }

      console.log('✅ Location tracking started successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to start location tracking:', error);
      this.handleLocationError(error);
      return false;
    }
  }

  /**
   * إيقاف تتبع الموقع
   */
  async stopTracking() {
    try {
      if (this.watchId && typeof this.watchId === 'object' && this.watchId.remove) {
        // Expo location watcher
        await this.watchId.remove();
        this.watchId = null;
      } else if (this.watchId && typeof this.watchId === 'number') {
        // Web geolocation watcher
        navigator.geolocation.clearWatch(this.watchId);
        this.watchId = null;
      }

      if (this.intervalTimer) {
        clearInterval(this.intervalTimer);
        this.intervalTimer = null;
      }
      
      this.isTracking = false;
      console.log('🛑 Location tracking stopped');
      
    } catch (error) {
      console.error('❌ Error stopping location tracking:', error);
    }
  }

  /**
   * الحصول على الموقع الحالي مرة واحدة
   */
  async getCurrentLocation(options = {}) {
    try {
      let locationData;

      if (Location) {
        // Use Expo Location API
        const defaultOptions = {
          accuracy: Location.Accuracy.High,
          timeout: 10000,
          maximumAge: 5000,
        };

        const location = await Location.getCurrentPositionAsync({
          ...defaultOptions,
          ...options
        });

        locationData = this.formatExpoLocationData(location);
        
      } else {
        // Fallback to web geolocation
        const defaultOptions = {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        };

        const position = await new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
          }

          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            { ...defaultOptions, ...options }
          );
        });

        locationData = this.formatWebLocationData(position);
      }

      this.handleLocationUpdate({ coords: locationData });
      return locationData;

    } catch (error) {
      console.error('❌ Error getting current location:', error);
      this.handleLocationError(error);
      throw error;
    }
  }

  /**
   * معالج تحديث الموقع
   */
  handleLocationUpdate(location) {
    let locationData;
    
    if (location.coords) {
      // Already formatted
      locationData = location.coords;
    } else if (location.coordinate) {
      // Expo format
      locationData = this.formatExpoLocationData(location);
    } else {
      // Web format
      locationData = this.formatWebLocationData(location);
    }
    
    // حفظ آخر موقع
    this.lastLocation = locationData;
    
    console.log('📍 Location update:', {
      lat: locationData.latitude?.toFixed(6),
      lng: locationData.longitude?.toFixed(6),
      accuracy: locationData.accuracy?.toFixed(1)
    });

    // إخطار المستمعين
    this.callbacks.onLocationUpdate.forEach(callback => {
      try {
        callback(locationData);
      } catch (error) {
        console.error('❌ Error in location update callback:', error);
      }
    });
  }

  /**
   * معالج أخطاء الموقع
   */
  handleLocationError(error) {
    let errorMessage = 'Unknown location error';
    
    if (error.code) {
      switch (error.code) {
        case 1: // PERMISSION_DENIED
          errorMessage = 'Location permission denied';
          break;
        case 2: // POSITION_UNAVAILABLE
          errorMessage = 'Location unavailable';
          break;
        case 3: // TIMEOUT
          errorMessage = 'Location request timeout';
          break;
      }
    } else {
      errorMessage = error.message || errorMessage;
    }

    console.error('❌ Location error:', errorMessage, error);

    // إخطار المستمعين بالخطأ
    this.callbacks.onError.forEach(callback => {
      try {
        callback(error, errorMessage);
      } catch (callbackError) {
        console.error('❌ Error in location error callback:', callbackError);
      }
    });
  }

  /**
   * تنسيق بيانات الموقع من Expo
   */
  formatExpoLocationData(location) {
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      altitude: location.coords.altitude,
      altitudeAccuracy: location.coords.altitudeAccuracy,
      heading: location.coords.heading,
      speed: location.coords.speed,
      timestamp: location.timestamp || Date.now()
    };
  }

  /**
   * تنسيق بيانات الموقع من Web
   */
  formatWebLocationData(position) {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp || Date.now()
    };
  }

  /**
   * حساب المسافة بين نقطتين (بالمتر)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  /**
   * فتح التنقل في خرائط Google
   */
  openGoogleMaps(destinationLat, destinationLng, destinationAddress = '') {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destinationLat},${destinationLng}`;
    
    try {
      if (typeof window !== 'undefined' && window.open) {
        // Web environment
        window.open(url, '_blank');
      } else if (typeof require !== 'undefined') {
        // React Native - use Linking
        try {
          const Linking = require('react-native').Linking;
          Linking.openURL(url);
        } catch (linkingError) {
          console.error('❌ Failed to open maps with Linking:', linkingError);
        }
      }
      console.log('🗺️ Opening Google Maps:', url);
    } catch (error) {
      console.error('❌ Failed to open Google Maps:', error);
    }
  }

  /**
   * إضافة معالج تحديث الموقع
   */
  addLocationUpdateListener(callback) {
    this.callbacks.onLocationUpdate.push(callback);
  }

  /**
   * إضافة معالج أخطاء الموقع
   */
  addLocationErrorListener(callback) {
    this.callbacks.onError.push(callback);
  }

  /**
   * إزالة معالج تحديث الموقع
   */
  removeLocationUpdateListener(callback) {
    const index = this.callbacks.onLocationUpdate.indexOf(callback);
    if (index > -1) {
      this.callbacks.onLocationUpdate.splice(index, 1);
    }
  }

  /**
   * إزالة معالج أخطاء الموقع
   */
  removeLocationErrorListener(callback) {
    const index = this.callbacks.onError.indexOf(callback);
    if (index > -1) {
      this.callbacks.onError.splice(index, 1);
    }
  }

  /**
   * الحصول على آخر موقع معروف
   */
  getLastKnownLocation() {
    return this.lastLocation;
  }

  /**
   * التحقق من حالة التتبع
   */
  isLocationTracking() {
    return this.isTracking;
  }

  /**
   * تعيين فترة التتبع
   */
  setTrackingInterval(intervalMs) {
    this.trackingInterval = intervalMs;
  }

  /**
   * التحقق من توفر خدمات الموقع
   */
  async checkLocationServices() {
    try {
      if (Location) {
        const enabled = await Location.hasServicesEnabledAsync();
        return enabled;
      } else {
        // For web, assume location services are available
        return true;
      }
    } catch (error) {
      console.error('❌ Error checking location services:', error);
      return false;
    }
  }

  /**
   * تنظيف الموارد
   */
  async cleanup() {
    await this.stopTracking();
    this.callbacks.onLocationUpdate = [];
    this.callbacks.onError = [];
    this.lastLocation = null;
  }
}

// إنشاء instance واحد للاستخدام في التطبيق
const locationService = new LocationService();

export default locationService;
export { LocationService };