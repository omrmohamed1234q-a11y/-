import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Clock, 
  Loader2,
  Map,
  Edit
} from 'lucide-react';
import { FIXED_LOCATIONS, getPopularLocations, type FixedLocation } from '@/data/fixedLocations';
import { 
  getCurrentLocation, 
  validateDeliveryLocation, 
  reverseGeocode,
  calculateDistance,
  type LocationData, 
  type DeliveryValidation 
} from '@/utils/locationUtils';
import { useToast } from '@/hooks/use-toast';
import { useGooglePlaces, type PlaceResult } from '@/hooks/useGooglePlaces';
import { locationSearchService, type SearchResult } from '@/services/locationSearchService';
// إزالة مؤقتة لـ GoogleMapsLoader لحل المشكلة
// import { GoogleMapsLoader } from '@/lib/googleMapsLoader';

export interface SelectedDeliveryLocation {
  type: 'fixed' | 'gps' | 'search' | 'manual';
  location: LocationData;
  validation: DeliveryValidation;
  fixedLocationData?: FixedLocation;
  displayName: string;
}

interface DeliveryLocationSelectorProps {
  onLocationSelect: (selection: SelectedDeliveryLocation) => void;
  onLocationClear?: () => void;
  currentSelection?: SelectedDeliveryLocation;
  className?: string;
}

const DeliveryLocationSelector: React.FC<DeliveryLocationSelectorProps> = ({
  onLocationSelect,
  onLocationClear,
  currentSelection,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const { toast } = useToast();
  const { searchPlaces, isLoading: isPlacesLoading } = useGooglePlaces();

  // البحث المحسن مع دمج Google Places
  const searchLocations = useCallback(async (query: string) => {
    setIsLoading(true);
    
    try {
      // البحث في الخدمة المحلية أولاً
      const localResults = await locationSearchService.searchLocations(query, {
        userLocation,
        maxResults: 8,
        sortBy: userLocation ? 'distance' : 'popularity'
      });

      // إذا كان النص طويل، ابحث أيضاً في Google Places
      if (query.trim().length > 2) {
        try {
          const placesResults = await searchPlaces(query, {
            location: userLocation || { lat: 30.0964396, lng: 32.4642696 },
            radius: 50000
          });

          // تحويل نتائج Google Places إلى SearchResult
          const convertedPlaces: SearchResult[] = placesResults.map(place => ({
            id: place.place_id,
            name: place.name,
            address: place.formatted_address,
            coordinates: place.geometry.location,
            distance: userLocation ? calculateDistance(
              userLocation.lat,
              userLocation.lng,
              place.geometry.location.lat,
              place.geometry.location.lng
            ) : undefined,
            deliveryFee: 15, // رسوم افتراضية للأماكن من Google
            zone: 'mixed',
            isFixed: false,
            isPopular: false,
            source: 'places' as const
          }));

          // دمج النتائج وترتيبها
          const allResults = [...localResults, ...convertedPlaces];
          const uniqueResults = allResults.filter((result, index, array) => 
            array.findIndex(r => r.name === result.name && r.address === result.address) === index
          );

          setSearchResults(uniqueResults.slice(0, 10));
        } catch (placesError) {
          console.warn('فشل في البحث في Google Places:', placesError);
          setSearchResults(localResults);
        }
      } else {
        setSearchResults(localResults);
      }
    } catch (error) {
      console.error('خطأ في البحث:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [userLocation, searchPlaces]);

  // تحديث البحث عند تغيير النص
  useEffect(() => {
    searchLocations(searchQuery);
  }, [searchQuery, searchLocations]);

  // تحميل أماكن شائعة في البداية (بدون Google Maps مؤقتاً)
  useEffect(() => {
    const initializeService = async () => {
      try {
        // تحميل الأماكن الشائعة من الخدمة المحلية
        const popular = await locationSearchService.searchLocations('', {
          userLocation,
          includePopularOnly: true,
          maxResults: 6
        });
        setSearchResults(popular);
        
        // TODO: إضافة تحميل Google Maps API لاحقاً
        console.log('🎯 نظام اختيار الموقع جاهز مع البحث المحلي');
      } catch (error) {
        console.error('فشل في تهيئة خدمة المواقع:', error);
        // fallback للأماكن الثابتة
        setSearchResults([]);
      }
    };
    
    initializeService();
  }, [userLocation]);

  // اختيار موقع من النتائج
  const handleLocationSelect = async (searchResult: SearchResult) => {
    const locationData: LocationData = {
      latitude: searchResult.coordinates.lat,
      longitude: searchResult.coordinates.lng,
      address: searchResult.address
    };

    const validation = validateDeliveryLocation(locationData);

    const selection: SelectedDeliveryLocation = {
      type: searchResult.source === 'fixed' ? 'fixed' : 'search',
      location: locationData,
      validation,
      displayName: searchResult.name
    };

    // إضافة للبحثات الحديثة
    locationSearchService.addToRecentSearches(searchResult);

    onLocationSelect(selection);
    toast({
      title: "تم اختيار الموقع",
      description: `${searchResult.name} - رسوم التوصيل: ${validation.deliveryFee} جنيه`,
      variant: validation.isValid ? "default" : "destructive"
    });
  };

  // الحصول على الموقع الحالي
  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    
    try {
      const location = await getCurrentLocation();
      
      // حفظ موقع المستخدم للاستخدام في البحث
      setUserLocation({
        lat: location.latitude,
        lng: location.longitude
      });
      
      const validation = validateDeliveryLocation(location);
      
      // الحصول على العنوان
      try {
        const address = await reverseGeocode(location.latitude, location.longitude);
        location.address = address;
      } catch (error) {
        location.address = `موقعي الحالي (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`;
      }

      const selection: SelectedDeliveryLocation = {
        type: 'gps',
        location,
        validation,
        displayName: 'موقعي الحالي'
      };

      onLocationSelect(selection);
      toast({
        title: "تم تحديد موقعك",
        description: validation.isValid 
          ? `رسوم التوصيل: ${validation.deliveryFee} جنيه`
          : validation.message,
        variant: validation.isValid ? "default" : "destructive"
      });
      
    } catch (error: any) {
      toast({
        title: "خطأ في تحديد الموقع",
        description: error.message || "تعذر الحصول على موقعك الحالي",
        variant: "destructive"
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  // إدخال عنوان يدوي
  const handleManualAddressSubmit = async () => {
    if (!manualAddress.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال العنوان",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // محاولة البحث عن العنوان (يمكن تطوير هذا لاحقاً باستخدام Google Places API)
      // حالياً سنستخدم الإحداثيات الافتراضية للسويس
      const locationData: LocationData = {
        latitude: 30.0964396,
        longitude: 32.4642696,
        address: manualAddress
      };

      const validation = validateDeliveryLocation(locationData);

      const selection: SelectedDeliveryLocation = {
        type: 'manual',
        location: locationData,
        validation,
        displayName: manualAddress
      };

      onLocationSelect(selection);
      setShowManualInput(false);
      setManualAddress('');
      
      toast({
        title: "تم إضافة العنوان",
        description: validation.isValid 
          ? `رسوم التوصيل: ${validation.deliveryFee} جنيه`
          : validation.message,
        variant: validation.isValid ? "default" : "destructive"
      });
      
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "تعذر معالجة العنوان",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        {/* شريط البحث */}
        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="أين تريد التوصيل"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-12 h-12 text-lg"
            data-testid="search-delivery-location"
          />
        </div>

        {/* الأزرار السريعة */}
        <div className="space-y-3 mb-6">
          {/* اختر من الخريطة */}
          <Button
            variant="outline"
            className="w-full h-12 justify-start gap-3"
            disabled={isLoading}
            data-testid="button-choose-from-map"
          >
            <MapPin className="h-5 w-5 text-blue-500" />
            <span>اختر من الخريطة</span>
          </Button>

          {/* موقعي الحالي */}
          <Button
            variant="outline"
            className="w-full h-12 justify-start gap-3"
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
            data-testid="button-current-location"
          >
            {isGettingLocation ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            ) : (
              <Navigation className="h-5 w-5 text-blue-500" />
            )}
            <span>موقعي الحالي</span>
            <span className="text-sm text-gray-500">استخدم GPS</span>
          </Button>
        </div>

        {/* قائمة الأماكن */}
        <div className="space-y-2 mb-4">
          {isLoading || isPlacesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="mr-2 text-gray-600">جاري البحث...</span>
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((location) => (
              <Button
                key={location.id}
                variant="ghost"
                className="w-full h-16 justify-between p-4 hover:bg-gray-50"
                onClick={() => handleLocationSelect(location)}
                data-testid={`location-${location.id}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                    {location.source === 'fixed' ? (
                      <Clock className="h-4 w-4 text-gray-600" />
                    ) : (
                      <MapPin className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{location.name}</p>
                    <p className="text-sm text-gray-500">
                      {location.address}
                      {location.distance && (
                        <span className="text-blue-600 mr-2">
                          • {location.distance.toFixed(1)} كم
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {location.isPopular && (
                    <Badge variant="secondary" className="text-xs">
                      شائع
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-blue-600">
                    {location.deliveryFee} جنيه
                  </Badge>
                </div>
              </Button>
            ))
          ) : searchQuery.trim() ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>لا توجد نتائج للبحث "{searchQuery}"</p>
              <p className="text-sm mt-1">جرب كلمات مختلفة أو استخدم موقعك الحالي</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>ابدأ بكتابة اسم المكان أو استخدم موقعك الحالي</p>
            </div>
          )}
        </div>

        {/* إدخال عنوان يدوي */}
        {showManualInput ? (
          <div className="space-y-3 pt-4 border-t">
            <Input
              placeholder="اكتب عنوانك بالتفصيل"
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              className="h-12"
              data-testid="manual-address-input"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleManualAddressSubmit}
                disabled={isLoading || !manualAddress.trim()}
                className="flex-1"
                data-testid="submit-manual-address"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : null}
                تأكيد العنوان
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowManualInput(false);
                  setManualAddress('');
                }}
                data-testid="cancel-manual-address"
              >
                إلغاء
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full h-12 justify-start gap-3 text-blue-600"
            onClick={() => setShowManualInput(true)}
            data-testid="button-manual-address"
          >
            <Edit className="h-5 w-5" />
            <span>إدخال عنوان يدوي</span>
          </Button>
        )}

        {/* عرض الموقع المحدد */}
        {currentSelection && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-blue-900">{currentSelection.displayName}</p>
                <p className="text-sm text-blue-700">
                  رسوم التوصيل: {currentSelection.validation.deliveryFee} جنيه
                </p>
              </div>
              {onLocationClear && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLocationClear}
                  className="text-blue-600 hover:text-blue-700"
                  data-testid="clear-selected-location"
                >
                  تغيير
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeliveryLocationSelector;