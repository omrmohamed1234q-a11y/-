/**
 * شاشة إدارة الطلبات المتقدمة للكابتن
 * تتضمن: قبول، رفض، تحديث الحالة، تتبع الموقع المباشر
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StyleSheet,
  Dimensions,
  ActivityIndicator
} from 'react-native';

import type {
  OrderType,
  CaptainType,
  LocationType,
  OrderStatus,
  OrderStatusMap,
  LocationUpdateHandler,
  AuthChangeHandler
} from '../types';

// الخدمات المطلوبة
import captainService from '../services/captainService.js';
import locationService from '../services/locationService.js';
import webSocketService from '../services/webSocketService.js';

const { width } = Dimensions.get('window');

// أنواع حالات الطلبات
const ORDER_STATUSES: OrderStatusMap = {
  PENDING: { key: 'pending', label: '⏳ في الانتظار', color: '#FF9500' },
  ACCEPTED: { key: 'accepted', label: '✅ مقبول', color: '#34C759' },
  PICKED_UP: { key: 'picked_up', label: '📦 تم الاستلام', color: '#007AFF' },
  IN_DELIVERY: { key: 'in_delivery', label: '🚚 جاري التوصيل', color: '#5856D6' },
  DELIVERED: { key: 'delivered', label: '🎉 تم التسليم', color: '#30D158' },
  REJECTED: { key: 'rejected', label: '❌ مرفوض', color: '#FF3B30' },
  CANCELLED: { key: 'cancelled', label: '🚫 ملغي', color: '#8E8E93' }
};

export default function OrderManagementScreen() {
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [activeOrder, setActiveOrder] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [captain, setCaptain] = useState<CaptainType | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LocationType | null>(null);
  const [locationListenerRef, setLocationListenerRef] = useState<(() => void) | null>(null);

  useEffect(() => {
    initializeScreen();
    
    // تسجيل مستمعين للأحداث
    captainService.addEventListener('onOrdersUpdate', handleOrdersUpdate);
    captainService.addEventListener('onAuthChange', handleAuthChange);
    captainService.addEventListener('onNewOrder', handleNewOrder);
    
    return () => {
      // تنظيف المستمعين
      captainService.removeEventListener('onOrdersUpdate', handleOrdersUpdate);
      captainService.removeEventListener('onAuthChange', handleAuthChange);
      captainService.removeEventListener('onNewOrder', handleNewOrder);
      
      // تنظيف مستمع الموقع
      if (locationListenerRef) {
        locationService.removeLocationUpdateListener(handleLocationUpdate);
        setLocationListenerRef(null);
      }
      
      // إيقاف تتبع الموقع إذا كان نشطًا
      locationService.stopTracking().catch(error => {
        console.warn('Warning: Failed to stop location tracking on unmount:', error);
      });
    };
  }, [locationListenerRef]);

  /**
   * تهيئة الشاشة
   */
  const initializeScreen = async () => {
    try {
      setLoading(true);
      
      // جلب بيانات الكابتن
      const captainState = captainService.getState();
      setCaptain(captainState.captain);
      
      // جلب الطلبات
      await loadOrders();
      
      // تهيئة تتبع الموقع
      await initializeLocationTracking();
      
    } catch (error) {
      console.error('❌ خطأ في تهيئة شاشة إدارة الطلبات:', error);
      Alert.alert('خطأ', 'فشل في تحميل بيانات الطلبات');
    } finally {
      setLoading(false);
    }
  };

  /**
   * تحميل الطلبات
   */
  const loadOrders = async () => {
    try {
      await captainService.refreshOrders();
      const state = captainService.getState();
      setOrders(state.orders || []);
      setActiveOrder(state.activeOrder);
    } catch (error) {
      console.error('❌ خطأ في تحميل الطلبات:', error);
      Alert.alert('خطأ', 'فشل في تحميل الطلبات');
    }
  };

  /**
   * تهيئة تتبع الموقع
   */
  const initializeLocationTracking = async () => {
    try {
      await locationService.initialize();
      
      // بدء تتبع الموقع إذا كان الكابتن متاح
      if (captain?.isAvailable) {
        await locationService.startTracking();
        
        // إضافة مستمع الموقع مع تتبع للتنظيف لاحقًا
        locationService.addLocationUpdateListener(handleLocationUpdate);
        setLocationListenerRef(() => () => {
          locationService.removeLocationUpdateListener(handleLocationUpdate);
        });
        
        console.log('📍 Location tracking initialized and listener added');
      }
    } catch (error) {
      console.error('❌ خطأ في تهيئة تتبع الموقع:', error);
    }
  };

  /**
   * معالج تحديث الموقع
   */
  const handleLocationUpdate: LocationUpdateHandler = (location) => {
    setCurrentLocation(location);
    
    // إرسال الموقع للخادم إذا كان هناك طلب نشط
    if (activeOrder && webSocketService.isHealthy()) {
      webSocketService.sendLocationUpdate({
        ...location,
        orderId: activeOrder.id,
        captainId: captain?.id
      });
    }
  };

  /**
   * معالج تحديث قائمة الطلبات (يستقبل المصفوفة الكاملة)
   */
  const handleOrdersUpdate = (orders: OrderType[]) => {
    console.log(`📋 Orders updated: ${orders.length} orders received`);
    setOrders(orders);
    
    // تحديث الطلب النشط من حالة الكابتن
    const state = captainService.getState();
    setActiveOrder(state.activeOrder || null);
  };
  
  /**
   * معالج تحديث طلب واحد (للتحديثات المحددة)
   */
  const handleSingleOrderUpdate = (orderData: OrderType) => {
    setOrders(prevOrders => {
      return prevOrders.map(order => 
        order.id === orderData.id ? { ...order, ...orderData } : order
      );
    });
  };

  /**
   * معالج تغيير المصادقة
   */
  const handleAuthChange: AuthChangeHandler = (authData) => {
    setCaptain(authData.captain);
  };

  /**
   * معالج الطلب الجديد
   */
  const handleNewOrder = (orderData: OrderType) => {
    setOrders(prevOrders => [orderData, ...prevOrders]);
    // يمكن إضافة إشعار أو صوت هنا
    console.log('🚚 طلب جديد وصل:', orderData);
  };

  /**
   * تحديث الصفحة
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  /**
   * قبول طلب
   */
  const acceptOrder = async (order: OrderType) => {
    try {
      Alert.alert(
        '🚚 تأكيد قبول الطلب',
        `هل تريد قبول هذا الطلب؟\n\n` +
        `📋 رقم الطلب: ${order.orderNumber || order.id}\n` +
        `💰 القيمة: ${order.totalAmount || 0} جنيه\n` +
        `📍 العنوان: ${order.deliveryAddress || 'غير محدد'}`,
        [
          { text: '❌ إلغاء', style: 'cancel' },
          {
            text: '✅ قبول',
            style: 'default',
            onPress: async () => {
              try {
                const result = await captainService.acceptOrder(order.id);
                if (result.success) {
                  setActiveOrder(order);
                  
                  // تحديث حالة الطلب إلى "مقبول"
                  await updateOrderStatus(order.id, 'accepted');
                  
                  Alert.alert(
                    '🎉 تم قبول الطلب!',
                    'تم قبول الطلب بنجاح. ابدأ رحلة التوصيل الآن.',
                    [{ text: 'حسناً', onPress: () => loadOrders() }]
                  );
                } else {
                  Alert.alert('❌ خطأ', result.error || 'فشل في قبول الطلب');
                }
              } catch (error) {
                console.error('❌ خطأ في قبول الطلب:', error);
                Alert.alert('❌ خطأ', 'حدث خطأ أثناء قبول الطلب');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ خطأ في قبول الطلب:', error);
      Alert.alert('❌ خطأ', 'فشل في قبول الطلب');
    }
  };

  /**
   * رفض طلب
   */
  const rejectOrder = async (order: OrderType) => {
    try {
      Alert.alert(
        '❌ تأكيد رفض الطلب',
        `هل تريد رفض هذا الطلب؟\n\n` +
        `📋 رقم الطلب: ${order.orderNumber || order.id}\n` +
        `💰 القيمة: ${order.totalAmount || 0} جنيه`,
        [
          { text: '🔙 تراجع', style: 'cancel' },
          {
            text: '❌ رفض',
            style: 'destructive',
            onPress: async () => {
              try {
                const result = await captainService.rejectOrder(order.id);
                if (result.success) {
                  
                  // تحديث حالة الطلب إلى "مرفوض"
                  await updateOrderStatus(order.id, 'rejected');
                  
                  Alert.alert(
                    'تم رفض الطلب',
                    'تم رفض الطلب بنجاح. سيتم عرضه على كابتن آخر.',
                    [{ text: 'حسناً', onPress: () => loadOrders() }]
                  );
                } else {
                  Alert.alert('❌ خطأ', result.error || 'فشل في رفض الطلب');
                }
              } catch (error) {
                console.error('❌ خطأ في رفض الطلب:', error);
                Alert.alert('❌ خطأ', 'حدث خطأ أثناء رفض الطلب');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ خطأ في رفض الطلب:', error);
      Alert.alert('❌ خطأ', 'فشل في رفض الطلب');
    }
  };

  /**
   * تحديث حالة الطلب
   */
  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const result = await captainService.updateOrderStatus(orderId, newStatus);
      if (result.success) {
        // إرسال تحديث الحالة عبر WebSocket
        if (webSocketService.isHealthy()) {
          webSocketService.sendMessage({
            type: 'order_status_update',
            data: {
              orderId: orderId,
              status: newStatus,
              statusText: ORDER_STATUSES[newStatus.toUpperCase()]?.label || newStatus,
              captainId: captain?.id,
              timestamp: Date.now(),
              location: currentLocation
            }
          });
        }
        
        await loadOrders();
      } else {
        Alert.alert('خطأ', result.error || 'فشل في تحديث حالة الطلب');
      }
    } catch (error) {
      console.error('❌ خطأ في تحديث حالة الطلب:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث حالة الطلب');
    }
  };

  /**
   * عرض خيارات تحديث الحالة
   */
  const showStatusUpdateOptions = (order: OrderType) => {
    const currentStatus = order.status || 'pending';
    const availableStatuses = getAvailableStatusTransitions(currentStatus);
    
    const options = availableStatuses.map((status: OrderStatus) => ({
      text: ORDER_STATUSES[status.toUpperCase()]?.label || status,
      onPress: () => updateOrderStatus(order.id, status)
    }));
    
    options.push({ text: '❌ إلغاء', onPress: async () => {} });
    
    Alert.alert(
      '📝 تحديث حالة الطلب',
      `الحالة الحالية: ${ORDER_STATUSES[currentStatus.toUpperCase()]?.label || currentStatus}\n\nاختر الحالة الجديدة:`,
      options
    );
  };

  /**
   * الحصول على التحولات المتاحة للحالة
   */
  const getAvailableStatusTransitions = (currentStatus: OrderStatus): OrderStatus[] => {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      'pending': ['accepted'],
      'accepted': ['picked_up', 'cancelled'],
      'picked_up': ['in_delivery', 'cancelled'],
      'in_delivery': ['delivered', 'cancelled'],
      'delivered': [], // لا يمكن تغيير الحالة بعد التسليم
      'rejected': [],
      'cancelled': []
    };
    
    return transitions[currentStatus] || [];
  };

  /**
   * عرض تفاصيل الطلب
   */
  const showOrderDetails = (order: OrderType) => {
    const statusInfo = ORDER_STATUSES[order.status?.toUpperCase() || 'PENDING'] || ORDER_STATUSES.PENDING;
    
    const details = 
      `📋 رقم الطلب: ${order.orderNumber || order.id}\n\n` +
      `👤 العميل: ${order.customerName || 'غير محدد'}\n` +
      `📞 الهاتف: ${order.customerPhone || 'غير محدد'}\n\n` +
      `📍 عنوان التسليم:\n${order.deliveryAddress || 'غير محدد'}\n\n` +
      `💰 إجمالي القيمة: ${order.totalAmount || 0} جنيه\n` +
      `💳 طريقة الدفع: ${order.paymentMethod || 'نقدي'}\n\n` +
      `📊 الحالة: ${statusInfo.label}\n\n` +
      `⏰ الأولوية: ${
        order.priority === 'urgent' ? '🔴 عاجل' :
        order.priority === 'express' ? '🟠 سريع' : '🟢 عادي'
      }\n\n` +
      `${order.specialInstructions ? `📝 ملاحظات:\n${order.specialInstructions}` : ''}`;

    const actions = [];
    
    // إضافة أزرار حسب حالة الطلب
    if (order.status === 'pending') {
      actions.push(
        { text: '✅ قبول', onPress: () => acceptOrder(order) },
        { text: '❌ رفض', style: 'destructive', onPress: () => rejectOrder(order) }
      );
    } else if (order.status === 'accepted' || order.status === 'picked_up' || order.status === 'in_delivery') {
      actions.push(
        { text: '📝 تحديث الحالة', onPress: () => showStatusUpdateOptions(order) }
      );
    }
    
    actions.push({ text: '🔙 إغلاق', style: 'cancel' });

    Alert.alert(
      '📄 تفاصيل الطلب',
      details.trim(),
      actions,
      { cancelable: true }
    );
  };

  /**
   * رسم بطاقة الطلب
   */
  const renderOrderCard = (order: OrderType) => {
    const statusInfo = ORDER_STATUSES[order.status?.toUpperCase() || 'PENDING'] || ORDER_STATUSES.PENDING;
    const isActiveOrder = activeOrder?.id === order.id;
    
    return (
      <View key={order.id} style={[styles.orderCard, isActiveOrder && styles.activeOrderCard]}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>#{order.orderNumber || order.id}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.statusText}>{statusInfo.label}</Text>
          </View>
        </View>
        
        <View style={styles.orderInfo}>
          <Text style={styles.customerName}>👤 {order.customerName || 'عميل غير محدد'}</Text>
          <Text style={styles.orderValue}>💰 {order.totalAmount || 0} جنيه</Text>
          <Text style={styles.deliveryAddress} numberOfLines={2}>
            📍 {order.deliveryAddress || 'عنوان غير محدد'}
          </Text>
        </View>
        
        <View style={styles.orderActions}>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => showOrderDetails(order)}
          >
            <Text style={styles.detailsButtonText}>تفاصيل</Text>
          </TouchableOpacity>
          
          {order.status === 'pending' && (
            <>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => acceptOrder(order)}
              >
                <Text style={styles.acceptButtonText}>قبول</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => rejectOrder(order)}
              >
                <Text style={styles.rejectButtonText}>رفض</Text>
              </TouchableOpacity>
            </>
          )}
          
          {(order.status === 'accepted' || order.status === 'picked_up' || order.status === 'in_delivery') && (
            <TouchableOpacity
              style={styles.updateStatusButton}
              onPress={() => showStatusUpdateOptions(order)}
            >
              <Text style={styles.updateStatusButtonText}>تحديث الحالة</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>جاري تحميل الطلبات...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📋 إدارة الطلبات</Text>
        <Text style={styles.orderCount}>
          {orders.length} طلب متاح
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>📦 لا توجد طلبات متاحة حالياً</Text>
            <Text style={styles.emptySubtext}>اسحب لأسفل للتحديث</Text>
          </View>
        ) : (
          orders.map(order => renderOrderCard(order))
        )}
      </ScrollView>

      {currentLocation && (
        <View style={styles.locationBar}>
          <Text style={styles.locationText}>
            📍 الموقع: {currentLocation.latitude?.toFixed(4)}, {currentLocation.longitude?.toFixed(4)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    fontFamily: 'System'
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'System'
  },
  orderCount: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
    fontFamily: 'System'
  },
  scrollView: {
    flex: 1,
    padding: 15
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  activeOrderCard: {
    borderWidth: 2,
    borderColor: '#34C759'
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'System'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'System'
  },
  orderInfo: {
    marginBottom: 15
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    fontFamily: 'System'
  },
  orderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
    marginBottom: 5,
    fontFamily: 'System'
  },
  deliveryAddress: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontFamily: 'System'
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  detailsButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  detailsButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontFamily: 'System'
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: '600',
    fontFamily: 'System'
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  rejectButtonText: {
    color: 'white',
    fontWeight: '600',
    fontFamily: 'System'
  },
  updateStatusButton: {
    flex: 1,
    backgroundColor: '#FF9500',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  updateStatusButtonText: {
    color: 'white',
    fontWeight: '600',
    fontFamily: 'System'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'System'
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontFamily: 'System'
  },
  locationBar: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 10,
    alignItems: 'center'
  },
  locationText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'System'
  }
});