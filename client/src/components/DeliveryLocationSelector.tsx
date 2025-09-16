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

export interface SelectedDeliveryLocation {
  type: 'fixed' | 'gps' | 'search' | 'manual';
  location: LocationData;
  validation: DeliveryValidation;
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
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

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

    const location: LocationData = {
      latitude: 30.0964396, // موقع افتراضي في السويس
      longitude: 32.4642696,
      address: manualAddress.trim()
    };

    const validation = validateDeliveryLocation(location);

    const selection: SelectedDeliveryLocation = {
      type: 'manual',
      location,
      validation,
      displayName: manualAddress.trim()
    };

    onLocationSelect(selection);
    setShowManualInput(false);
    setManualAddress('');
    
    toast({
      title: "تم إضافة العنوان",
      description: `تم إضافة العنوان اليدوي - رسوم التوصيل: ${validation.deliveryFee} جنيه`,
      variant: validation.isValid ? "default" : "destructive"
    });
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        {/* الموقع المحدد حالياً */}
        {currentSelection && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                  <MapPin className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-900">{currentSelection.displayName}</p>
                  <p className="text-sm text-green-700">
                    رسوم التوصيل: {currentSelection.validation.deliveryFee} جنيه
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLocationClear}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                data-testid="button-clear-location"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* شريط البحث */}
        <div className="relative mb-4">
          <Input
            type="text"
            placeholder="أين تريد التوصيل وبكم؟"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pr-12 text-right placeholder:text-gray-400 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            data-testid="input-delivery-search"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>

        {/* زر اختر من الخريطة */}
        <Button
          variant="default"
          className="w-full h-12 mb-4 bg-blue-600 hover:bg-blue-700 text-white"
          data-testid="button-choose-from-map"
        >
          <Map className="h-5 w-5 ml-2" />
          اختر من الخريطة
        </Button>

        {/* نتائج البحث - تظهر فقط عند البحث */}
        {searchQuery.trim() && (
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
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>لا توجد نتائج للبحث "{searchQuery}"</p>
                <p className="text-sm mt-1">جرب كلمات مختلفة أو استخدم موقعك الحالي</p>
              </div>
            )}
          </div>
        )}

        {/* أزرار الخيارات الإضافية */}
        <div className="space-y-3">
          {/* زر الموقع الحالي */}
          <Button
            variant="outline"
            className="w-full h-12 border-gray-300 hover:bg-gray-50"
            onClick={handleGetCurrentLocation}
            disabled={isGettingLocation}
            data-testid="button-current-location"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-gray-900">موقعي الحالي</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">استخدم GPS</span>
                {isGettingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <Navigation className="h-4 w-4 text-blue-600" />
                )}
              </div>
            </div>
          </Button>

          {/* زر إدخال عنوان يدوي */}
          <Button
            variant="outline"
            className="w-full h-12 border-gray-300 hover:bg-gray-50"
            onClick={() => setShowManualInput(!showManualInput)}
            data-testid="button-manual-address"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-gray-900">إدخال عنوان يدوي</span>
              <Edit className="h-4 w-4 text-blue-600" />
            </div>
          </Button>
        </div>

        {/* إدخال عنوان يدوي */}
        {showManualInput && (
          <div className="mt-4 space-y-3 pt-4 border-t">
            <Input
              type="text"
              placeholder="اكتب عنوانك بالتفصيل..."
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              className="w-full text-right"
              data-testid="input-manual-address"
            />
            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={handleManualAddressSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                data-testid="button-submit-manual"
              >
                تأكيد العنوان
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowManualInput(false);
                  setManualAddress('');
                }}
                data-testid="button-cancel-manual"
              >
                إلغاء
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeliveryLocationSelector;