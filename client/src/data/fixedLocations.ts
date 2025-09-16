/**
 * الأماكن الثابتة للتوصيل في السويس
 * Fixed delivery locations in Suez
 */

export interface FixedLocation {
  id: string;
  name: string;
  city: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  deliveryFee: number;
  zone: 'center' | 'residential' | 'industrial';
  isPopular: boolean;
}

export const FIXED_LOCATIONS: FixedLocation[] = [
  {
    id: 'arbaeen',
    name: 'الأربعين',
    city: 'السويس',
    coordinates: {
      lat: 30.0964396,
      lng: 32.4642696
    },
    deliveryFee: 10,
    zone: 'center',
    isPopular: true
  },
  {
    id: 'new-suez',
    name: 'السويس الجديدة',
    city: 'السويس',
    coordinates: {
      lat: 30.1234567,
      lng: 32.5678901
    },
    deliveryFee: 15,
    zone: 'residential',
    isPopular: true
  },
  {
    id: 'agayeben',
    name: 'العجايبين',
    city: 'السويس',
    coordinates: {
      lat: 30.0845123,
      lng: 32.4512345
    },
    deliveryFee: 12,
    zone: 'residential',
    isPopular: true
  },
  {
    id: 'faisal',
    name: 'فيصل',
    city: 'السويس',
    coordinates: {
      lat: 30.0723456,
      lng: 32.4398765
    },
    deliveryFee: 8,
    zone: 'center',
    isPopular: true
  },
  {
    id: 'suez-port',
    name: 'ميناء السويس',
    city: 'السويس',
    coordinates: {
      lat: 30.0156789,
      lng: 32.5234567
    },
    deliveryFee: 18,
    zone: 'industrial',
    isPopular: false
  },
  {
    id: 'attaka',
    name: 'العتاقة',
    city: 'السويس',
    coordinates: {
      lat: 30.0567890,
      lng: 32.4789012
    },
    deliveryFee: 14,
    zone: 'residential',
    isPopular: false
  }
];

export const getLocationById = (id: string): FixedLocation | undefined => {
  return FIXED_LOCATIONS.find(location => location.id === id);
};

export const getPopularLocations = (): FixedLocation[] => {
  return FIXED_LOCATIONS.filter(location => location.isPopular);
};

export const getLocationsByZone = (zone: FixedLocation['zone']): FixedLocation[] => {
  return FIXED_LOCATIONS.filter(location => location.zone === zone);
};