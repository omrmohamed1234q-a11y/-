import { useState, useEffect } from 'react';
import { MapPin, AlertCircle, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface LocationTrackerProps {
  userType: 'admin' | 'driver';
  onLocationUpdate?: (location: { lat: number; lng: number; address?: string }) => void;
  autoStart?: boolean;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  address?: string;
}

export function LocationTracker({ userType, onLocationUpdate, autoStart = false }: LocationTrackerProps) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permitted, setPermitted] = useState<boolean | null>(null);

  // Auto-start location tracking if enabled
  useEffect(() => {
    if (autoStart) {
      handleLocationRequest();
    }
  }, [autoStart]);

  const getAddressFromCoords = async (lat: number, lng: number): Promise<string | undefined> => {
    try {
      // Using Nominatim (OpenStreetMap) for reverse geocoding - free and no API key required
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar`
      );
      const data = await response.json();
      
      if (data.display_name) {
        // Extract useful parts of the address in Arabic
        const parts = [];
        if (data.address?.city || data.address?.town || data.address?.village) {
          parts.push(data.address.city || data.address.town || data.address.village);
        }
        if (data.address?.state) {
          parts.push(data.address.state);
        }
        if (data.address?.country) {
          parts.push(data.address.country);
        }
        
        return parts.length > 0 ? parts.join('، ') : data.display_name;
      }
    } catch (error) {
      console.warn('Address lookup failed:', error);
    }
    return undefined;
  };

  const handleLocationRequest = () => {
    if (!navigator.geolocation) {
      setError('المتصفح لا يدعم تحديد المواقع');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Get human-readable address
        const address = await getAddressFromCoords(latitude, longitude);
        
        const locationData: LocationData = {
          latitude,
          longitude,
          accuracy,
          timestamp: Date.now(),
          address
        };

        setLocation(locationData);
        setPermitted(true);
        setLoading(false);

        // Store location in localStorage with timestamp
        localStorage.setItem(`${userType}_location`, JSON.stringify({
          ...locationData,
          lastUpdated: new Date().toISOString()
        }));

        // Call parent callback
        onLocationUpdate?.({
          lat: latitude,
          lng: longitude,
          address
        });

        // Send location to server for logging
        try {
          await fetch('/api/location/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem(`${userType}Token`)}`
            },
            body: JSON.stringify({
              userType,
              location: locationData,
              userId: JSON.parse(localStorage.getItem(`${userType}Data`) || '{}').id
            })
          });
        } catch (error) {
          console.warn('Failed to send location to server:', error);
        }
      },
      (error) => {
        setLoading(false);
        setPermitted(false);
        
        let errorMessage = 'فشل في تحديد الموقع';
        let showRetryButton = false;
        let showInstructions = false;
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'تم رفض إذن الموقع';
            showRetryButton = true;
            showInstructions = true;
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'معلومات الموقع غير متاحة. تأكد من تفعيل GPS';
            showRetryButton = true;
            break;
          case error.TIMEOUT:
            errorMessage = 'انتهت مهلة تحديد الموقع. تأكد من قوة الإشارة';
            showRetryButton = true;
            break;
        }
        setError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes cache
      }
    );
  };

  const formatLocation = (loc: LocationData) => {
    if (loc.address) {
      return loc.address;
    }
    return `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`;
  };

  const getStatusColor = () => {
    if (userType === 'admin') return 'red';
    return 'blue';
  };

  const statusColors = {
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      button: 'bg-red-600 hover:bg-red-700',
      icon: 'text-red-600'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      button: 'bg-blue-600 hover:bg-blue-700',
      icon: 'text-blue-600'
    }
  };

  const colors = statusColors[getStatusColor()];

  return (
    <div className="space-y-3">
      {/* Location Status Alert */}
      <Alert className={`${colors.border} ${colors.bg}`}>
        <MapPin className={`h-4 w-4 ${colors.icon}`} />
        <AlertDescription className={colors.text}>
          <strong>
            {userType === 'admin' ? '🛡️ تتبع موقع المدير' : '🚛 تتبع موقع السائق'}
          </strong>
          <br />
          <span className="text-sm">
            {location 
              ? `✅ الموقع مُحدث: ${formatLocation(location)}`
              : 'يتطلب تحديد الموقع للمراقبة الأمنية'
            }
          </span>
        </AlertDescription>
      </Alert>

      {/* Error Alert with Instructions */}
      {error && (
        <div className="space-y-3">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="space-y-2">
                <p className="font-semibold">{error}</p>
                {error.includes('رفض') && (
                  <div className="text-sm space-y-2">
                    <p className="font-medium">📋 خطوات إعادة تفعيل الموقع:</p>
                    <ol className="list-decimal list-inside space-y-1 mr-4 text-sm">
                      <li>اضغط على أيقونة القفل 🔒 في شريط العنوان</li>
                      <li>اختر "السماح" للموقع الجغرافي</li>
                      <li>أعد تحميل الصفحة أو اضغط "إعادة المحاولة"</li>
                    </ol>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
          
          {error.includes('رفض') && (
            <div className="flex gap-2">
              <Button
                onClick={handleLocationRequest}
                disabled={loading}
                variant="outline"
                className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                🔄 إعادة المحاولة
              </Button>
              <Button
                onClick={() => {
                  window.open('https://support.google.com/chrome/answer/142065?hl=ar', '_blank');
                }}
                variant="outline"
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                📖 مساعدة
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Location Request Button */}
      {!location && (
        <Button
          onClick={handleLocationRequest}
          disabled={loading}
          className={`w-full ${colors.button} text-white`}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              جاري تحديد الموقع...
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 mr-2" />
              {userType === 'admin' ? 'تفعيل المراقبة الأمنية' : 'تفعيل التتبع اللوجستي'}
            </>
          )}
        </Button>
      )}

      {/* Success Status */}
      {location && (
        <div className={`p-3 ${colors.bg} ${colors.border} border rounded-lg`}>
          <div className="flex items-center gap-2">
            <Check className={`w-4 h-4 ${colors.icon}`} />
            <span className={`text-sm font-medium ${colors.text}`}>
              تم تفعيل النظام بنجاح
            </span>
          </div>
          <div className={`text-xs ${colors.text} mt-1 opacity-80`}>
            دقة التحديد: ±{Math.round(location.accuracy)} متر
          </div>
        </div>
      )}
    </div>
  );
}