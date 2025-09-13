/**
 * شاشة لوحة التحكم الرئيسية للكابتن - محسنة ومتقدمة
 */

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  Animated,
  StatusBar,
  Platform
} from 'react-native';

import captainService from '../services/captainService.js';
import apiService from '../services/apiService.js';
import webSocketService from '../services/webSocketService.js';
import locationService from '../services/locationService.js';

const { width, height } = Dimensions.get('window');

interface DashboardScreenProps {
  captain: any;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  onLogout: () => void;
  onToggleAvailability?: (isAvailable: boolean) => void;
  onAcceptOrder?: (orderId: string) => void;
  onNavigateToTracking?: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ 
  captain, 
  connectionStatus, 
  onLogout,
  onToggleAvailability,
  onAcceptOrder,
  onNavigateToTracking
}) => {
  // حالة الكابتن والبيانات الأساسية
  const [isOnline, setIsOnline] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // إحصائيات متقدمة
  const [dailyStats, setDailyStats] = useState({
    orders: 0,
    earnings: 0.00,
    distance: 0.0,
    onlineTime: 0,
    completedOrders: 0,
    rating: 4.8,
    totalDeliveries: 0
  });
  
  // إحصائيات الأداء
  const [performanceStats, setPerformanceStats] = useState({
    weeklyEarnings: 0.00,
    monthlyEarnings: 0.00,
    averageDeliveryTime: 25,
    customerRating: 4.8,
    onTimeDeliveries: 95
  });
  
  // حالة الاتصال والتحديثات
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  
  // Animations
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    initializeDashboard();
    startAnimations();
    
    // تسجيل معالجات الأحداث المحسنة
    captainService.addEventListener('onOrdersUpdate', handleOrdersUpdate);
    captainService.addEventListener('onNewOrder', handleNewOrder);
    captainService.addEventListener('onStatsUpdate', handleStatsUpdate);
    captainService.addEventListener('onConnectionChange', handleConnectionChange);
    
    // تهيئة الخدمات
    initializeServices();
    
    // تحديث دوري للبيانات
    const intervalId = setInterval(() => {
      if (isOnline && wsConnected) {
        refreshStats();
      }
    }, 30000); // كل 30 ثانية

    return () => {
      // تنظيف المعالجات والمؤقتات
      captainService.removeEventListener('onOrdersUpdate', handleOrdersUpdate);
      captainService.removeEventListener('onNewOrder', handleNewOrder);
      captainService.removeEventListener('onStatsUpdate', handleStatsUpdate);
      captainService.removeEventListener('onConnectionChange', handleConnectionChange);
      clearInterval(intervalId);
    };
  }, [isOnline, wsConnected]);
  
  /**
   * تشغيل الحركات المتقدمة
   */
  const startAnimations = () => {
    // تأثير الظهور
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
    
    // تأثير النبض المستمر للحالة النشطة
    const createPulseAnimation = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ]).start(() => {
        if (isOnline) {
          createPulseAnimation();
        }
      });
    };
    
    if (isOnline) {
      createPulseAnimation();
    }
  };
  
  /**
   * تهيئة الخدمات المتقدمة
   */
  const initializeServices = async () => {
    try {
      // تهيئة خدمة الموقع
      await locationService.initialize();
      
      if (isOnline) {
        // بدء تتبع الموقع
        await locationService.startLocationTracking();
        
        // الاستماع لتحديثات الموقع
        locationService.addLocationUpdateListener(handleLocationUpdate);
      }
      
      // التحقق من حالة WebSocket
      checkWebSocketConnection();
      
    } catch (error) {
      console.error('❌ خطأ في تهيئة الخدمات:', error);
    }
  };

  /**
   * تهيئة لوحة التحكم المحسنة
   */
  const initializeDashboard = async () => {
    try {
      console.log('🚀 Initializing advanced dashboard...');
      
      const state = captainService.getState();
      setIsOnline(state.isOnline);
      setIsAvailable(state.isAvailable);
      setOrders(state.orders);
      setActiveOrder(state.activeOrder);
      setDailyStats({
        ...state.dailyStats,
        rating: state.captain?.rating || 4.8,
        totalDeliveries: state.captain?.totalDeliveries || 0
      });

      // جلب البيانات المحسنة
      await Promise.all([
        refreshOrders(),
        refreshStats(),
        refreshPerformanceStats()
      ]);
      
      console.log('✅ Advanced dashboard initialized successfully');
    } catch (error) {
      console.error('❌ خطأ في تهيئة لوحة التحكم المتقدمة:', error);
    }
  };
  
  /**
   * تحديث الطلبات المتاحة
   */
  const refreshOrders = async () => {
    try {
      await captainService.refreshOrders();
      const state = captainService.getState();
      setOrders(state.orders);
      setActiveOrder(state.activeOrder);
    } catch (error) {
      console.error('❌ خطأ في تحديث الطلبات:', error);
    }
  };
  
  /**
   * تحديث الإحصائيات اليومية
   */
  const refreshStats = async () => {
    try {
      if (captain?.id) {
        const statsResponse = await apiService.getCaptainStats(captain.id);
        
        if (statsResponse.success && statsResponse.stats) {
          setDailyStats(prev => ({
            ...prev,
            ...statsResponse.stats,
            rating: statsResponse.stats.rating || prev.rating,
            totalDeliveries: statsResponse.stats.totalDeliveries || prev.totalDeliveries
          }));
        }
      }
      
      // تحديث الوقت
      setLastUpdateTime(new Date());
      
    } catch (error) {
      console.warn('⚠️ لا يمكن جلب الإحصائيات من الخادم:', error.message);
      // استخدام البيانات المحلية
    }
  };
  
  /**
   * تحديث إحصائيات الأداء
   */
  const refreshPerformanceStats = async () => {
    try {
      if (captain?.id) {
        // محاولة جلب إحصائيات الأداء من API
        const response = await apiService.makeRequest('GET', `/api/captain/${captain.id}/performance`);
        
        if (response.success && response.data) {
          setPerformanceStats(prev => ({
            ...prev,
            ...response.data
          }));
        }
      }
    } catch (error) {
      console.warn('⚠️ لا يمكن جلب إحصائيات الأداء:', error.message);
      // الاحتفاظ بالقيم الافتراضية
    }
  };
  
  /**
   * فحص اتصال WebSocket
   */
  const checkWebSocketConnection = () => {
    const connected = webSocketService.isHealthy();
    setWsConnected(connected);
    
    if (!connected && isOnline) {
      console.log('🔄 محاولة إعادة الاتصال بـ WebSocket...');
      webSocketService.reconnect();
    }
  };

  /**
   * معالج تحديث الطلبات المحسن
   */
  const handleOrdersUpdate = (updatedOrders) => {
    setOrders(updatedOrders);
    console.log('📋 تحديث الطلبات:', updatedOrders?.length || 0);
  };

  /**
   * معالج الطلب الجديد المحسن
   */
  const handleNewOrder = (newOrder) => {
    console.log('🚚 طلب جديد وصل:', newOrder);
    
    // إشعار بالطلب الجديد
    Alert.alert(
      '🚚 طلب جديد!',
      `طلب رقم ${newOrder.orderNumber || newOrder.id}\n` +
      `العميل: ${newOrder.customerName || 'غير محدد'}\n` +
      `القيمة: ${newOrder.totalAmount || 0} جنيه`,
      [
        { text: 'إغلاق', style: 'cancel' },
        { 
          text: 'عرض التفاصيل', 
          onPress: () => showOrderDetails(newOrder) 
        }
      ]
    );
    
    // تحديث الطلبات تلقائياً
    refreshOrders();
  };
  
  /**
   * معالج تحديث الإحصائيات
   */
  const handleStatsUpdate = (newStats) => {
    console.log('📊 تحديث الإحصائيات:', newStats);
    setDailyStats(prev => ({
      ...prev,
      ...newStats
    }));
  };
  
  /**
   * معالج تغيير حالة الاتصال
   */
  const handleConnectionChange = (connectionData) => {
    console.log('🔗 تغيير حالة الاتصال:', connectionData);
    setWsConnected(connectionData.isConnected || false);
  };
  
  /**
   * معالج تحديث الموقع
   */
  const handleLocationUpdate = (location) => {
    console.log('📍 تحديث الموقع:', location);
    setCurrentLocation(location);
    
    // إرسال الموقع للخادم إذا كان متصل
    if (isOnline && wsConnected && captain?.id) {
      webSocketService.sendLocationUpdate(captain.id, location);
    }
  };

  /**
   * تبديل حالة الكابتن المحسن (متاح/غير متاح)
   */
  const toggleAvailability = async () => {
    try {
      const newAvailability = !isAvailable;
      
      // تأكيد التبديل
      Alert.alert(
        newAvailability ? '🟢 تفعيل الحالة النشطة' : '🔴 تعطيل الحالة النشطة',
        newAvailability 
          ? 'ستصبح متاحاً لاستقبال الطلبات الجديدة وسيتم تتبع موقعك'
          : 'ستتوقف عن استقبال طلبات جديدة وسيتم إيقاف تتبع الموقع',
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: newAvailability ? 'تفعيل' : 'تعطيل',
            onPress: async () => {
              await captainService.setAvailability(newAvailability);
              setIsAvailable(newAvailability);
              setIsOnline(newAvailability);
              
              // إدارة تتبع الموقع
              if (newAvailability) {
                await locationService.startLocationTracking();
                startAnimations(); // إعادة تشغيل الحركات
              } else {
                await locationService.stopLocationTracking();
              }

              Alert.alert(
                '✅ تم التحديث',
                `أنت الآن ${newAvailability ? 'متاح ونشط' : 'غير متاح'} لاستقبال الطلبات`
              );
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ خطأ في تحديث الحالة:', error);
      Alert.alert('❌ خطأ', 'فشل في تحديث الحالة. حاول مرة أخرى.');
    }
  };

  /**
   * تحديث البيانات المحسن
   */
  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 تحديث شامل للبيانات...');
      
      await Promise.all([
        refreshOrders(),
        refreshStats(),
        refreshPerformanceStats(),
        checkWebSocketConnection()
      ]);
      
      // إعادة تهيئة الخدمات إذا لزم الأمر
      if (!wsConnected && isOnline) {
        await initializeServices();
      }
      
      console.log('✅ تم تحديث جميع البيانات بنجاح');
      
    } catch (error) {
      console.error('❌ خطأ في تحديث البيانات:', error);
      Alert.alert(
        '⚠️ خطأ في التحديث',
        'حدث خطأ أثناء تحديث البيانات. تحقق من الاتصال.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * قبول طلب محسن
   */
  const acceptOrder = async (orderId) => {
    try {
      const order = orders.find(o => o.id === orderId);
      
      Alert.alert(
        '🚚 تأكيد قبول الطلب',
        `هل تريد قبول هذا الطلب؟\n\n` +
        `📋 رقم الطلب: ${order?.orderNumber || orderId}\n` +
        `💰 القيمة: ${order?.totalAmount || 0} جنيه\n` +
        `📍 العنوان: ${order?.deliveryAddress || 'غير محدد'}`,
        [
          { text: '❌ إلغاء', style: 'cancel' },
          {
            text: '✅ قبول',
            style: 'default',
            onPress: async () => {
              try {
                const result = await captainService.acceptOrder(orderId);
                if (result.success) {
                  setActiveOrder(order);
                  Alert.alert(
                    '🎉 تم قبول الطلب!', 
                    'تم قبول الطلب بنجاح. ابدأ رحلة التوصيل الآن.',
                    [{ text: 'حسناً', onPress: () => refreshOrders() }]
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
   * عرض تفاصيل الطلب المحسن
   */
  const showOrderDetails = (order) => {
    const details = 
      `📋 رقم الطلب: ${order.orderNumber || order.id}\n\n` +
      `👤 العميل: ${order.customerName || 'غير محدد'}\n` +
      `📞 الهاتف: ${order.customerPhone || 'غير محدد'}\n\n` +
      `📍 عنوان التسليم:\n${order.deliveryAddress || 'غير محدد'}\n\n` +
      `💰 إجمالي القيمة: ${order.totalAmount || 0} جنيه\n` +
      `💳 طريقة الدفع: ${order.paymentMethod || 'نقدي'}\n\n` +
      `⏰ الأولوية: ${
        order.priority === 'urgent' ? '🔴 عاجل' :
        order.priority === 'express' ? '🟠 سريع' : '🟢 عادي'
      }\n\n` +
      `${order.specialInstructions ? `📝 ملاحظات:\n${order.specialInstructions}` : ''}`;

    Alert.alert(
      '📄 تفاصيل الطلب', 
      details.trim(), 
      [
        { text: '❌ إغلاق', style: 'cancel' },
        { 
          text: '✅ قبول الطلب', 
          style: 'default',
          onPress: () => acceptOrder(order.id)
        }
      ],
      { cancelable: true }
    );
  };
  
  /**
   * تنسيق الوقت المنقضي
   */
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    return `منذ ${Math.floor(diffInMinutes / 1440)} يوم`;
  };
  
  /**
   * تنسيق الوقت
   */
  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}س ${mins}د` : `${mins} دقيقة`;
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={['#4F46E5']}
        />
      }
    >
      {/* رأس الصفحة */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>مرحباً {captain?.name || 'كابتن'}</Text>
            <Text style={styles.userDetails}>
              {captain?.vehicleType === 'motorcycle' ? '🏍️' : '🚗'} {captain?.vehicleNumber || ''}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={onLogout}
          >
            <Text style={styles.logoutButtonText}>تسجيل خروج</Text>
          </TouchableOpacity>
        </View>

        {/* حالة الاتصال */}
        <View style={styles.statusContainer}>
          <View style={[
            styles.connectionStatus,
            { backgroundColor: connectionStatus === 'connected' ? '#10B981' : '#EF4444' }
          ]}>
            <Text style={styles.connectionStatusText}>
              {connectionStatus === 'connected' ? '🟢 متصل' : '🔴 غير متصل'}
            </Text>
          </View>
        </View>
      </View>

      {/* تبديل حالة الكابتن */}
      <View style={styles.availabilitySection}>
        <TouchableOpacity 
          style={[
            styles.availabilityButton,
            { backgroundColor: isAvailable ? '#10B981' : '#6B7280' }
          ]}
          onPress={toggleAvailability}
        >
          <Text style={styles.availabilityButtonText}>
            {isAvailable ? '🟢 متاح للعمل' : '🔴 غير متاح'}
          </Text>
          <Text style={styles.availabilitySubtext}>
            اضغط لتغيير الحالة
          </Text>
        </TouchableOpacity>
      </View>

      {/* الإحصائيات اليومية */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>إحصائيات اليوم</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dailyStats.orders}</Text>
            <Text style={styles.statLabel}>طلبات</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dailyStats.earnings} جنيه</Text>
            <Text style={styles.statLabel}>أرباح</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(dailyStats.distance / 1000)} كم</Text>
            <Text style={styles.statLabel}>مسافة</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{Math.round(dailyStats.onlineTime / 60)} س</Text>
            <Text style={styles.statLabel}>وقت العمل</Text>
          </View>
        </View>
      </View>

      {/* الطلبات المتاحة */}
      <View style={styles.ordersSection}>
        <Text style={styles.sectionTitle}>الطلبات المتاحة ({orders.length})</Text>
        
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>📭</Text>
            <Text style={styles.emptyStateText}>لا توجد طلبات متاحة حالياً</Text>
            <Text style={styles.emptyStateSubtext}>
              {isAvailable ? 'انتظر الطلبات الجديدة' : 'اجعل نفسك متاحاً لاستقبال الطلبات'}
            </Text>
          </View>
        ) : (
          orders.map((order, index) => (
            <TouchableOpacity
              key={order.id || index}
              style={styles.orderCard}
              onPress={() => showOrderDetails(order)}
            >
              <View style={styles.orderHeader}>
                <Text style={styles.orderNumber}>
                  طلب #{order.orderNumber || order.id}
                </Text>
                <View style={[
                  styles.priorityBadge,
                  { 
                    backgroundColor: 
                      order.priority === 'urgent' ? '#EF4444' :
                      order.priority === 'express' ? '#F59E0B' : '#10B981'
                  }
                ]}>
                  <Text style={styles.priorityText}>
                    {order.priority === 'urgent' ? 'عاجل' :
                     order.priority === 'express' ? 'سريع' : 'عادي'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.orderDetails}>
                <Text style={styles.customerName}>
                  👤 {order.customerName || 'عميل'}
                </Text>
                <Text style={styles.deliveryAddress} numberOfLines={2}>
                  📍 {order.deliveryAddress || 'عنوان غير محدد'}
                </Text>
                <Text style={styles.orderAmount}>
                  💰 {order.totalAmount || 0} جنيه
                </Text>
              </View>

              <View style={styles.orderButtonsContainer}>
                <TouchableOpacity 
                  style={styles.acceptButton}
                  onPress={() => acceptOrder(order.id)}
                >
                  <Text style={styles.acceptButtonText}>قبول الطلب</Text>
                </TouchableOpacity>
                
                {/* زر تتبع التوصيل - يظهر فقط للطلب النشط */}
                {activeOrder && activeOrder.id === order.id && (
                  <TouchableOpacity 
                    style={styles.trackingButton}
                    onPress={() => onNavigateToTracking && onNavigateToTracking()}
                  >
                    <Text style={styles.trackingButtonText}>🗺️ تتبع التوصيل</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
  },
  userDetails: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statusContainer: {
    alignItems: 'center',
  },
  connectionStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  connectionStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  availabilitySection: {
    padding: 20,
  },
  availabilityButton: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  availabilityButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  availabilitySubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    width: (width - 60) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  ordersSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    marginBottom: 16,
  },
  customerName: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    textAlign: 'right',
  },
  deliveryAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'right',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
    textAlign: 'right',
  },
  acceptButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  orderButtonsContainer: {
    gap: 8,
  },
  trackingButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  trackingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DashboardScreen;