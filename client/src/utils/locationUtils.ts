// Location utilities for Suez delivery area validation
// مطبعة الجزيرة - السويس كنقطة مرجعية للتوصيل
const SUEZ_CENTER_COORDINATES = {
  lat: 30.0964396,  // مطبعة الجزيرة - السويس
  lng: 32.4642696
};

// نطاق السويس المسموح للتوصيل
const SUEZ_ALLOWED_AREA = {
  north: 30.0500,   // الحد الشمالي
  south: 29.8500,   // الحد الجنوبي
  east: 32.6500,    // الحد الشرقي
  west: 32.4000     // الحد الغربي
};

// منطقة السخنة المستبعدة (إحداثيات تقريبية)
const AIN_SOKHNA_AREA = {
  lat: 29.5833,
  lng: 32.3167,
  radius: 15 // نصف قطر 15 كيلو متر
};

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

export interface DeliveryValidation {
  isValid: boolean;
  distance: number;
  deliveryFee: number;
  message: string;
  area?: string;
}

/**
 * حساب المسافة بين نقطتين باستخدام صيغة Haversine
 */
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * التحقق من صحة موقع التوصيل في نطاق السويس
 */
export function validateDeliveryLocation(location: LocationData): DeliveryValidation {
  const { latitude, longitude } = location;
  
  // حساب المسافة من مدينة الأربعين
  const distanceFromCenter = calculateDistance(
    latitude, 
    longitude,
    SUEZ_CENTER_COORDINATES.lat,
    SUEZ_CENTER_COORDINATES.lng
  );
  
  // التحقق من أن الموقع ضمن نطاق السويس الجغرافي
  const isInSuezArea = 
    latitude >= SUEZ_ALLOWED_AREA.south &&
    latitude <= SUEZ_ALLOWED_AREA.north &&
    longitude >= SUEZ_ALLOWED_AREA.west &&
    longitude <= SUEZ_ALLOWED_AREA.east;
  
  // التحقق من أن الموقع ليس في منطقة السخنة
  const distanceFromAinSokhna = calculateDistance(
    latitude,
    longitude,
    AIN_SOKHNA_AREA.lat,
    AIN_SOKHNA_AREA.lng
  );
  
  const isInAinSokhna = distanceFromAinSokhna <= AIN_SOKHNA_AREA.radius;
  
  // التحقق من المسافة للوصول للحد الأقصى 35 جنيه: 35 = 5 + (20 × 1.5)
  const maxDeliveryDistance = 20; // كيلو متر للوصول للحد الأقصى 35 جنيه
  const isWithinMaxDistance = distanceFromCenter <= maxDeliveryDistance;
  
  // حساب رسوم التوصيل: 5 جنيه (رسوم ثابتة) + (المسافة × 1.5 جنيه/كيلو) - أقصى حد 35 جنيه
  const baseFare = 5;
  const costPerKm = 1.5;
  const maxDeliveryFee = 35; // الحد الأقصى لرسوم التوصيل
  const calculatedFee = baseFare + (distanceFromCenter * costPerKm);
  const deliveryFee = Math.min(calculatedFee, maxDeliveryFee);
  
  // تحديد صحة الموقع
  let isValid = false;
  let message = "";
  let area = "";
  
  if (!isInSuezArea) {
    message = "عذراً، التوصيل متاح فقط داخل محافظة السويس";
    area = "خارج النطاق";
  } else if (isInAinSokhna) {
    message = "عذراً، التوصيل غير متاح في منطقة السخنة حالياً";
    area = "السخنة";
  } else if (!isWithinMaxDistance) {
    message = `عذراً، التوصيل متاح فقط ضمن ${maxDeliveryDistance} كيلو من مطبعة الجزيرة (الحد الأقصى ${maxDeliveryFee} جنيه)`;
    area = "بعيد جداً";
  } else {
    isValid = true;
    const feeText = deliveryFee === maxDeliveryFee ? `${maxDeliveryFee} جنيه (أقصى حد)` : `${deliveryFee.toFixed(0)} جنيه`;
    message = `التوصيل متاح! المسافة: ${distanceFromCenter.toFixed(1)} كم - رسوم التوصيل: ${feeText}`;
    area = "السويس";
  }
  
  return {
    isValid,
    distance: distanceFromCenter,
    deliveryFee: Math.round(deliveryFee),
    message,
    area
  };
}

/**
 * الحصول على الموقع الحالي للمستخدم
 */
export function getCurrentLocation(): Promise<LocationData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('تحديد الموقع غير مدعوم في هذا المتصفح'));
      return;
    }
    
    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000
    };
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let message = 'فشل في تحديد الموقع';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'تم رفض الإذن لتحديد الموقع';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'الموقع غير متاح';
            break;
          case error.TIMEOUT:
            message = 'انتهت مهلة تحديد الموقع';
            break;
        }
        reject(new Error(message));
      },
      options
    );
  });
}

/**
 * تحويل الإحداثيات إلى عنوان (اختياري)
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    // يمكن استخدام Google Geocoding API أو OpenStreetMap Nominatim
    // هذا مثال بسيط باستخدام OpenStreetMap
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  } catch (error) {
    console.warn('فشل في تحويل الإحداثيات إلى عنوان:', error);
  }
  
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * منطق تحديد منطقة السويس التفصيلية
 */
export function getSuezAreaName(lat: number, lng: number): string {
  // يمكن تحسين هذا باستخدام حدود أكثر دقة للأحياء
  if (lat > 30.0200 && lng > 32.5200) {
    return "شمال السويس";
  } else if (lat < 29.9200 && lng > 32.5200) {
    return "جنوب السويس";
  } else if (lng < 32.5000) {
    return "غرب السويس";
  } else {
    return "مركز السويس";
  }
}