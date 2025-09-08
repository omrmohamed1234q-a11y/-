import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface GPSOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  trackingInterval?: number;
  onLocationUpdate?: (location: LocationData) => void;
  onError?: (error: GeolocationPositionError) => void;
}

export function useGPS(options: GPSOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 60000,
    trackingInterval = 10000, // 10 ثواني
    onLocationUpdate,
    onError
  } = options;

  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  
  const watchId = useRef<number | null>(null);
  const trackingTimer = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // فحص دعم الموقع
  const isGeolocationSupported = 'geolocation' in navigator;

  // طلب صلاحية الموقع
  const requestPermission = useCallback(async () => {
    if (!isGeolocationSupported) {
      setError('الموقع الجغرافي غير مدعوم في هذا المتصفح');
      setPermissionStatus('denied');
      return false;
    }

    try {
      // فحص الصلاحيات
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionStatus(permission.state);
        
        if (permission.state === 'denied') {
          setError('تم رفض الوصول للموقع الجغرافي');
          toast({
            title: '📍 صلاحية الموقع مطلوبة',
            description: 'يرجى السماح بالوصول للموقع لتتبع التوصيل',
            variant: 'destructive'
          });
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('خطأ في فحص صلاحية الموقع:', error);
      return false;
    }
  }, [isGeolocationSupported, toast]);

  // الحصول على الموقع الحالي مرة واحدة
  const getCurrentLocation = useCallback((): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!isGeolocationSupported) {
        reject(new Error('الموقع الجغرافي غير مدعوم'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: Date.now()
          };

          setCurrentLocation(locationData);
          setAccuracy(position.coords.accuracy);
          setError(null);
          setPermissionStatus('granted');
          
          resolve(locationData);
        },
        (error) => {
          let errorMessage = '';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'تم رفض الوصول للموقع';
              setPermissionStatus('denied');
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'الموقع غير متاح';
              break;
            case error.TIMEOUT:
              errorMessage = 'انتهت مهلة الحصول على الموقع';
              break;
            default:
              errorMessage = 'خطأ غير معروف في الحصول على الموقع';
              break;
          }

          setError(errorMessage);
          onError?.(error);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge
        }
      );
    });
  }, [isGeolocationSupported, enableHighAccuracy, timeout, maximumAge, onError]);

  // بدء تتبع الموقع المستمر
  const startTracking = useCallback(async () => {
    if (isTracking) return;

    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    console.log('🎯 بدء تتبع الموقع...');
    setIsTracking(true);
    setError(null);

    // تحديث دوري للموقع
    const updateLocation = async () => {
      try {
        const location = await getCurrentLocation();
        onLocationUpdate?.(location);
        
        console.log('📍 تحديث الموقع:', {
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy
        });

      } catch (error) {
        console.error('خطأ في تحديث الموقع:', error);
      }
    };

    // تحديث فوري
    await updateLocation();

    // تحديث دوري
    trackingTimer.current = setInterval(updateLocation, trackingInterval);

    toast({
      title: '📍 تم بدء تتبع الموقع',
      description: 'يتم تحديث موقعك كل بضع ثوان'
    });

  }, [isTracking, requestPermission, getCurrentLocation, onLocationUpdate, trackingInterval, toast]);

  // إيقاف تتبع الموقع
  const stopTracking = useCallback(() => {
    console.log('⏹️ إيقاف تتبع الموقع');
    setIsTracking(false);

    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    if (trackingTimer.current) {
      clearInterval(trackingTimer.current);
      trackingTimer.current = null;
    }

    toast({
      title: '⏹️ تم إيقاف تتبع الموقع',
      description: 'لن يتم تحديث موقعك'
    });
  }, [toast]);

  // حساب المسافة بين نقطتين
  const calculateDistance = useCallback((
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number => {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // المسافة بالكيلومتر
  }, []);

  // حساب المسافة إلى وجهة معينة
  const getDistanceToDestination = useCallback((destinationLat: number, destinationLng: number): number | null => {
    if (!currentLocation) return null;
    return calculateDistance(
      currentLocation.lat, 
      currentLocation.lng, 
      destinationLat, 
      destinationLng
    );
  }, [currentLocation, calculateDistance]);

  // فتح خرائط جوجل للتنقل
  const openNavigation = useCallback((destinationLat: number, destinationLng: number, destinationName?: string) => {
    const destination = destinationName 
      ? encodeURIComponent(destinationName)
      : `${destinationLat},${destinationLng}`;
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(url, '_blank');
  }, []);

  // تنظيف الموارد عند unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  // فحص الصلاحيات عند التحميل
  useEffect(() => {
    if (isGeolocationSupported) {
      requestPermission();
    }
  }, [isGeolocationSupported, requestPermission]);

  return {
    // البيانات
    currentLocation,
    isTracking,
    accuracy,
    error,
    permissionStatus,
    isGeolocationSupported,
    
    // الدوال
    getCurrentLocation,
    startTracking,
    stopTracking,
    requestPermission,
    calculateDistance,
    getDistanceToDestination,
    openNavigation
  };
}