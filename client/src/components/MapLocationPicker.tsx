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
import { useGoogleMaps } from '@/lib/googleMapsLoader';

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
  const [validation, setValidation] = useState<DeliveryValidation | null>(null);
  const [address, setAddress] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mapCenter, setMapCenter] = useState({ lat: 30.0964396, lng: 32.4642696 }); // Default to Suez center
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showSimpleLocationPicker, setShowSimpleLocationPicker] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  
  // Use secure Google Maps loader
  const { isLoaded: isMapLoaded, isLoading, error, api: googleMapsAPI, loadMaps } = useGoogleMaps({
    libraries: ['places'],
    language: 'ar',
    region: 'EG'
  });
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Predefined areas in Suez with coordinates
  const suezAreas = [
    { name: 'الأربعين', lat: 30.0964396, lng: 32.4642696 },
    { name: 'السويس الجديدة', lat: 30.0456789, lng: 32.5123456 },
    { name: 'الجناين', lat: 30.0612345, lng: 32.4789012 },
    { name: 'فيصل', lat: 30.0834567, lng: 32.4567890 },
    { name: 'الضواحي', lat: 30.0723456, lng: 32.4901234 },
    { name: 'المدينة المنورة', lat: 30.0545678, lng: 32.4812345 },
    { name: 'الصدر', lat: 30.0767890, lng: 32.4656789 },
    { name: 'الشيخ زايد', lat: 30.0890123, lng: 32.4734567 }
  ];

  // Load Google Maps when user wants to show map
  useEffect(() => {
    if (showMap && !isMapLoaded && !isLoading) {
      console.log('🗺️ User requested map - loading Google Maps...');
      loadMaps();
    }
  }, [showMap, isMapLoaded, isLoading, loadMaps]);

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
    setManualAddress('');
    setSelectedArea('');
    onLocationClear?.();
  };

  // Handle area selection
  const handleAreaSelect = async (area: typeof suezAreas[0]) => {
    setIsLoading(true);
    setError('');
    
    try {
      const locationData: LocationData = {
        latitude: area.lat,
        longitude: area.lng,
        address: `منطقة ${area.name}، السويس`
      };
      
      const validation = await validateDeliveryLocation(locationData);
      setValidation(validation);
      setAddress(locationData.address || '');
      setSelectedArea(area.name);
      
      if (validation.isValid) {
        onLocationSelect(locationData, validation);
      }
    } catch (error) {
      console.error('Error validating area:', error);
      setError('حدث خطأ في التحقق من المنطقة');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle manual address entry
  const handleManualAddress = async () => {
    if (!manualAddress.trim()) {
      setError('يرجى إدخال العنوان');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Use default Suez coordinates for manual address
      const locationData: LocationData = {
        latitude: 30.0964396,
        longitude: 32.4642696,
        address: manualAddress.trim()
      };
      
      const validation = await validateDeliveryLocation(locationData);
      setValidation(validation);
      setAddress(manualAddress.trim());
      
      if (validation.isValid) {
        onLocationSelect(locationData, validation);
      }
    } catch (error) {
      console.error('Error validating manual address:', error);
      setError('حدث خطأ في التحقق من العنوان');
    } finally {
      setIsLoading(false);
    }
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
              
              <Button
                onClick={() => setShowSimpleLocationPicker(!showSimpleLocationPicker)}
                className="w-full bg-green-600 hover:bg-green-700"
                variant="outline"
              >
                <MapPin className="h-4 w-4 ml-2" />
                {showSimpleLocationPicker ? 'إخفاء' : 'عرض'} خيارات أخرى
              </Button>
            </div>

            {/* Simple location picker alternatives */}
            {showSimpleLocationPicker && (
              <div className="space-y-4 border-t pt-4 mt-4">
                <h4 className="font-medium text-gray-900 text-center">🏠 اختر منطقتك أو اكتب عنوانك</h4>
                
                {/* Manual address input */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      placeholder="اكتب عنوانك بالتفصيل..."
                      onKeyPress={(e) => e.key === 'Enter' && handleManualAddress()}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleManualAddress}
                      disabled={isLoading || !manualAddress.trim()}
                      size="sm"
                    >
                      تأكيد
                    </Button>
                  </div>
                </div>

                {/* Area selection */}
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 text-center">أو اختر منطقتك:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {suezAreas.map((area) => (
                      <Button
                        key={area.name}
                        onClick={() => handleAreaSelect(area)}
                        disabled={isLoading}
                        variant={selectedArea === area.name ? "default" : "outline"}
                        size="sm"
                        className="text-sm"
                      >
                        {area.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
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