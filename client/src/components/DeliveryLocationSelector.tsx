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
  const [searchResults, setSearchResults] = useState<FixedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const { toast } = useToast();

  // البحث في الأماكن الثابتة
  const searchLocations = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults(getPopularLocations());
      return;
    }

    const filtered = FIXED_LOCATIONS.filter(location =>
      location.name.includes(query) ||
      location.city.includes(query)
    );

    // ترتيب حسب الشعبية أولاً
    const sorted = filtered.sort((a, b) => {
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      return a.deliveryFee - b.deliveryFee;
    });

    setSearchResults(sorted);
  }, []);

  // تحديث البحث عند تغيير النص
  useEffect(() => {
    searchLocations(searchQuery);
  }, [searchQuery, searchLocations]);

  // تحميل الأماكن الشائعة في البداية
  useEffect(() => {
    setSearchResults(getPopularLocations());
  }, []);

  // اختيار مكان ثابت
  const handleFixedLocationSelect = async (fixedLocation: FixedLocation) => {
    const locationData: LocationData = {
      latitude: fixedLocation.coordinates.lat,
      longitude: fixedLocation.coordinates.lng,
      address: `${fixedLocation.name}, ${fixedLocation.city}`
    };

    const validation = validateDeliveryLocation(locationData);

    const selection: SelectedDeliveryLocation = {
      type: 'fixed',
      location: locationData,
      validation,
      fixedLocationData: fixedLocation,
      displayName: fixedLocation.name
    };

    onLocationSelect(selection);
    toast({
      title: "تم اختيار الموقع",
      description: `${fixedLocation.name} - رسوم التوصيل: ${fixedLocation.deliveryFee} جنيه`,
    });
  };

  // الحصول على الموقع الحالي
  const handleGetCurrentLocation = async () => {
    setIsGettingLocation(true);
    
    try {
      const location = await getCurrentLocation();
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
          {searchResults.map((location) => (
            <Button
              key={location.id}
              variant="ghost"
              className="w-full h-16 justify-between p-4 hover:bg-gray-50"
              onClick={() => handleFixedLocationSelect(location)}
              data-testid={`location-${location.id}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                  <Clock className="h-4 w-4 text-gray-600" />
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{location.name}</p>
                  <p className="text-sm text-gray-500">{location.city}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-blue-600">
                {location.deliveryFee} جنيه
              </Badge>
            </Button>
          ))}
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