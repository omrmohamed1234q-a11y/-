/**
 * خدمة البحث الذكي للمواقع مع دعم القرب والترتيب
 * Smart location search service with proximity and sorting support
 */

import { FIXED_LOCATIONS, type FixedLocation } from '@/data/fixedLocations';
import { 
  calculateDistance, 
  validateDeliveryLocation,
  type LocationData,
  type DeliveryValidation 
} from '@/utils/locationUtils';

export interface SearchResult {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  distance?: number;
  deliveryFee: number;
  zone: string;
  isFixed: boolean;
  isPopular: boolean;
  source: 'fixed' | 'places' | 'recent';
}

export interface ProximitySearchOptions {
  userLocation?: {
    lat: number;
    lng: number;
  };
  maxResults?: number;
  radiusKm?: number;
  includePopularOnly?: boolean;
  sortBy?: 'distance' | 'popularity' | 'price';
}

class LocationSearchService {
  private recentSearches: SearchResult[] = [];
  private popularSearches: SearchResult[] = [];

  constructor() {
    this.loadRecentSearches();
    this.initializePopularSearches();
  }

  /**
   * البحث الذكي مع دعم القرب
   */
  async searchLocations(
    query: string, 
    options: ProximitySearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      userLocation,
      maxResults = 10,
      radiusKm = 50,
      includePopularOnly = false,
      sortBy = 'distance'
    } = options;

    let results: SearchResult[] = [];

    // البحث في الأماكن الثابتة
    const fixedResults = this.searchFixedLocations(query, includePopularOnly);
    results.push(...fixedResults);

    // البحث في الأماكن الحديثة
    if (!query.trim()) {
      const recentResults = this.getRecentSearches().slice(0, 3);
      results.push(...recentResults);
    }

    // حساب المسافات إذا كان موقع المستخدم متاح
    if (userLocation) {
      results = this.calculateDistances(results, userLocation);
      results = this.filterByRadius(results, radiusKm);
    }

    // ترتيب النتائج
    results = this.sortResults(results, sortBy, !!userLocation);

    // تحديد العدد المطلوب
    return results.slice(0, maxResults);
  }

  /**
   * البحث في الأماكن الثابتة
   */
  private searchFixedLocations(query: string, popularOnly: boolean = false): SearchResult[] {
    let locations = popularOnly 
      ? FIXED_LOCATIONS.filter(loc => loc.isPopular)
      : FIXED_LOCATIONS;

    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      locations = locations.filter(location =>
        location.name.toLowerCase().includes(searchTerm) ||
        location.city.toLowerCase().includes(searchTerm)
      );
    }

    return locations.map(location => ({
      id: location.id,
      name: location.name,
      address: `${location.name}, ${location.city}`,
      coordinates: location.coordinates,
      deliveryFee: location.deliveryFee,
      zone: location.zone,
      isFixed: true,
      isPopular: location.isPopular,
      source: 'fixed' as const
    }));
  }

  /**
   * حساب المسافات من موقع المستخدم
   */
  private calculateDistances(
    results: SearchResult[], 
    userLocation: { lat: number; lng: number }
  ): SearchResult[] {
    return results.map(result => ({
      ...result,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        result.coordinates.lat,
        result.coordinates.lng
      )
    }));
  }

  /**
   * تصفية حسب نصف القطر
   */
  private filterByRadius(results: SearchResult[], radiusKm: number): SearchResult[] {
    return results.filter(result => 
      !result.distance || result.distance <= radiusKm
    );
  }

  /**
   * ترتيب النتائج
   */
  private sortResults(
    results: SearchResult[], 
    sortBy: 'distance' | 'popularity' | 'price',
    hasUserLocation: boolean
  ): SearchResult[] {
    return results.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          if (!hasUserLocation) return 0;
          const distA = a.distance || Infinity;
          const distB = b.distance || Infinity;
          return distA - distB;
          
        case 'popularity':
          if (a.isPopular && !b.isPopular) return -1;
          if (!a.isPopular && b.isPopular) return 1;
          return a.deliveryFee - b.deliveryFee;
          
        case 'price':
          return a.deliveryFee - b.deliveryFee;
          
        default:
          return 0;
      }
    });
  }

  /**
   * إضافة للبحثات الحديثة
   */
  addToRecentSearches(result: SearchResult): void {
    // إزالة إذا كان موجود مسبقاً
    this.recentSearches = this.recentSearches.filter(r => r.id !== result.id);
    
    // إضافة في المقدمة
    this.recentSearches.unshift(result);
    
    // الاحتفاظ بآخر 5 فقط
    this.recentSearches = this.recentSearches.slice(0, 5);
    
    // حفظ في localStorage
    this.saveRecentSearches();
  }

  /**
   * الحصول على البحثات الحديثة
   */
  getRecentSearches(): SearchResult[] {
    return [...this.recentSearches];
  }

  /**
   * الحصول على الأماكن الشائعة
   */
  getPopularLocations(): SearchResult[] {
    return this.searchFixedLocations('', true);
  }

  /**
   * تحقق من صحة الموقع للتوصيل
   */
  validateLocationForDelivery(result: SearchResult): DeliveryValidation {
    const locationData: LocationData = {
      latitude: result.coordinates.lat,
      longitude: result.coordinates.lng,
      address: result.address
    };

    return validateDeliveryLocation(locationData);
  }

  /**
   * تحميل البحثات الحديثة من localStorage
   */
  private loadRecentSearches(): void {
    try {
      const stored = localStorage.getItem('recentDeliverySearches');
      if (stored) {
        this.recentSearches = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('فشل في تحميل البحثات الحديثة:', error);
      this.recentSearches = [];
    }
  }

  /**
   * حفظ البحثات الحديثة في localStorage
   */
  private saveRecentSearches(): void {
    try {
      localStorage.setItem('recentDeliverySearches', JSON.stringify(this.recentSearches));
    } catch (error) {
      console.warn('فشل في حفظ البحثات الحديثة:', error);
    }
  }

  /**
   * تهيئة الأماكن الشائعة
   */
  private initializePopularSearches(): void {
    this.popularSearches = this.getPopularLocations();
  }
}

// إنشاء instance واحد لاستخدامه في التطبيق
export const locationSearchService = new LocationSearchService();

export default locationSearchService;