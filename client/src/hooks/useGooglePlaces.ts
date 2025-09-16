/**
 * Hook للتعامل مع Google Places API
 * Google Places API integration hook
 */

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
  rating?: number;
  vicinity?: string;
}

export interface PlaceSearchOptions {
  location?: {
    lat: number;
    lng: number;
  };
  radius?: number;
  type?: string;
  language?: string;
}

declare global {
  interface Window {
    google: {
      maps: {
        places: {
          PlacesService: new (map: any) => any;
          PlacesServiceStatus: {
            OK: string;
            ZERO_RESULTS: string;
            OVER_QUERY_LIMIT: string;
            REQUEST_DENIED: string;
            INVALID_REQUEST: string;
          };
        };
        LatLng: new (lat: number, lng: number) => any;
        Map: new (element: HTMLElement, options: any) => any;
      };
    };
  }
}

export function useGooglePlaces() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const isGoogleMapsLoaded = useCallback(() => {
    return !!(window.google && window.google.maps && window.google.maps.places);
  }, []);

  const searchPlaces = useCallback(async (
    query: string,
    options: PlaceSearchOptions = {}
  ): Promise<PlaceResult[]> => {
    if (!isGoogleMapsLoaded()) {
      const error = 'Google Maps API غير محمل';
      setError(error);
      return [];
    }

    if (!query.trim()) {
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      return new Promise((resolve, reject) => {
        // إنشاء خريطة مؤقتة للبحث
        const mapElement = document.createElement('div');
        const map = new window.google.maps.Map(mapElement, {
          center: options.location || { lat: 30.0964396, lng: 32.4642696 }, // السويس
          zoom: 13
        });

        const service = new window.google.maps.places.PlacesService(map);

        const request = {
          query: query,
          location: options.location ? 
            new window.google.maps.LatLng(options.location.lat, options.location.lng) : 
            new window.google.maps.LatLng(30.0964396, 32.4642696),
          radius: options.radius || 50000, // 50 كم
          language: options.language || 'ar',
          fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types', 'rating']
        };

        service.textSearch(request, (results: any[], status: string) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            const places: PlaceResult[] = results.map(place => ({
              place_id: place.place_id,
              name: place.name,
              formatted_address: place.formatted_address,
              geometry: {
                location: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                }
              },
              types: place.types || [],
              rating: place.rating,
              vicinity: place.vicinity
            }));
            resolve(places);
          } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
          } else {
            reject(new Error(`فشل في البحث: ${status}`));
          }
        });
      });
    } catch (err: any) {
      const errorMessage = err.message || 'حدث خطأ في البحث';
      setError(errorMessage);
      toast({
        title: "خطأ في البحث",
        description: errorMessage,
        variant: "destructive"
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isGoogleMapsLoaded, toast]);

  const findPlaceByCoordinates = useCallback(async (
    lat: number,
    lng: number
  ): Promise<PlaceResult | null> => {
    if (!isGoogleMapsLoaded()) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      return new Promise((resolve, reject) => {
        const mapElement = document.createElement('div');
        const map = new window.google.maps.Map(mapElement, {
          center: { lat, lng },
          zoom: 15
        });

        const service = new window.google.maps.places.PlacesService(map);
        const location = new window.google.maps.LatLng(lat, lng);

        const request = {
          location: location,
          radius: 100, // 100 متر
          language: 'ar'
        };

        service.nearbySearch(request, (results: any[], status: string) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
            const place = results[0];
            resolve({
              place_id: place.place_id,
              name: place.name,
              formatted_address: place.vicinity || `${lat}, ${lng}`,
              geometry: {
                location: { lat, lng }
              },
              types: place.types || [],
              rating: place.rating
            });
          } else {
            resolve(null);
          }
        });
      });
    } catch (err: any) {
      setError(err.message || 'فشل في تحديد الموقع');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isGoogleMapsLoaded]);

  const getPlaceDetails = useCallback(async (
    placeId: string
  ): Promise<PlaceResult | null> => {
    if (!isGoogleMapsLoaded()) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      return new Promise((resolve, reject) => {
        const mapElement = document.createElement('div');
        const map = new window.google.maps.Map(mapElement, {
          center: { lat: 30.0964396, lng: 32.4642696 },
          zoom: 13
        });

        const service = new window.google.maps.places.PlacesService(map);

        const request = {
          placeId: placeId,
          fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types', 'rating'],
          language: 'ar'
        };

        service.getDetails(request, (place: any, status: string) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            resolve({
              place_id: place.place_id,
              name: place.name,
              formatted_address: place.formatted_address,
              geometry: {
                location: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                }
              },
              types: place.types || [],
              rating: place.rating
            });
          } else {
            resolve(null);
          }
        });
      });
    } catch (err: any) {
      setError(err.message || 'فشل في الحصول على تفاصيل المكان');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isGoogleMapsLoaded]);

  return {
    searchPlaces,
    findPlaceByCoordinates,
    getPlaceDetails,
    isLoading,
    error,
    isGoogleMapsLoaded: isGoogleMapsLoaded()
  };
}