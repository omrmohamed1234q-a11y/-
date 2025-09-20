import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Truck, Clock, RotateCcw } from 'lucide-react';

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface Location {
  lat: number;
  lng: number;
}

interface DriverLocation extends Location {
  timestamp: number;
  driverId?: string;
  driverName?: string;
  speed?: number;
  heading?: number;
}

interface RouteData {
  routes: any[];
  encodedPolyline?: string;
  estimatedDistance?: number;
  estimatedDuration?: number;
  steps?: any[];
}

interface GoogleMapProps {
  customerLocation?: Location;
  driverLocation?: DriverLocation;
  orderDestination?: Location;
  onDriverLocationUpdate?: (location: DriverLocation) => void;
  isDriverMode?: boolean;
  zoom?: number;
  height?: string;
  routeData?: RouteData;
  showRoute?: boolean;
}

export default function GoogleMap({
  customerLocation,
  driverLocation,
  orderDestination,
  onDriverLocationUpdate,
  isDriverMode = false,
  zoom = 13,
  height = '400px',
  routeData,
  showRoute = false
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const driverMarkerRef = useRef<any>(null);
  const customerMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const routeRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // تحميل Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsLoaded(true);
        return;
      }

      // استخدام مفتاح Google Maps من متغيرات البيئة
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setError('مفتاح Google Maps غير مُعرف');
        return;
      }
      
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places&language=ar&region=EG`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setIsLoaded(true);
      };
      
      script.onerror = () => {
        setError('فشل في تحميل خرائط Google');
      };
      
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // إنشاء الخريطة
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    try {
      // الموقع الافتراضي (القاهرة)
      const defaultCenter = {
        lat: customerLocation?.lat || driverLocation?.lat || 30.0444,
        lng: customerLocation?.lng || driverLocation?.lng || 31.2357
      };

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: zoom,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi.business',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit',
            elementType: 'labels.icon',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      console.log('✅ Google Maps initialized');
    } catch (err) {
      console.error('❌ Error initializing Google Maps:', err);
      setError('خطأ في إنشاء الخريطة');
    }
  }, [isLoaded, zoom, customerLocation, driverLocation]);

  // دالة لرسم المسار على الخريطة
  const drawRoute = (routeData: RouteData) => {
    if (!mapInstanceRef.current || !window.google) return;

    // مسح المسار السابق
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    try {
      let pathCoordinates: any[] = [];

      // استخدام encoded polyline إذا كان متاح
      if (routeData.encodedPolyline) {
        pathCoordinates = window.google.maps.geometry.encoding.decodePath(routeData.encodedPolyline);
      }
      // أو استخدام البيانات المباشرة من Google Directions API
      else if (routeData.routes && routeData.routes.length > 0) {
        const route = routeData.routes[0];
        if (route.overview_polyline && route.overview_polyline.points) {
          pathCoordinates = window.google.maps.geometry.encoding.decodePath(route.overview_polyline.points);
        }
      }

      if (pathCoordinates.length > 0) {
        // إنشاء polyline للمسار
        const routePolyline = new window.google.maps.Polyline({
          path: pathCoordinates,
          geodesic: true,
          strokeColor: '#4F46E5', // لون أزرق
          strokeOpacity: 1.0,
          strokeWeight: 4,
          clickable: false
        });

        routePolyline.setMap(mapInstanceRef.current);
        polylineRef.current = routePolyline;

        // تعديل حدود الخريطة لتشمل كامل المسار
        const bounds = new window.google.maps.LatLngBounds();
        pathCoordinates.forEach(coord => bounds.extend(coord));
        mapInstanceRef.current.fitBounds(bounds, 50); // 50px padding

        console.log('✅ تم رسم المسار على الخريطة');
      }
    } catch (error) {
      console.error('❌ خطأ في رسم المسار:', error);
    }
  };

  // رسم المسار عند توفر بيانات المسار
  useEffect(() => {
    if (showRoute && routeData && isLoaded) {
      drawRoute(routeData);
    } else if (!showRoute && polylineRef.current) {
      // مسح المسار إذا تم إلغاء العرض
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
  }, [showRoute, routeData, isLoaded]);

  // إضافة العلامات
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return;

    // علامة العميل
    if (customerLocation) {
      if (customerMarkerRef.current) {
        customerMarkerRef.current.setMap(null);
      }
      
      customerMarkerRef.current = new window.google.maps.Marker({
        position: customerLocation,
        map: mapInstanceRef.current,
        title: 'موقع العميل',
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#1E40AF',
          strokeWeight: 2
        }
      });
    }

    // علامة وجهة التسليم
    if (orderDestination) {
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setMap(null);
      }
      
      destinationMarkerRef.current = new window.google.maps.Marker({
        position: orderDestination,
        map: mapInstanceRef.current,
        title: 'وجهة التسليم',
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: '#059669',
          strokeWeight: 2
        }
      });
    }
  }, [customerLocation, orderDestination]);

  // تحديث موقع الكابتن
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || !driverLocation) return;

    // إزالة العلامة القديمة
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setMap(null);
    }

    // إضافة علامة جديدة للكابتن
    driverMarkerRef.current = new window.google.maps.Marker({
      position: { lat: driverLocation.lat, lng: driverLocation.lng },
      map: mapInstanceRef.current,
      title: `${driverLocation.driverName || 'الكابتن'} - ${new Date(driverLocation.timestamp).toLocaleTimeString('ar-EG')}`,
      icon: {
        path: 'M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z',
        scale: 2,
        fillColor: '#EF4444',
        fillOpacity: 1,
        strokeColor: '#DC2626',
        strokeWeight: 1,
        rotation: driverLocation.heading || 0
      },
      animation: window.google.maps.Animation.DROP
    });

    // رسم المسار باستخدام Google Directions API إذا كانت الوجهة متاحة
    if (orderDestination) {
      const directionsService = new window.google.maps.DirectionsService();
      const directionsRenderer = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        strokeColor: '#3B82F6',
        strokeWeight: 4,
        strokeOpacity: 0.8
      });

      // إزالة المسار القديم
      if (routeRef.current) {
        routeRef.current.setMap(null);
      }

      directionsService.route(
        {
          origin: { lat: driverLocation.lat, lng: driverLocation.lng },
          destination: orderDestination,
          travelMode: window.google.maps.TravelMode.DRIVING,
          avoidHighways: false,
          avoidTolls: false
        },
        (result: any, status: any) => {
          if (status === 'OK') {
            directionsRenderer.setDirections(result);
            directionsRenderer.setMap(mapInstanceRef.current);
            routeRef.current = directionsRenderer;
          } else {
            console.warn('فشل في رسم المسار:', status);
          }
        }
      );
    }

    // تمركز الخريطة على الكابتن
    mapInstanceRef.current.setCenter({ lat: driverLocation.lat, lng: driverLocation.lng });
    
  }, [driverLocation, orderDestination]);

  // بدء تتبع موقع الكابتن (للكباتن فقط)
  const startLocationTracking = () => {
    if (!isDriverMode || !navigator.geolocation) {
      setError('خدمة تحديد الموقع غير متاحة');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: DriverLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
          speed: position.coords.speed || 0,
          heading: position.coords.heading || 0
        };

        if (onDriverLocationUpdate) {
          onDriverLocationUpdate(newLocation);
        }

        setTrackingActive(true);
        console.log('📍 Driver location updated:', newLocation);
      },
      (error) => {
        console.error('❌ Geolocation error:', error);
        setError('خطأ في الحصول على الموقع');
        setTrackingActive(false);
      },
      options
    );
  };

  // إيقاف التتبع
  const stopLocationTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTrackingActive(false);
  };

  // تنظيف عند إلغاء التحميل
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, []);

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center">
          <MapPin className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            إعادة المحاولة
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            التتبع المباشر
          </CardTitle>
          
          {isDriverMode && (
            <div className="flex items-center gap-2">
              {trackingActive ? (
                <Badge variant="default" className="bg-green-500">
                  <Navigation className="h-3 w-3 mr-1" />
                  التتبع نشط
                </Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={startLocationTracking}
                  disabled={!isLoaded}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  بدء التتبع
                </Button>
              )}
              
              {trackingActive && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={stopLocationTracking}
                >
                  إيقاف التتبع
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {!isLoaded ? (
          <div 
            className="flex items-center justify-center bg-gray-100 rounded-b-lg"
            style={{ height }}
          >
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">جاري تحميل الخريطة...</p>
            </div>
          </div>
        ) : (
          <div
            ref={mapRef}
            style={{ height, width: '100%' }}
            className="rounded-b-lg"
          />
        )}
        
        {/* معلومات إضافية */}
        {driverLocation && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-500" />
                <span>آخر تحديث:</span>
                <span className="font-medium">
                  {new Date(driverLocation.timestamp).toLocaleTimeString('ar-EG')}
                </span>
              </div>
              
              {driverLocation.speed && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span>السرعة:</span>
                  <span className="font-medium">
                    {Math.round((driverLocation.speed || 0) * 3.6)} كم/س
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}