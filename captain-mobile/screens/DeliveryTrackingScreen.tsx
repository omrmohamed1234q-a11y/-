import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  SafeAreaView,
  RefreshControl,
  Linking
} from 'react-native';

// Types
import type { 
  OrderType, 
  CaptainType, 
  LocationType,
  DeliveryRoute,
  NavigationStep,
  RouteStatus,
  OrderStatus
} from '../types/index';

// Services
import captainService from '../services/captainService.js';
import locationService from '../services/locationService.js';
import webSocketService from '../services/webSocketService.js';

const { width, height } = Dimensions.get('window');

// Route status configuration
const ROUTE_STATUS = {
  TO_PICKUP: {
    key: 'to_pickup',
    label: 'متجه للاستلام',
    color: '#3B82F6',
    icon: '📍'
  },
  AT_PICKUP: {
    key: 'at_pickup', 
    label: 'وصل للاستلام',
    color: '#F59E0B',
    icon: '🏢'
  },
  TO_DELIVERY: {
    key: 'to_delivery',
    label: 'متجه للتوصيل', 
    color: '#10B981',
    icon: '🚚'
  },
  AT_DELIVERY: {
    key: 'at_delivery',
    label: 'وصل للتوصيل',
    color: '#EF4444', 
    icon: '🏠'
  },
  COMPLETED: {
    key: 'completed',
    label: 'تم التوصيل',
    color: '#22C55E',
    icon: '✅'
  }
};

// Navigation instructions for different route segments
const NAVIGATION_INSTRUCTIONS = {
  TO_PICKUP: [
    'توجه شمالاً على الطريق الرئيسي',
    'انعطف يميناً عند الإشارة الثانية',
    'استمر مباشرة لمسافة 500 متر',
    'وجهتك على اليسار'
  ],
  TO_DELIVERY: [
    'اتجه جنوباً من نقطة الاستلام',
    'انعطف يساراً في الشارع الثاني',
    'استمر مباشرة حتى النهاية',
    'وجهتك على اليمين'
  ]
};

export default function DeliveryTrackingScreen({ route, navigation }: any) {
  // State management
  const [activeOrder, setActiveOrder] = useState<OrderType | null>(null);
  const [captain, setCaptain] = useState<CaptainType | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationType | null>(null);
  const [routeStatus, setRouteStatus] = useState<RouteStatus>('to_pickup');
  const [distanceToPickup, setDistanceToPickup] = useState<number>(0);
  const [distanceToDelivery, setDistanceToDelivery] = useState<number>(0);
  const [estimatedArrival, setEstimatedArrival] = useState<string>('');
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [routeInstructions, setRouteInstructions] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Refs for location tracking
  const locationListenerRef = useRef<(() => void) | null>(null);

  /**
   * تهيئة الشاشة والبيانات
   */
  useEffect(() => {
    initializeDeliveryTracking();

    return () => {
      // تنظيف الموارد عند إغلاق الشاشة
      cleanup();
    };
  }, []);

  /**
   * معالج تحديثات الموقع
   */
  const handleLocationUpdate = (location: LocationType) => {
    console.log('📍 Location update in delivery tracking:', location);
    setCurrentLocation(location);
    
    if (activeOrder) {
      updateDistancesAndETA(location);
      sendLocationToServer(location);
    }
  };

  /**
   * تهيئة تتبع التوصيل
   */
  const initializeDeliveryTracking = async () => {
    try {
      console.log('🚀 Initializing delivery tracking...');

      // جلب حالة الكابتن والطلب النشط
      const captainState = captainService.getState();
      setCaptain(captainState.captain);
      setActiveOrder(captainState.activeOrder);

      if (!captainState.activeOrder) {
        Alert.alert(
          'لا يوجد طلب نشط',
          'لا يوجد طلب قيد التوصيل حالياً',
          [{ text: 'حسناً', onPress: () => navigation.goBack() }]
        );
        return;
      }

      // تحديد حالة المسار الحالية
      determineRouteStatus(captainState.activeOrder);

      // بدء تتبع الموقع
      await startLocationTracking();

      // تسجيل معالجات الأحداث
      captainService.addEventListener('onOrdersUpdate', handleOrdersUpdate);
      captainService.addEventListener('onLocationUpdate', handleLocationUpdate);

      console.log('✅ Delivery tracking initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize delivery tracking:', error);
      Alert.alert('خطأ', 'فشل في تهيئة تتبع التوصيل');
    }
  };

  /**
   * بدء تتبع الموقع - متسق مع باقي التطبيق
   */
  const startLocationTracking = async () => {
    try {
      await locationService.initialize();
      
      const cleanup = await locationService.addLocationUpdateListener(handleLocationUpdate);
      locationListenerRef.current = cleanup;
      
      await locationService.startLocationTracking({
        accuracy: 'high',
        timeInterval: 5000, // تحديث كل 5 ثواني للتوصيل
        distanceInterval: 5 // تحديث عند تغيير 5 أمتار
      });
      
      setIsTracking(true);
      console.log('📍 Location tracking started for delivery');
    } catch (error) {
      console.error('❌ Failed to start location tracking:', error);
    }
  };

  /**
   * تحديد حالة المسار بناءً على الطلب - منطق محصح
   */
  const determineRouteStatus = (order: OrderType) => {
    switch (order.status) {
      case 'accepted':
        setRouteStatus('to_pickup');
        setRouteInstructions(NAVIGATION_INSTRUCTIONS.TO_PICKUP);
        break;
      case 'at_pickup':
        setRouteStatus('at_pickup');
        setRouteInstructions(NAVIGATION_INSTRUCTIONS.TO_PICKUP);
        break;
      case 'picked_up':
      case 'in_delivery':
        setRouteStatus('to_delivery');
        setRouteInstructions(NAVIGATION_INSTRUCTIONS.TO_DELIVERY);
        break;
      case 'delivered':
        setRouteStatus('completed');
        setRouteInstructions([]);
        break;
      default:
        setRouteStatus('to_pickup');
        setRouteInstructions(NAVIGATION_INSTRUCTIONS.TO_PICKUP);
    }
  };

  /**
   * تحديث المسافات ووقت الوصول المتوقع
   */
  const updateDistancesAndETA = (location: LocationType) => {
    if (!activeOrder) return;

    // استخدام إحداثيات الطلب الفعلية بدلاً من إحداثيات ثابتة
    let pickupDistance = 0;
    if (activeOrder.pickupCoordinates) {
      pickupDistance = calculateDistance(
        location.latitude,
        location.longitude,
        activeOrder.pickupCoordinates.lat,
        activeOrder.pickupCoordinates.lng
      );
    } else {
      console.warn('⚠️ No pickup coordinates available for active order');
    }
    setDistanceToPickup(pickupDistance);

    // حساب المسافة إلى نقطة التوصيل
    let deliveryDistance = 0;
    if (activeOrder.deliveryCoordinates) {
      deliveryDistance = calculateDistance(
        location.latitude,
        location.longitude,
        activeOrder.deliveryCoordinates.lat,
        activeOrder.deliveryCoordinates.lng
      );
    } else {
      console.warn('⚠️ No delivery coordinates available for active order');
    }
    setDistanceToDelivery(deliveryDistance);

    // حساب وقت الوصول المتوقع (افتراض سرعة 30 كم/ساعة)
    const currentDistance = routeStatus === 'to_pickup' ? pickupDistance : deliveryDistance;
    const eta = calculateETA(currentDistance, 30); // 30 كم/ساعة
    setEstimatedArrival(eta);
  };

  /**
   * حساب المسافة بين نقطتين
   */
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // نصف قطر الأرض بالكيلومتر
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  /**
   * حساب وقت الوصول المتوقع
   */
  const calculateETA = (distance: number, speed: number): string => {
    const timeHours = distance / speed;
    const timeMinutes = Math.round(timeHours * 60);
    
    if (timeMinutes < 60) {
      return `${timeMinutes} دقيقة`;
    } else {
      const hours = Math.floor(timeMinutes / 60);
      const minutes = timeMinutes % 60;
      return `${hours} ساعة و ${minutes} دقيقة`;
    }
  };

  /**
   * إرسال الموقع للسيرفر - متسق مع Dashboard
   */
  const sendLocationToServer = async (location: LocationType) => {
    try {
      if (webSocketService.isHealthy() && captain && activeOrder) {
        await webSocketService.sendLocationUpdate(
          captain.id,
          {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: Date.now(),
            orderId: activeOrder.id
          }
        );
      }
    } catch (error) {
      console.error('❌ Failed to send location update:', error);
    }
  };

  /**
   * معالج تحديثات الطلبات
   */
  const handleOrdersUpdate = (orders: OrderType[]) => {
    const currentOrder = orders.find(order => order.id === activeOrder?.id);
    if (currentOrder) {
      setActiveOrder(currentOrder);
      determineRouteStatus(currentOrder);
    }
  };

  /**
   * فتح الخرائط للملاحة
   */
  const openGoogleMaps = () => {
    if (!activeOrder || !currentLocation) {
      Alert.alert('خطأ', 'لا يوجد موقع حالي أو طلب نشط');
      return;
    }

    let destinationLat, destinationLng;
    
    if (routeStatus === 'to_pickup') {
      // الذهاب لنقطة الاستلام - استخدام الإحداثيات الفعلية
      if (activeOrder.pickupCoordinates) {
        destinationLat = activeOrder.pickupCoordinates.lat;
        destinationLng = activeOrder.pickupCoordinates.lng;
      } else {
        Alert.alert('خطأ', 'لا توجد إحداثيات نقطة الاستلام');
        return;
      }
    } else if (activeOrder.deliveryCoordinates) {
      // الذهاب لنقطة التوصيل
      destinationLat = activeOrder.deliveryCoordinates.lat;
      destinationLng = activeOrder.deliveryCoordinates.lng;
    } else {
      Alert.alert('خطأ', 'لا توجد إحداثيات للوجهة');
      return;
    }

    console.log('🗺️ Opening Google Maps for navigation:', { destinationLat, destinationLng });
    locationService.openGoogleMaps(destinationLat, destinationLng);
  };

  /**
   * تحديث حالة الطلب - مع استخدام الأنواع الصحيحة
   */
  const updateOrderStatus = async (newStatus: OrderStatus) => {
    if (!activeOrder || !captain) return;

    try {
      const result = await captainService.updateOrderStatus(
        activeOrder.id,
        newStatus,
        `تحديث من شاشة التتبع: ${ROUTE_STATUS[newStatus as keyof typeof ROUTE_STATUS]?.label || newStatus}`,
        currentLocation
      );

      if (result.success) {
        Alert.alert('تم بنجاح', 'تم تحديث حالة الطلب');
        determineRouteStatus({ ...activeOrder, status: newStatus });
      } else {
        Alert.alert('خطأ', result.error || 'فشل في تحديث الحالة');
      }
    } catch (error) {
      console.error('❌ Failed to update order status:', error);
      Alert.alert('خطأ', 'حدث خطأ في تحديث الحالة');
    }
  };

  /**
   * تحديث البيانات
   */
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await captainService.refreshOrders();
      if (currentLocation) {
        updateDistancesAndETA(currentLocation);
      }
    } catch (error) {
      console.error('❌ Failed to refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * تنظيف الموارد - تحسين شامل لمنع تسريب الذاكرة
   */
  const cleanup = () => {
    console.log('🧹 Cleaning up delivery tracking resources...');
    
    // تنظيف مستمع الموقع
    if (locationListenerRef.current) {
      locationListenerRef.current();
      locationListenerRef.current = null;
    }
    
    // إيقاف تتبع الموقع
    locationService.stopLocationTracking();
    
    // إزالة جميع مستمعي الأحداث للحماية من تسريب الذاكرة
    captainService.removeEventListener('onOrdersUpdate', handleOrdersUpdate);
    captainService.removeEventListener('onLocationUpdate', handleLocationUpdate);
    
    // تحديث الحالة
    setIsTracking(false);
    
    console.log('✅ Delivery tracking resources cleaned up successfully');
  };

  /**
   * الحصول على لون الحالة
   */
  const getStatusColor = () => {
    return ROUTE_STATUS[routeStatus as keyof typeof ROUTE_STATUS]?.color || '#6B7280';
  };

  if (!activeOrder) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>لا يوجد طلب نشط للتتبع</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>العودة</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* عنوان الشاشة */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← العودة</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>تتبع التوصيل</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* معلومات الطلب */}
        <View style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderNumber}>طلب رقم {activeOrder.orderNumber}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
              <Text style={styles.statusText}>
                {ROUTE_STATUS[routeStatus as keyof typeof ROUTE_STATUS]?.icon}{' '}
                {ROUTE_STATUS[routeStatus as keyof typeof ROUTE_STATUS]?.label}
              </Text>
            </View>
          </View>
          
          <Text style={styles.customerName}>العميل: {activeOrder.customerName}</Text>
          <Text style={styles.customerPhone}>📞 {activeOrder.customerPhone}</Text>
          <Text style={styles.deliveryAddress}>📍 {activeOrder.deliveryAddress}</Text>
          <Text style={styles.totalAmount}>💰 {activeOrder.totalAmount} جنيه</Text>
        </View>

        {/* خريطة التتبع - محسنة للإنتاج */}
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapText}>🗺️ خريطة التتبع التفاعلية</Text>
            <Text style={styles.mapSubtext}>
              {currentLocation 
                ? `📍 الموقع الحالي: ${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`
                : '🔍 جاري تحديد الموقع...'
              }
            </Text>
            {activeOrder?.pickupCoordinates && (
              <Text style={styles.coordinatesText}>
                🏢 نقطة الاستلام: {activeOrder.pickupCoordinates.lat.toFixed(4)}, {activeOrder.pickupCoordinates.lng.toFixed(4)}
              </Text>
            )}
            {activeOrder?.deliveryCoordinates && (
              <Text style={styles.coordinatesText}>
                🏠 نقطة التوصيل: {activeOrder.deliveryCoordinates.lat.toFixed(4)}, {activeOrder.deliveryCoordinates.lng.toFixed(4)}
              </Text>
            )}
            <Text style={styles.trackingStatus}>
              {isTracking ? '🟢 تتبع GPS نشط' : '🔴 تتبع GPS متوقف'}
            </Text>
            <Text style={styles.mapNote}>
              ملاحظة: في الإصدار النهائي سيتم استخدام خرائط Google التفاعلية
            </Text>
          </View>
        </View>

        {/* معلومات المسار */}
        <View style={styles.routeInfo}>
          <View style={styles.distanceCard}>
            <Text style={styles.distanceLabel}>المسافة المتبقية</Text>
            <Text style={styles.distanceValue}>
              {routeStatus === 'to_pickup' 
                ? `${distanceToPickup.toFixed(1)} كم للاستلام`
                : `${distanceToDelivery.toFixed(1)} كم للتوصيل`
              }
            </Text>
          </View>
          
          <View style={styles.etaCard}>
            <Text style={styles.etaLabel}>وقت الوصول المتوقع</Text>
            <Text style={styles.etaValue}>{estimatedArrival || 'جاري الحساب...'}</Text>
          </View>
        </View>

        {/* تعليمات الملاحة */}
        {routeInstructions.length > 0 && (
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>🧭 تعليمات الملاحة</Text>
            {routeInstructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <Text style={styles.instructionNumber}>{index + 1}</Text>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>
        )}

        {/* أزرار التحكم */}
        <View style={styles.controlButtons}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={openGoogleMaps}
          >
            <Text style={styles.buttonText}>🗺️ فتح خرائط Google</Text>
          </TouchableOpacity>

          {routeStatus === 'to_pickup' && (
            <TouchableOpacity
              style={[styles.button, styles.successButton]}
              onPress={() => updateOrderStatus('picked_up')}
            >
              <Text style={styles.buttonText}>✅ تم الاستلام</Text>
            </TouchableOpacity>
          )}

          {routeStatus === 'to_delivery' && (
            <TouchableOpacity
              style={[styles.button, styles.successButton]}
              onPress={() => updateOrderStatus('delivered')}
            >
              <Text style={styles.buttonText}>🏠 تم التوصيل</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => Linking.openURL(`tel:${activeOrder.customerPhone}`)}
          >
            <Text style={styles.secondaryButtonText}>📞 اتصال بالعميل</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  scrollView: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  backButton: {
    padding: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 8
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827'
  },
  headerSpacer: {
    width: 60
  },
  orderCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827'
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  customerName: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4
  },
  customerPhone: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4
  },
  deliveryAddress: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669'
  },
  mapContainer: {
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF'
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  mapText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8
  },
  mapSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8
  },
  trackingStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8
  },
  coordinatesText: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4
  },
  mapNote: {
    fontSize: 9,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic'
  },
  routeInfo: {
    flexDirection: 'row',
    margin: 16,
    marginTop: 0,
    gap: 8
  },
  distanceCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center'
  },
  distanceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4
  },
  distanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827'
  },
  etaCard: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center'
  },
  etaLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4
  },
  etaValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827'
  },
  instructionsCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  instructionNumber: {
    width: 24,
    height: 24,
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 12
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#374151'
  },
  controlButtons: {
    margin: 16,
    marginTop: 0,
    gap: 12
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  primaryButton: {
    backgroundColor: '#3B82F6'
  },
  successButton: {
    backgroundColor: '#10B981'
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB'
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151'
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24
  }
});