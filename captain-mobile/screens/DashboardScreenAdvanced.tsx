/**
 * شاشة لوحة التحكم المتقدمة للكابتن - تطابق مستوى النظام الويب
 * مع إحصائيات حقيقية، real-time updates، وتصميم متطور
 */

import React, { useState, useEffect, useRef } from 'react';
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
}

const DashboardScreenAdvanced: React.FC<DashboardScreenProps> = ({ 
  captain, 
  connectionStatus, 
  onLogout 
}) => {
  // حالة الكابتن والبيانات الأساسية - separated availability vs connectivity
  const [isOnline, setIsOnline] = useState(false); // WebSocket/network connectivity
  const [isAvailable, setIsAvailable] = useState(false); // Captain availability for orders
  const [networkConnected, setNetworkConnected] = useState(false); // Pure network status
  const [orders, setOrders] = useState([]);
  const [activeOrder, setActiveOrder] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // إحصائيات متقدمة - initialization with null values for honest UI states
  const [dailyStats, setDailyStats] = useState({
    orders: 0,
    earnings: 0.00,
    distance: 0.0,
    onlineTime: 0,
    completedOrders: 0,
    rating: null, // Will show 'لا توجد بيانات' when null
    totalDeliveries: null // Will show 'غير متوفر' when null
  });
  
  // إحصائيات الأداء - null initialization for honest states
  const [performanceStats, setPerformanceStats] = useState({
    weeklyEarnings: null,
    monthlyEarnings: null,
    averageDeliveryTime: null,
    customerRating: null,
    onTimeDeliveries: null
  });
  
  // Feature flags for API availability
  const [apiFeatures, setApiFeatures] = useState({
    statsAvailable: false,
    performanceAvailable: false,
    captainStatsChecked: false
  });
  
  // حالة الاتصال والتحديثات
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  
  // حالة الأخطاء والتغذية الراجعة
  const [serviceErrors, setServiceErrors] = useState({
    stats: false,
    orders: false,
    location: false,
    websocket: false
  });
  const [dataLoading, setDataLoading] = useState({
    stats: false,
    orders: false,
    performance: false
  });
  
  // Animations
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];
  const [pulseAnimationRef, setPulseAnimationRef] = useState(null);

  // Refs to store interval and avoid recreating
  const statsIntervalRef = useRef(null);
  const isInitializedRef = useRef(false);

  // One-time initialization effect - runs only on component mount
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    console.log('🚀 Running one-time dashboard initialization...');
    
    initializeDashboard();
    startAnimations();
    
    // تسجيل معالجات الأحداث مرة واحدة فقط
    captainService.addEventListener('onOrdersUpdate', handleOrdersUpdate);
    captainService.addEventListener('onNewOrder', handleNewOrder);
    captainService.addEventListener('onStatsUpdate', handleStatsUpdate);
    captainService.addEventListener('onConnectionChange', handleConnectionChange);
    
    // تهيئة الخدمات مرة واحدة
    initializeServices();
    
    isInitializedRef.current = true;
    console.log('✅ One-time dashboard initialization completed');
  }, []); // No dependencies - runs only once on mount
  
  // Stats interval effect - depends on connection status
  useEffect(() => {
    // Clear any existing interval
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }
    
    // Only create interval when both online and websocket connected
    if (isOnline && wsConnected) {
      console.log('⚙️ Starting stats refresh interval (online + connected)');
      statsIntervalRef.current = setInterval(() => {
        refreshStats();
      }, 30000); // كل 30 ثانية
    } else {
      console.log('⏸️ Pausing stats interval (offline or disconnected)');
    }
    
    // Cleanup function for this effect
    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }
    };
  }, [isOnline, wsConnected]); // Only depends on connection status
  
  // Cleanup effect - runs only on component unmount
  useEffect(() => {
    return () => {
      console.log('🧯 Cleaning up dashboard component...');
      
      // تنظيف المعالجات
      captainService.removeEventListener('onOrdersUpdate', handleOrdersUpdate);
      captainService.removeEventListener('onNewOrder', handleNewOrder);
      captainService.removeEventListener('onStatsUpdate', handleStatsUpdate);
      captainService.removeEventListener('onConnectionChange', handleConnectionChange);
      
      // تنظيف المؤقتات
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }
      
      // تنظيف location listener مع proper existence checks
      try {
        if (locationService.removeLocationUpdateListener && typeof locationService.removeLocationUpdateListener === 'function') {
          locationService.removeLocationUpdateListener(handleLocationUpdate);
          console.log('📍 Location listener removed successfully');
        }
        
        // Stop location tracking if it's active
        const isTrackingMethod = locationService.isLocationTracking || locationService.isTracking;
        if (isTrackingMethod && typeof isTrackingMethod === 'function' && isTrackingMethod()) {
          if (locationService.stopTracking && typeof locationService.stopTracking === 'function') {
            locationService.stopTracking();
            console.log('📍 Location tracking stopped successfully');
          }
        }
      } catch (error) {
        console.warn('⚠️ Error cleaning up location service:', error);
      }
      
      // إيقاف pulse animation
      if (pulseAnimationRef) {
        pulseAnimationRef.stop();
      }
      
      console.log('✅ Dashboard cleanup completed');
    };
  }, []); // No dependencies - cleanup only on unmount
  
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
      if (!isOnline) return; // Prevent animation when offline
      
      const animation = Animated.sequence([
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
      ]);
      
      animation.start((finished) => {
        if (finished && isOnline) {
          createPulseAnimation();
        }
      });
      
      setPulseAnimationRef(animation);
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
      // تهيئة خدمة الموقع مع existence checks
      if (locationService.initialize && typeof locationService.initialize === 'function') {
        await locationService.initialize();
      }
      
      if (isOnline) {
        // بدء تتبع الموقع
        if (locationService.startTracking && typeof locationService.startTracking === 'function') {
          await locationService.startTracking();
        }
        
        // الاستماع لتحديثات الموقع مع existence check
        if (locationService.addLocationUpdateListener && typeof locationService.addLocationUpdateListener === 'function') {
          locationService.addLocationUpdateListener(handleLocationUpdate);
          console.log('📍 Location listener attached successfully');
        } else {
          console.warn('⚠️ addLocationUpdateListener method not available');
        }
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
      // Initialize with real data from captain service, no fake fallbacks
      setDailyStats({
        ...state.dailyStats,
        rating: state.captain?.rating || null,
        totalDeliveries: state.captain?.totalDeliveries || null
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
      setServiceErrors(prev => ({ ...prev, orders: true }));
    }
  };
  
  /**
   * تحديث الإحصائيات اليومية
   */
  const refreshStats = async () => {
    setDataLoading(prev => ({ ...prev, stats: true }));
    setServiceErrors(prev => ({ ...prev, stats: false }));
    
    try {
      if (captain?.id) {
        // التحقق من وجود method قبل الاستدعاء
        if (apiService.getCaptainStats && typeof apiService.getCaptainStats === 'function') {
          const statsResponse = await apiService.getCaptainStats(captain.id);
          
          if (statsResponse?.success && statsResponse?.stats) {
            // Update with real API data only, preserve null for missing data
            setDailyStats(prev => ({
              ...prev,
              ...statsResponse.stats,
              rating: statsResponse.stats.rating ?? null,
              totalDeliveries: statsResponse.stats.totalDeliveries ?? null
            }));
            
            setApiFeatures(prev => ({ ...prev, statsAvailable: true, captainStatsChecked: true }));
          } else {
            // API available but returned no data
            setApiFeatures(prev => ({ ...prev, statsAvailable: false, captainStatsChecked: true }));
          }
        } else {
          // API method not available - mark as checked but unavailable
          console.warn('⚠️ getCaptainStats method not available');
          setApiFeatures(prev => ({ ...prev, statsAvailable: false, captainStatsChecked: true }));
        }
      }
      
      // تحديث الوقت
      setLastUpdateTime(new Date());
      
    } catch (error) {
      console.warn('⚠️ لا يمكن جلب الإحصائيات من الخادم:', error.message);
      setServiceErrors(prev => ({ ...prev, stats: true }));
      setApiFeatures(prev => ({ ...prev, statsAvailable: false, captainStatsChecked: true }));
    } finally {
      setDataLoading(prev => ({ ...prev, stats: false }));
    }
  };
  
  /**
   * تحديث إحصائيات الأداء
   */
  const refreshPerformanceStats = async () => {
    setDataLoading(prev => ({ ...prev, performance: true }));
    
    try {
      if (captain?.id) {
        // التحقق من وجود method قبل الاستدعاء
        if (apiService.makeRequest && typeof apiService.makeRequest === 'function') {
          const response = await apiService.makeRequest('GET', `/api/captain/${captain.id}/performance`);
          
          if (response?.success && response?.data) {
            setPerformanceStats(prev => ({
              ...prev,
              ...response.data
            }));
            setApiFeatures(prev => ({ ...prev, performanceAvailable: true }));
          } else {
            // API returned but no data - keep null states and mark unavailable
            setApiFeatures(prev => ({ ...prev, performanceAvailable: false }));
          }
        } else {
          console.warn('⚠️ makeRequest method not available for performance stats');
          setApiFeatures(prev => ({ ...prev, performanceAvailable: false }));
        }
      }
    } catch (error) {
      console.warn('⚠️ لا يمكن جلب إحصائيات الأداء:', error.message);
      // Mark as unavailable on error - no fake fallback data
      setApiFeatures(prev => ({ ...prev, performanceAvailable: false }));
    } finally {
      setDataLoading(prev => ({ ...prev, performance: false }));
    }
  };
  
  /**
   * فحص اتصال WebSocket مع proper existence checks
   */
  const checkWebSocketConnection = () => {
    try {
      // Check if webSocketService methods exist before using them
      if (!webSocketService || typeof webSocketService !== 'object') {
        console.warn('⚠️ WebSocket service not available');
        setWsConnected(false);
        return;
      }
      
      const connected = webSocketService.isHealthy && typeof webSocketService.isHealthy === 'function' 
        ? webSocketService.isHealthy() 
        : false;
      setWsConnected(connected);
      
      // Only attempt reconnection if we have proper auth data and captain is online
      if (!connected && isOnline && captain?.id) {
        // Check if we have authentication data before attempting reconnection
        const hasAuthData = webSocketService.connectionData && 
          webSocketService.connectionData.authToken && 
          webSocketService.connectionData.captainId;
          
        if (hasAuthData) {
          console.log('🔄 محاولة إعادة الاتصال بـ WebSocket مع auth data...');
          
          // Use scheduleReconnect if available
          if (webSocketService.scheduleReconnect && typeof webSocketService.scheduleReconnect === 'function') {
            webSocketService.scheduleReconnect();
          } else if (webSocketService.connect && typeof webSocketService.connect === 'function') {
            const { baseURL, authToken, captainId, captainData } = webSocketService.connectionData;
            if (baseURL && authToken && captainId) {
              webSocketService.connect(baseURL, authToken, captainId, captainData);
            }
          } else {
            console.warn('⚠️ WebSocket connect methods not available');
          }
        } else {
          console.warn('⚠️ No authentication data available for WebSocket connection. Skipping reconnection attempt.');
          setWsConnected(false);
        }
      } else if (!captain?.id) {
        console.warn('⚠️ No captain ID available for WebSocket connection');
        setWsConnected(false);
      }
    } catch (error) {
      console.error('❌ Error checking WebSocket connection:', error);
      setWsConnected(false);
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
    
    // إرسال الموقع للخادم إذا كان متصل مع proper existence checks
    if (isOnline && wsConnected && captain?.id) {
      try {
        if (webSocketService && 
            webSocketService.sendLocationUpdate && 
            typeof webSocketService.sendLocationUpdate === 'function') {
          webSocketService.sendLocationUpdate(location);
          console.log('📍 Location update sent via WebSocket');
        } else {
          console.warn('⚠️ sendLocationUpdate method not available');
        }
      } catch (error) {
        console.warn('⚠️ Failed to send location update via WebSocket:', error);
      }
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
              // Don't conflate availability with online status - they're separate
              // setIsOnline tracks actual connectivity, not availability
              
              // إدارة تتبع الموقع مع proper lifecycle management
              if (newAvailability) {
                // Start location tracking
                if (locationService.startTracking && typeof locationService.startTracking === 'function') {
                  await locationService.startTracking();
                }
                
                // Re-attach location listener for availability ON
                if (locationService.addLocationUpdateListener && typeof locationService.addLocationUpdateListener === 'function') {
                  locationService.addLocationUpdateListener(handleLocationUpdate);
                  console.log('📍 Location listener re-attached for availability ON');
                }
                
                startAnimations(); // إعادة تشغيل الحركات
              } else {
                // Remove location listener for availability OFF
                if (locationService.removeLocationUpdateListener && typeof locationService.removeLocationUpdateListener === 'function') {
                  locationService.removeLocationUpdateListener(handleLocationUpdate);
                  console.log('📍 Location listener removed for availability OFF');
                }
                
                // Stop location tracking
                if (locationService.stopTracking && typeof locationService.stopTracking === 'function') {
                  await locationService.stopTracking();
                }
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
  
  /**
   * عرض قيمة مع حالات loading/null/error صريحة
   */
  const renderStatValue = (value, isLoading = false, hasError = false, placeholder = 'غير متوفر') => {
    if (hasError) return 'خطأ';
    if (isLoading) return 'جاري التحميل...';
    if (value === null || value === undefined) return placeholder;
    return value.toString();
  };
  
  /**
   * عرض إحصائيات الأداء مع feature gating
   */
  const renderPerformanceValue = (value, featureAvailable, suffix = '') => {
    if (!featureAvailable) return 'غير متوفر';
    if (dataLoading.performance) return 'جاري...';
    if (value === null || value === undefined) return 'لا توجد بيانات';
    return `${value}${suffix}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="white" 
        translucent={false} 
      />
      
      <Animated.View 
        style={[
          styles.animatedContainer,
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }] 
          }
        ]}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={onRefresh}
              colors={['#4F46E5']}
              tintColor="#4F46E5"
            />
          }
        >
          {/* الرأس المحسن */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.userInfo}>
                <Text style={styles.welcomeText}>
                  مرحباً {captain?.username || captain?.fullName || 'كابتن'} 👋
                </Text>
                <Text style={styles.userDetails}>
                  📅 {new Date().toLocaleDateString('ar-EG', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
                <Text style={styles.lastUpdateText}>
                  آخر تحديث: {formatTimeAgo(lastUpdateTime)}
                </Text>
              </View>
              
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={onLogout}
              >
                <Text style={styles.logoutButtonText}>🚪 خروج</Text>
              </TouchableOpacity>
            </View>
            
            {/* مؤشرات الحالة المتطورة */}
            <View style={styles.statusRow}>
              {/* حالة الاتصال */}
              <View style={[
                styles.statusBadge,
                { 
                  backgroundColor: 
                    connectionStatus === 'connected' ? '#10B981' :
                    connectionStatus === 'connecting' ? '#F59E0B' : '#EF4444'
                }
              ]}>
                <Text style={styles.statusBadgeText}>
                  {connectionStatus === 'connected' ? '🟢 متصل' :
                   connectionStatus === 'connecting' ? '🟡 جاري الاتصال...' : '🔴 غير متصل'}
                </Text>
              </View>
              
              {/* حالة WebSocket */}
              <View style={[
                styles.statusBadge,
                { backgroundColor: wsConnected ? '#10B981' : '#EF4444' }
              ]}>
                <Text style={styles.statusBadgeText}>
                  {wsConnected ? '⚡ مباشر' : '⏸️ منقطع'}
                </Text>
              </View>
              
              {/* الموقع */}
              {currentLocation && (
                <View style={[styles.statusBadge, { backgroundColor: '#8B5CF6' }]}>
                  <Text style={styles.statusBadgeText}>
                    📍 موقع نشط
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* تبديل حالة الكابتن المحسن */}
          <Animated.View 
            style={[
              styles.availabilitySection,
              isOnline && { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <TouchableOpacity 
              style={[
                styles.availabilityButton,
                { 
                  backgroundColor: isAvailable 
                    ? '#10B981' 
                    : '#6B7280',
                  shadowColor: isAvailable ? '#10B981' : '#6B7280',
                }
              ]}
              onPress={toggleAvailability}
            >
              <View style={styles.availabilityContent}>
                <Text style={styles.availabilityIcon}>
                  {isAvailable ? '🟢' : '🔴'}
                </Text>
                <Text style={styles.availabilityButtonText}>
                  {isAvailable ? 'متاح للعمل' : 'غير متاح'}
                </Text>
                <Text style={styles.availabilitySubtext}>
                  {isAvailable ? 'ستستقبل طلبات جديدة' : 'اضغط للتفعيل'}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* الإحصائيات المتقدمة */}
          <View style={styles.statsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📊 إحصائيات اليوم</Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={refreshStats}
              >
                <Text style={styles.refreshButtonText}>🔄</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.statsGrid}>
              {/* الطلبات - always show real count */}
              <View style={[styles.statCard, { backgroundColor: '#EF4444' }]}>
                <Text style={styles.statIcon}>📦</Text>
                <Text style={styles.statValue}>{dailyStats.orders}</Text>
                <Text style={styles.statLabel}>طلبات اليوم</Text>
              </View>
              
              {/* الأرباح - show honest earning state */}
              <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
                <Text style={styles.statIcon}>💰</Text>
                <Text style={styles.statValue}>
                  {renderStatValue(dailyStats.earnings, dataLoading.stats, serviceErrors.stats, '0.00')}
                </Text>
                <Text style={styles.statLabel}>جنيه</Text>
              </View>
              
              {/* المسافة - show real distance or zero */}
              <View style={[styles.statCard, { backgroundColor: '#8B5CF6' }]}>
                <Text style={styles.statIcon}>🚗</Text>
                <Text style={styles.statValue}>
                  {dailyStats.distance ? Math.round(dailyStats.distance / 1000) : 0}
                </Text>
                <Text style={styles.statLabel}>كيلومتر</Text>
              </View>
              
              {/* الوقت - show formatted time or zero */}
              <View style={[styles.statCard, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.statIcon}>⏰</Text>
                <Text style={styles.statValue}>
                  {dailyStats.onlineTime ? formatTime(dailyStats.onlineTime) : 'لم يبدأ بعد'}
                </Text>
                <Text style={styles.statLabel}>وقت العمل</Text>
              </View>
            </View>
          </View>

          {/* إحصائيات الأداء - with honest states */}
          <View style={styles.performanceSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🏆 الأداء العام</Text>
              {!apiFeatures.captainStatsChecked && (
                <Text style={{ fontSize: 12, color: '#F59E0B' }}>جاري التحقق...</Text>
              )}
              {apiFeatures.captainStatsChecked && !apiFeatures.statsAvailable && (
                <Text style={{ fontSize: 12, color: '#EF4444' }}>غير متوفر</Text>
              )}
            </View>
            
            <View style={styles.performanceGrid}>
              {/* التقييم - honest rating display */}
              <View style={styles.performanceCard}>
                <Text style={styles.performanceIcon}>⭐</Text>
                <Text style={styles.performanceValue}>
                  {renderStatValue(
                    dailyStats.rating, 
                    dataLoading.stats, 
                    serviceErrors.stats,
                    'لم يتم التقييم'
                  )}
                </Text>
                <Text style={styles.performanceLabel}>التقييم</Text>
              </View>
              
              {/* إجمالي التوصيل - honest delivery count */}
              <View style={styles.performanceCard}>
                <Text style={styles.performanceIcon}>🚚</Text>
                <Text style={styles.performanceValue}>
                  {renderStatValue(
                    dailyStats.totalDeliveries, 
                    dataLoading.stats, 
                    serviceErrors.stats,
                    'لا توجد'
                  )}
                </Text>
                <Text style={styles.performanceLabel}>إجمالي التوصيل</Text>
              </View>
              
              {/* في الوقت - feature-gated performance stat */}
              <View style={styles.performanceCard}>
                <Text style={styles.performanceIcon}>📈</Text>
                <Text style={styles.performanceValue}>
                  {renderPerformanceValue(
                    performanceStats.onTimeDeliveries, 
                    apiFeatures.performanceAvailable,
                    '%'
                  )}
                </Text>
                <Text style={styles.performanceLabel}>في الوقت</Text>
              </View>
            </View>
            
            {/* عرض إحصائيات إضافية إذا كانت متوفرة */}
            {apiFeatures.performanceAvailable && (
              <View style={[styles.performanceGrid, { marginTop: 12 }]}>
                <View style={styles.performanceCard}>
                  <Text style={styles.performanceIcon}>💰</Text>
                  <Text style={styles.performanceValue}>
                    {renderPerformanceValue(performanceStats.weeklyEarnings, true, ' ج.م.')}
                  </Text>
                  <Text style={styles.performanceLabel}>أرباح الأسبوع</Text>
                </View>
                
                <View style={styles.performanceCard}>
                  <Text style={styles.performanceIcon}>📅</Text>
                  <Text style={styles.performanceValue}>
                    {renderPerformanceValue(performanceStats.monthlyEarnings, true, ' ج.م.')}
                  </Text>
                  <Text style={styles.performanceLabel}>أرباح الشهر</Text>
                </View>
                
                <View style={styles.performanceCard}>
                  <Text style={styles.performanceIcon}>⏱️</Text>
                  <Text style={styles.performanceValue}>
                    {renderPerformanceValue(performanceStats.averageDeliveryTime, true, ' دق.')}
                  </Text>
                  <Text style={styles.performanceLabel}>متوسط الوقت</Text>
                </View>
              </View>
            )}
            
            {/* رسالة إعلامية عند عدم توفر الإحصائيات */}
            {!apiFeatures.performanceAvailable && apiFeatures.captainStatsChecked && (
              <View style={[styles.emptyState, { marginTop: 12, padding: 20 }]}>
                <Text style={styles.emptyStateEmoji}>📈</Text>
                <Text style={styles.emptyStateText}>إحصائيات الأداء غير متوفرة</Text>
                <Text style={styles.emptyStateSubtext}>
                  سيتم عرضها عند توفرها في النظام
                </Text>
              </View>
            )}
          </View>

          {/* الطلب النشط */}
          {activeOrder && (
            <View style={styles.activeOrderSection}>
              <Text style={styles.sectionTitle}>🔥 الطلب النشط</Text>
              <View style={styles.activeOrderCard}>
                <View style={styles.activeOrderHeader}>
                  <Text style={styles.activeOrderTitle}>
                    طلب #{activeOrder.orderNumber}
                  </Text>
                  <View style={styles.activeOrderBadge}>
                    <Text style={styles.activeOrderBadgeText}>جاري التوصيل</Text>
                  </View>
                </View>
                <Text style={styles.activeOrderCustomer}>
                  👤 {activeOrder.customerName}
                </Text>
                <Text style={styles.activeOrderAddress}>
                  📍 {activeOrder.deliveryAddress}
                </Text>
                <Text style={styles.activeOrderAmount}>
                  💰 {activeOrder.totalAmount} جنيه
                </Text>
              </View>
            </View>
          )}

          {/* الطلبات المتاحة */}
          <View style={styles.ordersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                🛒 الطلبات المتاحة ({orders.length})
              </Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={refreshOrders}
              >
                <Text style={styles.refreshButtonText}>🔄</Text>
              </TouchableOpacity>
            </View>
            
            {!isAvailable && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>
                  ⚠️ أنت غير متاح حالياً - فعّل الحالة النشطة لرؤية الطلبات
                </Text>
              </View>
            )}
            
            {orders.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateEmoji}>📭</Text>
                <Text style={styles.emptyStateText}>لا توجد طلبات متاحة حالياً</Text>
                <Text style={styles.emptyStateSubtext}>
                  {isAvailable 
                    ? 'انتظر وصول طلبات جديدة' 
                    : 'اجعل نفسك متاحاً لاستقبال الطلبات'
                  }
                </Text>
              </View>
            ) : (
              orders.map((order, index) => (
                <TouchableOpacity
                  key={order.id || index}
                  style={styles.orderCard}
                  onPress={() => showOrderDetails(order)}
                  activeOpacity={0.8}
                >
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderNumber}>
                      📋 #{order.orderNumber || order.id}
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
                        {order.priority === 'urgent' ? '🔴 عاجل' :
                         order.priority === 'express' ? '🟠 سريع' : '🟢 عادي'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.orderDetails}>
                    <Text style={styles.orderCustomer}>
                      👤 {order.customerName || 'عميل'}
                    </Text>
                    <Text style={styles.orderAddress} numberOfLines={2}>
                      📍 {order.deliveryAddress || 'عنوان غير محدد'}
                    </Text>
                    <View style={styles.orderFooter}>
                      <Text style={styles.orderAmount}>
                        💰 {order.totalAmount || 0} جنيه
                      </Text>
                      <TouchableOpacity 
                        style={styles.acceptButtonSmall}
                        onPress={(e) => {
                          e.stopPropagation();
                          acceptOrder(order.id);
                        }}
                      >
                        <Text style={styles.acceptButtonSmallText}>✅ قبول</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  animatedContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: 'white',
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 4,
  },
  userDetails: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 2,
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  availabilitySection: {
    padding: 20,
  },
  availabilityButton: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  availabilityContent: {
    padding: 24,
    alignItems: 'center',
  },
  availabilityIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  availabilityButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  availabilitySubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
  },
  refreshButton: {
    padding: 8,
  },
  refreshButtonText: {
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: (width - 64) / 2,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    textAlign: 'center',
  },
  performanceSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  performanceCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: (width - 80) / 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  performanceIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  performanceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  activeOrderSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  activeOrderCard: {
    backgroundColor: '#FEF3E2',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 16,
    padding: 16,
  },
  activeOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeOrderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
  },
  activeOrderBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeOrderBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  activeOrderCustomer: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 8,
    textAlign: 'right',
  },
  activeOrderAddress: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 8,
    textAlign: 'right',
  },
  activeOrderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
    textAlign: 'right',
  },
  ordersSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  warningBanner: {
    backgroundColor: '#FEF3E2',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  warningText: {
    color: '#92400E',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    gap: 8,
  },
  orderCustomer: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'right',
  },
  orderAddress: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  acceptButtonSmall: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  acceptButtonSmallText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default DashboardScreenAdvanced;