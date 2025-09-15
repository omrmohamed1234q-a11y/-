import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, AlertCircle, CheckCircle, Loader2, Search, Target, Map, Clock, Home } from 'lucide-react';
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
    google: { maps: any };
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
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // Use secure Google Maps loader
  const { isLoaded: isMapLoaded, isLoading, error: mapsError, api: googleMapsAPI, loadMaps } = useGoogleMaps({
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
    setIsLocationLoading(true);
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
      setIsLocationLoading(false);
    }
  };

  const handleGetCurrentLocation = async () => {
    setIsLocationLoading(true);
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
      setIsLocationLoading(false);
    }
  };

  const handleSearchLocation = async () => {
    if (!searchQuery.trim() || !window.google) return;
    
    setIsLocationLoading(true);
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
      setIsLocationLoading(false);
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
    setIsLocationLoading(true);
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
      setIsLocationLoading(false);
    }
  };

  // Handle manual address entry
  const handleManualAddress = async () => {
    if (!manualAddress.trim()) {
      setError('يرجى إدخال العنوان');
      return;
    }
    
    setIsLocationLoading(true);
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
      setIsLocationLoading(false);
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
    <div className={`${className} ${getValidationColor()}`}>
      {/* Dark themed location picker matching the provided images */}
      <div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
        {/* Header - only show when validation exists */}
        {validation && (
          <div className="bg-green-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-white" />
              <span className="text-white font-medium">تحديد موقع التوصيل بدقة</span>
            </div>
          </div>
        )}

        <div className="p-6 space-y-4">
          {!showMap ? (
            /* Modern dark location search interface */
            <div className="space-y-4">
              {/* Search input with dark theme */}
              <div className="relative">
                <div className="flex items-center bg-gray-800 rounded-2xl border border-gray-600 overflow-hidden">
                  <Search className="h-5 w-5 text-gray-400 ml-4" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="أين تريد التوصيل وبكم؟"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchLocation()}
                    className="bg-transparent border-0 text-white placeholder:text-gray-400 text-lg font-medium px-4 py-4 focus:ring-0 focus:outline-none"
                  />
                </div>
              </div>

              {/* Choose on map option */}
              <button
                onClick={() => setShowMap(true)}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-800 rounded-xl transition-colors"
                data-testid="button-choose-map"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <span className="text-blue-400 font-medium text-lg">اختر من الخريطة</span>
              </button>

              {/* Recent locations with dark theme */}
              <div className="space-y-2">
                {suezAreas.slice(0, 4).map((area, index) => (
                  <button
                    key={area.name}
                    onClick={() => handleAreaSelect(area)}
                    disabled={isLocationLoading}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-800 rounded-xl transition-colors text-right"
                    data-testid={`button-area-${area.name}`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-700 rounded-lg">
                      <Clock className="h-4 w-4 text-gray-300" />
                    </div>
                    <div className="flex-1 text-right">
                      <div className="text-white font-medium">{area.name}</div>
                      <div className="text-gray-400 text-sm">السويس</div>
                    </div>
                  </button>
                ))}

                {/* Current location option */}
                <button
                  onClick={handleGetCurrentLocation}
                  disabled={isLocationLoading}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-800 rounded-xl transition-colors text-right"
                  data-testid="button-current-location"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-gray-700 rounded-lg">
                    {isLocationLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
                    ) : (
                      <Navigation className="h-4 w-4 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 text-right">
                    <div className="text-white font-medium">موقعي الحالي</div>
                    <div className="text-gray-400 text-sm">
                      {isLocationLoading ? 'جاري تحديد الموقع...' : 'استخدم GPS'}
                    </div>
                  </div>
                </button>
              </div>

              {/* Manual address input option */}
              {showSimpleLocationPicker && (
                <div className="space-y-3 pt-4 border-t border-gray-700">
                  <div className="flex gap-2">
                    <Input
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      placeholder="اكتب عنوانك بالتفصيل..."
                      onKeyPress={(e) => e.key === 'Enter' && handleManualAddress()}
                      className="flex-1 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                    />
                    <Button
                      onClick={handleManualAddress}
                      disabled={isLocationLoading || !manualAddress.trim()}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      تأكيد
                    </Button>
                  </div>
                </div>
              )}

              {/* Toggle manual input */}
              <button
                onClick={() => setShowSimpleLocationPicker(!showSimpleLocationPicker)}
                className="w-full text-center py-2 text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                {showSimpleLocationPicker ? 'إخفاء إدخال يدوي' : 'إدخال عنوان يدوي'}
              </button>
            </div>
          ) : (
            /* Map interface with dark theme */
            <div className="space-y-4">
              {/* Search bar */}
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن عنوان أو منطقة في السويس..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchLocation()}
                  className="flex-1 bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                />
                <Button
                  onClick={handleSearchLocation}
                  disabled={isLocationLoading || !searchQuery.trim()}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {/* Map container */}
              <div className="relative">
                <div 
                  ref={mapRef} 
                  className="w-full h-80 rounded-lg border border-gray-600"
                  style={{ minHeight: '320px' }}
                />
                
                {/* Map controls overlay */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <Button
                    onClick={handleGetCurrentLocation}
                    disabled={isLocationLoading}
                    size="sm"
                    className="bg-gray-800 hover:bg-gray-700 text-white border-gray-600 shadow-md"
                  >
                    <Target className="h-4 w-4" />
                  </Button>
                </div>

                {/* Loading overlay */}
                {isLocationLoading && (
                  <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center rounded-lg">
                    <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg shadow-lg border border-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span className="text-sm text-white">جاري تحديد الموقع...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="text-xs text-gray-400 text-center p-3 bg-gray-800 rounded-lg border border-gray-600">
                استخدم ctrl + scroll لتكبير/تصغير الخريطة
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowMap(false)}
                  variant="outline"
                  className="flex-1 bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                >
                  إغلاق الخريطة
                </Button>
                {validation && (
                  <Button
                    onClick={handleClearLocation}
                    variant="outline"
                    className="px-4 bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                  >
                    مسح
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Location validation results with dark theme */}
      {validation && (
        <div className="mt-4">
          {validation.isValid ? (
            <div className="bg-green-900 border border-green-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="font-medium text-green-100">موقع صالح للتوصيل</span>
              </div>
              <div className="space-y-1 text-sm text-green-200">
                <div>المسافة: {validation.distance.toFixed(1)} كيلومتر</div>
                <div>رسوم التوصيل: {validation.deliveryFee.toFixed(0)} جنيه</div>
                {address && <div>العنوان: {address}</div>}
              </div>
            </div>
          ) : (
            <div className="bg-red-900 border border-red-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <span className="font-medium text-red-100">موقع غير صالح للتوصيل</span>
              </div>
              <div className="space-y-1 text-sm text-red-200">
                <div>{validation.message}</div>
                {validation.area && <div>المنطقة: {validation.area}</div>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error message with dark theme */}
      {error && (
        <div className="mt-4 bg-red-900 border border-red-700 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-100">{error}</span>
          </div>
        </div>
      )}

      {/* Service area info with dark theme */}
      <div className="mt-4 text-xs text-gray-400 text-center p-3 bg-gray-800 rounded-lg border border-gray-700">
        نخدم جميع أنحاء مدينة السويس (عدا منطقة العين السخنة)
      </div>
    </div>
  );
};

export default MapLocationPicker;