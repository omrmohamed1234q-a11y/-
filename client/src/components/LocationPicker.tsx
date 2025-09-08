import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Navigation, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { 
  getCurrentLocation, 
  validateDeliveryLocation, 
  reverseGeocode,
  getSuezAreaName,
  type LocationData, 
  type DeliveryValidation 
} from '@/utils/locationUtils';

interface LocationPickerProps {
  onLocationSelect: (location: LocationData, validation: DeliveryValidation) => void;
  onLocationClear?: () => void;
  currentLocation?: LocationData;
  className?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  onLocationClear,
  currentLocation,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [validation, setValidation] = useState<DeliveryValidation | null>(null);
  const [address, setAddress] = useState<string>('');

  const handleGetLocation = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const location = await getCurrentLocation();
      const validationResult = validateDeliveryLocation(location);
      
      // محاولة الحصول على العنوان
      try {
        const locationAddress = await reverseGeocode(location.latitude, location.longitude);
        setAddress(locationAddress);
        location.address = locationAddress;
      } catch (addressError) {
        console.warn('فشل في الحصول على العنوان:', addressError);
        setAddress(`${getSuezAreaName(location.latitude, location.longitude)}`);
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

  const handleClearLocation = () => {
    setValidation(null);
    setError('');
    setAddress('');
    onLocationClear?.();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="h-5 w-5" />
          تحديد موقع التوصيل
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Location Button */}
        <div className="flex gap-2">
          <Button
            onClick={handleGetLocation}
            disabled={isLoading}
            className="flex-1"
            data-testid="get-location-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                جاري تحديد الموقع...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 ml-1" />
                تحديد موقعي الحالي
              </>
            )}
          </Button>
          
          {validation && (
            <Button
              variant="outline"
              onClick={handleClearLocation}
              data-testid="clear-location-button"
            >
              مسح
            </Button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Location Validation Result */}
        {validation && (
          <div className="space-y-3">
            <Alert variant={validation.isValid ? "default" : "destructive"}>
              {validation.isValid ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{validation.message}</AlertDescription>
            </Alert>

            {/* Location Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">المنطقة:</span>
                <Badge variant={validation.isValid ? "default" : "destructive"} className="mr-2">
                  {validation.area}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">المسافة:</span>
                <span className="font-medium mr-2">{validation.distance.toFixed(1)} كم</span>
              </div>
              {validation.isValid && (
                <div className="col-span-2">
                  <span className="text-gray-600">رسوم التوصيل:</span>
                  <span className="font-bold text-green-600 mr-2">
                    {validation.deliveryFee} جنيه
                  </span>
                  <span className="text-xs text-gray-500">
                    (5 جنيه رسوم ثابتة + {validation.distance.toFixed(1)} × 1.5 جنيه/كم)
                  </span>
                </div>
              )}
            </div>

            {/* Address */}
            {address && (
              <div className="text-sm">
                <span className="text-gray-600">العنوان التقريبي:</span>
                <p className="mt-1 p-2 bg-gray-50 rounded text-xs break-words">
                  {address}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• التوصيل متاح فقط داخل محافظة السويس</p>
          <p>• المناطق المستبعدة: السخنة والمناطق البعيدة أكثر من 20 كم</p>
          <p>• نقطة المرجع: مطبعة الجزيرة، السويس</p>
          <p>• أقصى رسوم توصيل: 35 جنيه</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LocationPicker;