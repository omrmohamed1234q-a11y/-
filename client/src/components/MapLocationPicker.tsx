import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, AlertCircle, CheckCircle, Loader2, Search, Target, Map } from 'lucide-react';
import { 
  getCurrentLocation, 
  validateDeliveryLocation, 
  reverseGeocode,
  getSuezAreaName,
  type LocationData, 
  type DeliveryValidation 
} from '@/utils/locationUtils';

interface MapLocationPickerProps {
  onLocationSelect: (location: LocationData, validation: DeliveryValidation) => void;
  onLocationClear?: () => void;
  currentLocation?: LocationData;
  className?: string;
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps?: () => void;
    googleMapsReady?: boolean;
    googleMapsCallback?: () => void;
  }
}

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  onLocationSelect,
  onLocationClear,
  currentLocation,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [validation, setValidation] = useState<DeliveryValidation | null>(null);
  const [address, setAddress] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mapCenter, setMapCenter] = useState({ lat: 30.0964396, lng: 32.4642696 }); // Default to Suez center
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [showMap, setShowMap] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Check for Google Maps availability
  useEffect(() => {
    if (showMap) {
      setIsLoading(true);
      
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        console.log('✅ Google Maps already available');
        setIsMapLoaded(true);
        setIsLoading(false);
        setError('');
        return;
      }
      
      // Check if ready flag is set
      if (window.googleMapsReady) {
        console.log('✅ Google Maps ready flag detected');
        setIsMapLoaded(true);
        setIsLoading(false);
        setError('');
        return;
      }
      
      // Listen for Google Maps loaded event
      console.log('⏳ Waiting for Google Maps to load...');
      const handleGoogleMapsLoaded = () => {
        console.log('✅ Google Maps event received');
        setIsMapLoaded(true);
        setIsLoading(false);
        setError('');
      };
      
      window.addEventListener('googleMapsLoaded', handleGoogleMapsLoaded);
      
      // Fallback timeout
      const timeout = setTimeout(() => {
        if (!window.google || !window.google.maps) {
          console.warn('⚠️ Google Maps timeout - trying simple text location');
          setError('فشل تحميل الخريطة. يرجى تحديث الصفحة أو استخدام تحديد الموقع الحالي');
          setIsLoading(false);
        }
      }, 15000); // 15 seconds timeout
      
      // Cleanup
      return () => {
        clearTimeout(timeout);
        window.removeEventListener('googleMapsLoaded', handleGoogleMapsLoaded);
      };
    }
  }, [showMap]);

  // Initialize map when loaded
  useEffect(() => {
    if (isMapLoaded && mapRef.current && showMap) {
      initializeMap();
    }
  }, [isMapLoaded, showMap]);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: currentLocation ? 
        { lat: currentLocation.latitude, lng: currentLocation.longitude } : 
        mapCenter,
      zoom: 15,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    mapInstanceRef.current = map;

    // Add marker
    const marker = new window.google.maps.Marker({
      position: currentLocation ? 
        { lat: currentLocation.latitude, lng: currentLocation.longitude } : 
        mapCenter,
      map: map,
      draggable: true,
      title: 'اسحب لتحديد الموقع بدقة'
    });

    markerRef.current = marker;

    // Handle marker drag
    marker.addListener('dragend', async () => {
      const position = marker.getPosition();
      const lat = position.lat();
      const lng = position.lng();
      
      setSelectedPosition({ lat, lng });
      await handleLocationSelection(lat, lng);
    });

    // Handle map click
    map.addListener('click', async (event: any) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      
      marker.setPosition({ lat, lng });
      setSelectedPosition({ lat, lng });
      await handleLocationSelection(lat, lng);
    });

    // Set initial position if we have current location
    if (currentLocation) {
      setSelectedPosition({ lat: currentLocation.latitude, lng: currentLocation.longitude });
    }
  };

  const handleLocationSelection = async (lat: number, lng: number) => {
    setIsLoading(true);
    setError('');
    
    try {
      const location: LocationData = {
        latitude: lat,
        longitude: lng,
        accuracy: 10
      };

      const validationResult = validateDeliveryLocation(location);
      
      // Get address
      try {
        const locationAddress = await reverseGeocode(lat, lng);
        setAddress(locationAddress);
        location.address = locationAddress;
      } catch (addressError) {
        console.warn('فشل في الحصول على العنوان:', addressError);
        const areaName = getSuezAreaName(lat, lng);
        setAddress(areaName);
        location.address = areaName;
      }
      
      setValidation(validationResult);
      onLocationSelect(location, validationResult);
      
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في تحديد الموقع');
      setValidation(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const location = await getCurrentLocation();
      const validationResult = validateDeliveryLocation(location);
      
      // Update map center and marker
      const newCenter = { lat: location.latitude, lng: location.longitude };
      setMapCenter(newCenter);
      setSelectedPosition(newCenter);
      
      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.setCenter(newCenter);
        mapInstanceRef.current.setZoom(16);
        markerRef.current.setPosition(newCenter);
      }
      
      // Get address
      try {
        const locationAddress = await reverseGeocode(location.latitude, location.longitude);
        setAddress(locationAddress);
        location.address = locationAddress;
      } catch (addressError) {
        console.warn('فشل في الحصول على العنوان:', addressError);
        const areaName = getSuezAreaName(location.latitude, location.longitude);
        setAddress(areaName);
        location.address = areaName;
      }
      
      setValidation(validationResult);
      onLocationSelect(location, validationResult);
      
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في تحديد الموقع');
      setValidation(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchLocation = async () => {
    if (!searchQuery.trim() || !window.google) return;
    
    setIsLoading(true);
    setError('');
    
    const geocoder = new window.google.maps.Geocoder();
    
    try {
      const results = await new Promise((resolve, reject) => {
        geocoder.geocode({
          address: searchQuery + ', السويس, مصر',
          region: 'EG'
        }, (results: any, status: any) => {
          if (status === 'OK') {
            resolve(results);
          } else {
            reject(new Error('لم يتم العثور على الموقع'));
          }
        });
      });
      
      if (Array.isArray(results) && results.length > 0) {
        const result = results[0];
        const lat = result.geometry.location.lat();
        const lng = result.geometry.location.lng();
        
        const newCenter = { lat, lng };
        setMapCenter(newCenter);
        setSelectedPosition(newCenter);
        
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setCenter(newCenter);
          mapInstanceRef.current.setZoom(16);
          markerRef.current.setPosition(newCenter);
        }
        
        await handleLocationSelection(lat, lng);
      }
    } catch (err: any) {
      setError(err.message || 'فشل في البحث عن الموقع');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLocation = () => {
    setValidation(null);
    setError('');
    setAddress('');
    setSearchQuery('');
    setSelectedPosition(null);
    onLocationClear?.();
  };

  const getValidationIcon = () => {
    if (!validation) return <MapPin className="h-5 w-5 text-gray-400" />;
    return validation.isValid ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <AlertCircle className="h-5 w-5 text-red-500" />;
  };

  const getValidationColor = () => {
    if (!validation) return 'border-gray-200';
    return validation.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50';
  };

  return (
    <Card className={`${className} ${getValidationColor()}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            {getValidationIcon()}
            تحديد موقع التوصيل بدقة
          </div>
          {!showMap && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMap(true)}
              className="flex items-center gap-2"
            >
              <Map className="h-4 w-4" />
              فتح الخريطة
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showMap ? (
          /* Simple location picker */
          <div className="space-y-3">
            <div className="text-sm text-gray-600 text-center p-3 bg-blue-50 rounded-lg">
              📍 للحصول على أفضل خدمة توصيل، يرجى تحديد موقعك بدقة على الخريطة
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={handleGetCurrentLocation}
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <Navigation className="h-4 w-4 ml-2" />
                )}
                تحديد موقعي الحالي
              </Button>
              
              <Button
                onClick={() => setShowMap(true)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Map className="h-4 w-4 ml-2" />
                اختيار من الخريطة
              </Button>
            </div>
          </div>
        ) : (
          /* Advanced map picker */
          <div className="space-y-4">
            {/* Search bar */}
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن عنوان أو منطقة في السويس..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearchLocation()}
                className="flex-1"
              />
              <Button
                onClick={handleSearchLocation}
                disabled={isLoading || !searchQuery.trim()}
                size="sm"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Map container */}
            <div className="relative">
              <div 
                ref={mapRef} 
                className="w-full h-80 rounded-lg border"
                style={{ minHeight: '320px' }}
              />
              
              {/* Map controls overlay */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button
                  onClick={handleGetCurrentLocation}
                  disabled={isLoading}
                  size="sm"
                  className="bg-white hover:bg-gray-50 text-gray-700 border shadow-md"
                >
                  <Target className="h-4 w-4" />
                </Button>
              </div>

              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">جاري تحديد الموقع...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="text-xs text-gray-600 text-center p-2 bg-blue-50 rounded-lg">
              💡 اضغط على الخريطة أو اسحب العلامة لتحديد الموقع بدقة
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => setShowMap(false)}
                variant="outline"
                className="flex-1"
              >
                إغلاق الخريطة
              </Button>
              {validation && (
                <Button
                  onClick={handleClearLocation}
                  variant="outline"
                  className="px-4"
                >
                  مسح
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Location validation results */}
        {validation && (
          <div className="space-y-3">
            {validation.isValid ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium text-green-800">✅ موقع صالح للتوصيل</div>
                    <div className="text-sm text-green-700">
                      المسافة: {validation.distance.toFixed(1)} كيلومتر
                    </div>
                    <div className="text-sm text-green-700">
                      رسوم التوصيل: {validation.deliveryFee.toFixed(0)} جنيه
                    </div>
                    {address && (
                      <div className="text-sm text-green-700">
                        العنوان: {address}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">❌ موقع غير صالح للتوصيل</div>
                    <div className="text-sm">{validation.message}</div>
                    {validation.area && (
                      <div className="text-sm">المنطقة: {validation.area}</div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Service area info */}
        <div className="text-xs text-gray-500 text-center p-2 bg-gray-50 rounded-lg">
          🚚 نخدم جميع أنحاء مدينة السويس (عدا منطقة العين السخنة)
        </div>
      </CardContent>
    </Card>
  );
};

export default MapLocationPicker;