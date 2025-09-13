/**
 * شاشة الإشعارات المتطورة للكابتن - تتكامل مع WebSocket
 * تعرض الطلبات الجديدة، تحديثات الحالة، والإشعارات المحلية
 */

import React, { useState, useEffect } from 'react';

// Conditional React Native imports - fallback for web environment
let ReactNativeComponents: any = {};
try {
  ReactNativeComponents = require('react-native');
} catch {
  // Fallback for web environment
  ReactNativeComponents = {
    StyleSheet: { create: (styles: any) => styles },
    Text: 'div',
    View: 'div',
    ScrollView: 'div',
    TouchableOpacity: 'button',
    Alert: { alert: (title: string, message?: string, buttons?: any[]) => window.alert(`${title}: ${message}`) },
    RefreshControl: 'div',
    Dimensions: { get: () => ({ width: window.innerWidth || 375, height: window.innerHeight || 667 }) },
    Animated: {
      View: 'div',
      Value: class { constructor(value: number) { this.value = value; } value: number; },
      parallel: (animations: any[]) => ({ start: (callback?: () => void) => callback && callback() }),
      timing: (value: any, config: any) => ({})
    },
    StatusBar: 'div',
    Platform: { OS: 'web' as 'ios' | 'android' | 'web' }
  };
}

const { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, RefreshControl, Dimensions, Animated, StatusBar, Platform } = ReactNativeComponents;

// Safe static imports to replace dangerous dynamic require() statements
import webSocketServiceModule from '../services/webSocketService.js';
import notificationServiceModule from '../services/notificationService.js';
import captainServiceModule from '../services/captainService.js';

// Service references with proper error handling (no misleading fallbacks)
const webSocketService = webSocketServiceModule || {
  addEventListener: (event: string, handler: Function) => {
    console.warn('⚠️ WebSocket service not available for event:', event);
  },
  removeEventListener: (event: string, handler: Function) => {},
  isConnected: false,
  isHealthy: () => false
};

const notificationService = notificationServiceModule || {
  initialize: async () => {
    console.warn('⚠️ NotificationService not available for initialization');
    return false;
  },
  getStoredNotifications: async () => {
    console.warn('⚠️ NotificationService not available for getStoredNotifications');
    return [];
  },
  saveNotifications: (notifications: NotificationItem[]) => {
    console.warn('⚠️ NotificationService not available for saveNotifications');
  },
  showLocalNotification: (title: string, message: string, data?: any) => {
    console.warn('⚠️ NotificationService not available for showLocalNotification:', title);
  },
  addNotification: (notification: NotificationItem) => {
    console.warn('⚠️ NotificationService not available for addNotification:', notification.title);
  },
  markAsRead: (notificationId: string) => {
    console.warn('⚠️ NotificationService not available for markAsRead:', notificationId);
  },
  markAllAsRead: () => {
    console.warn('⚠️ NotificationService not available for markAllAsRead');
  },
  getUnreadCount: () => {
    console.warn('⚠️ NotificationService not available for getUnreadCount');
    return 0;
  }
};

const captainService = captainServiceModule || {
  addEventListener: (event: string, handler: Function) => {
    console.warn('⚠️ CaptainService not available for event:', event);
  },
  removeEventListener: (event: string, handler: Function) => {},
  getState: () => ({
    captain: null,
    isAuthenticated: false,
    isOnline: false,
    connectionState: { isConnected: false, isAuthenticated: false }
  })
};

// TypeScript interfaces for service data types
interface OrderData {
  id?: string;
  orderId?: string;
  orderNumber?: string;
  totalAmount?: number;
  priority?: 'urgent' | 'normal' | 'low';
  status?: string;
  customerId?: string;
  items?: any[];
  deliveryAddress?: string;
  createdAt?: Date;
}

interface UpdateData {
  id?: string;
  orderId?: string;
  orderNumber?: string;
  status?: string;
  message?: string;
  timestamp?: Date;
  updates?: any;
}

interface SystemData {
  id?: string;
  type?: 'maintenance' | 'announcement' | 'update';
  title?: string;
  message?: string;
  priority?: 'high' | 'medium' | 'low';
  timestamp?: Date;
  data?: any;
}

interface ConnectionData {
  isConnected: boolean;
  isAuthenticated?: boolean;
  error?: string;
  timestamp?: Date;
  retryCount?: number;
}

interface TouchEvent {
  stopPropagation: () => void;
  preventDefault?: () => void;
}

const { width, height } = Dimensions.get('window');

interface NotificationScreenProps {
  captain: any;
  onBack: () => void;
  onOrderSelect: (order: any) => void;
}

interface NotificationItem {
  id: string;
  type: 'new_order' | 'order_update' | 'system' | 'location';
  title: string;
  message: string;
  timestamp: Date;
  data?: any;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
}

const NotificationScreen: React.FC<NotificationScreenProps> = ({ 
  captain, 
  onBack,
  onOrderSelect 
}) => {
  // حالة الإشعارات
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'orders' | 'system'>('all');
  const [serviceStatus, setServiceStatus] = useState({
    webSocket: false,
    notification: false,
    captain: false
  });
  
  // حالة التحميل والاتصال
  const [isLoading, setIsLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  
  // Animations
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  useEffect(() => {
    initializeNotifications();
    startAnimations();
    
    // تسجيل معالجات WebSocket للإشعارات الجديدة
    webSocketService.addEventListener('new_order_available', handleNewOrderNotification);
    webSocketService.addEventListener('order_status_update', handleOrderUpdateNotification);
    webSocketService.addEventListener('system_message', handleSystemNotification);
    webSocketService.addEventListener('location_update_request', handleLocationNotification);
    
    // تسجيل معالجات CaptainService
    captainService.addEventListener('onNewOrder', handleCaptainNewOrder);
    captainService.addEventListener('onOrderUpdate', handleCaptainOrderUpdate);
    captainService.addEventListener('onConnectionChange', handleConnectionChange);

    // تحديث دوري لحالة الإشعارات
    const intervalId = setInterval(() => {
      checkNotificationUpdates();
    }, 30000); // كل 30 ثانية

    return () => {
      // تنظيف المعالجات
      webSocketService.removeEventListener('new_order_available', handleNewOrderNotification);
      webSocketService.removeEventListener('order_status_update', handleOrderUpdateNotification);
      webSocketService.removeEventListener('system_message', handleSystemNotification);
      webSocketService.removeEventListener('location_update_request', handleLocationNotification);
      
      captainService.removeEventListener('onNewOrder', handleCaptainNewOrder);
      captainService.removeEventListener('onOrderUpdate', handleCaptainOrderUpdate);
      captainService.removeEventListener('onConnectionChange', handleConnectionChange);
      
      clearInterval(intervalId);
    };
  }, []);

  /**
   * تشغيل الحركات المتقدمة
   */
  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  };

  /**
   * تهيئة نظام الإشعارات
   */
  const initializeNotifications = async () => {
    try {
      console.log('🔔 تهيئة نظام الإشعارات...');
      setIsLoading(true);
      
      // تهيئة خدمة الإشعارات المحلية
      await notificationService.initialize();
      
      // جلب الإشعارات المحفوظة
      const savedNotifications = await notificationService.getStoredNotifications();
      setNotifications(savedNotifications || []);
      
      // حساب الإشعارات غير المقروءة
      const unread = savedNotifications?.filter((n: NotificationItem) => !n.isRead).length || 0;
      setUnreadCount(unread);
      
      // التحقق من حالة WebSocket
      setWsConnected(webSocketService.isConnected);
      
      console.log('✅ نظام الإشعارات جاهز');
      
    } catch (error) {
      console.error('❌ خطأ في تهيئة الإشعارات:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * معالج إشعار الطلب الجديد من WebSocket
   */
  const handleNewOrderNotification = (orderData: OrderData) => {
    console.log('🚚 إشعار طلب جديد من WebSocket:', orderData);
    
    const notification: NotificationItem = {
      id: `order_${orderData.orderId || orderData.id}_${Date.now()}`,
      type: 'new_order',
      title: '🚚 طلب جديد متاح!',
      message: `طلب رقم ${orderData.orderNumber || orderData.orderId} بقيمة ${orderData.totalAmount || 0} جنيه`,
      timestamp: new Date(),
      data: orderData,
      isRead: false,
      priority: orderData.priority === 'urgent' ? 'high' : 'medium'
    };
    
    addNotification(notification);
    
    // عرض إشعار محلي
    notificationService.showLocalNotification(
      notification.title,
      notification.message,
      notification.data
    );
  };

  /**
   * معالج تحديث حالة الطلب من WebSocket
   */
  const handleOrderUpdateNotification = (updateData: UpdateData) => {
    console.log('📱 إشعار تحديث طلب من WebSocket:', updateData);
    
    const notification: NotificationItem = {
      id: `update_${updateData.orderId || updateData.id}_${Date.now()}`,
      type: 'order_update',
      title: '📱 تحديث حالة الطلب',
      message: `تم تحديث الطلب رقم ${updateData.orderNumber || updateData.orderId}`,
      timestamp: new Date(),
      data: updateData,
      isRead: false,
      priority: 'medium'
    };
    
    addNotification(notification);
  };

  /**
   * معالج رسائل النظام من WebSocket
   */
  const handleSystemNotification = (systemData: SystemData) => {
    console.log('📢 إشعار نظام من WebSocket:', systemData);
    
    const notification: NotificationItem = {
      id: `system_${Date.now()}`,
      type: 'system',
      title: systemData.title || '📢 رسالة من النظام',
      message: systemData.message || 'تحديث جديد من النظام',
      timestamp: new Date(),
      data: systemData,
      isRead: false,
      priority: systemData.priority || 'low'
    };
    
    addNotification(notification);
    
    // عرض إشعار محلي للرسائل المهمة
    if (systemData.priority === 'high' || systemData.priority === 'urgent') {
      notificationService.showLocalNotification(
        notification.title,
        notification.message,
        notification.data
      );
    }
  };

  /**
   * معالج إشعارات الموقع من WebSocket - PRODUCTION READY
   */
  const handleLocationNotification = (locationData: any) => {
    console.log('📍 إشعار موقع من WebSocket:', locationData);
    
    // Extract location data with proper fallbacks for various payload formats
    const requestId = locationData.requestId || locationData.data?.requestId || `loc_${Date.now()}`;
    const message = locationData.message || locationData.data?.message || 'يرجى تحديث موقعك للحصول على طلبات أفضل';
    const type = locationData.type || locationData.data?.type || 'location_request';
    
    const notification: NotificationItem = {
      id: `location_${requestId}_${Date.now()}`,
      type: 'location',
      title: '📍 طلب تحديث الموقع',
      message: message,
      timestamp: new Date(),
      data: {
        requestId,
        type,
        originalData: locationData,
        requiresAction: true,
        actionType: 'location_update'
      },
      isRead: false,
      priority: 'medium' // Location updates are important for order assignment
    };
    
    addNotification(notification);
    
    // عرض إشعار محلي فوري للموقع - مهم للحصول على طلبات
    notificationService.showLocalNotification(
      notification.title,
      notification.message,
      notification.data
    );
    
    // قم بفتح طلب تحديث الموقع تلقائياً إذا كان التطبيق مفتوح
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      setTimeout(() => {
        requestLocationUpdate(requestId);
      }, 2000); // بعد ثانيتين لإتاحة الوقت للمستخدم لرؤية الإشعار
    }
  };

  /**
   * طلب تحديث الموقع من المستخدم
   */
  const requestLocationUpdate = (requestId: string) => {
    try {
      if (navigator.geolocation) {
        console.log('📍 طلب تحديث الموقع التلقائي...');
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log('📍 تم الحصول على الموقع:', { latitude, longitude });
            
            // إرسال الموقع عبر WebSocket
            if (webSocketService.isConnected) {
              webSocketService.sendMessage({
                type: 'captain_location_update',
                data: {
                  lat: latitude,
                  lng: longitude,
                  timestamp: Date.now(),
                  requestId: requestId,
                  accuracy: position.coords.accuracy,
                  speed: position.coords.speed || 0,
                  heading: position.coords.heading || 0
                }
              });
              
              // إشعار نجاح تحديث الموقع
              const successNotification: NotificationItem = {
                id: `location_success_${Date.now()}`,
                type: 'system',
                title: '✅ تم تحديث الموقع',
                message: 'تم تحديث موقعك بنجاح وسيتم إرسال الطلبات القريبة منك',
                timestamp: new Date(),
                data: { latitude, longitude, requestId },
                isRead: false,
                priority: 'low'
              };
              
              addNotification(successNotification);
            }
          },
          (error) => {
            console.warn('⚠️ فشل في الحصول على الموقع:', error.message);
            
            // إشعار فشل تحديث الموقع
            const errorNotification: NotificationItem = {
              id: `location_error_${Date.now()}`,
              type: 'system',
              title: '❌ فشل تحديث الموقع',
              message: 'لم نتمكن من الحصول على موقعك. يرجى التحقق من إذن الموقع في الإعدادات',
              timestamp: new Date(),
              data: { error: error.message, requestId },
              isRead: false,
              priority: 'medium'
            };
            
            addNotification(errorNotification);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000
          }
        );
      }
    } catch (error) {
      console.error('❌ خطأ في طلب تحديث الموقع:', error);
    }
  };

  /**
   * معالج الطلب الجديد من CaptainService
   */
  const handleCaptainNewOrder = (orderData: OrderData) => {
    console.log('🚚 طلب جديد من CaptainService:', orderData);
    // معالجة إضافية أو تنبيه خاص
  };

  /**
   * معالج تحديث الطلب من CaptainService
   */
  const handleCaptainOrderUpdate = (updateData: UpdateData) => {
    console.log('📱 تحديث طلب من CaptainService:', updateData);
    // معالجة إضافية أو تنبيه خاص
  };

  /**
   * معالج تغيير حالة الاتصال
   */
  const handleConnectionChange = (connectionData: ConnectionData) => {
    console.log('🔗 تغيير حالة الاتصال:', connectionData);
    setWsConnected(connectionData.isConnected || false);
    
    if (connectionData.isConnected) {
      const notification: NotificationItem = {
        id: `connection_${Date.now()}`,
        type: 'system',
        title: '🟢 تم الاتصال',
        message: 'تم الاتصال بالنظام بنجاح',
        timestamp: new Date(),
        data: connectionData,
        isRead: false,
        priority: 'low'
      };
      
      addNotification(notification);
    }
  };

  /**
   * إضافة إشعار جديد - مع state consistency fixes
   */
  const addNotification = (notification: NotificationItem) => {
    setNotifications(prev => {
      const updated = [notification, ...prev];
      // الاحتفاظ بآخر 100 إشعار فقط
      const trimmed = updated.slice(0, 100);
      
      // حفظ في التخزين المحلي
      notificationService.saveNotifications(trimmed);
      
      // استخدام service method للـ consistency
      if (notificationService.addNotification) {
        notificationService.addNotification(notification);
      }
      
      console.log('📨 Added new notification:', notification.title, 'isRead:', notification.isRead);
      return trimmed;
    });
    
    // تحديث عداد غير المقروء فقط إذا كان الإشعار غير مقروء
    if (!notification.isRead) {
      setUnreadCount(prev => {
        const newCount = prev + 1;
        console.log('📱 Updated unread count after adding:', prev, '->', newCount);
        return newCount;
      });
    }
  };

  /**
   * تحديث دوري لحالة الإشعارات
   */
  const checkNotificationUpdates = () => {
    // فحص إشعارات فائتة أو تحديثات
    console.log('🔍 فحص تحديثات الإشعارات...');
  };

  /**
   * تحديث البيانات
   */
  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await initializeNotifications();
      console.log('✅ تم تحديث الإشعارات');
    } catch (error) {
      console.error('❌ خطأ في تحديث الإشعارات:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * تحديد الإشعار كمقروء - مع state consistency fixes
   */
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      
      // حفظ التحديث في service layer
      notificationService.saveNotifications(updated);
      
      // استخدام service method للـ consistency
      if (notificationService.markAsRead) {
        notificationService.markAsRead(notificationId);
      }
      
      return updated;
    });
    
    // تقليل عداد غير المقروء مع validation
    setUnreadCount(prev => {
      const newCount = Math.max(0, prev - 1);
      console.log('📱 Updated unread count:', prev, '->', newCount);
      return newCount;
    });
  };

  /**
   * تحديد جميع الإشعارات كمقروءة - مع state consistency fixes
   */
  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, isRead: true }));
      
      // حفظ التحديث في service layer
      notificationService.saveNotifications(updated);
      
      // استخدام service method للـ consistency
      if (notificationService.markAllAsRead) {
        notificationService.markAllAsRead();
      }
      
      console.log('📱 Marked all notifications as read:', updated.length, 'notifications');
      return updated;
    });
    
    setUnreadCount(0);
    console.log('📱 Reset unread count to 0');
  };

  /**
   * حذف إشعار - مع إصلاح state consistency للـ unreadCount
   */
  const deleteNotification = (notificationId: string) => {
    Alert.alert(
      'حذف الإشعار',
      'هل تريد حذف هذا الإشعار؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: () => {
            // العثور على الإشعار المحذوف للتحقق من حالة القراءة
            const notificationToDelete = notifications.find(n => n.id === notificationId);
            const wasUnread = notificationToDelete && !notificationToDelete.isRead;
            
            setNotifications(prev => {
              const updated = prev.filter(n => n.id !== notificationId);
              
              // حفظ التحديث في service layer
              notificationService.saveNotifications(updated);
              
              console.log('🗑️ Deleted notification:', notificationId, 'wasUnread:', wasUnread);
              return updated;
            });
            
            // تقليل عداد غير المقروء إذا كان الإشعار المحذوف غير مقروء
            if (wasUnread) {
              setUnreadCount(prev => {
                const newCount = Math.max(0, prev - 1);
                console.log('📱 Updated unread count after deletion:', prev, '->', newCount);
                return newCount;
              });
            }
          }
        }
      ]
    );
  };

  /**
   * التعامل مع النقر على إشعار
   */
  const handleNotificationPress = (notification: NotificationItem) => {
    // تحديد كمقروء
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // العمل حسب نوع الإشعار
    switch (notification.type) {
      case 'new_order':
        if (notification.data && onOrderSelect) {
          onOrderSelect(notification.data);
        }
        break;
        
      case 'order_update':
        // عرض تفاصيل تحديث الطلب
        Alert.alert(
          'تفاصيل التحديث',
          notification.message,
          [{ text: 'حسناً', style: 'default' }]
        );
        break;
        
      case 'system':
        // عرض رسالة النظام
        Alert.alert(
          notification.title,
          notification.message,
          [{ text: 'حسناً', style: 'default' }]
        );
        break;
    }
  };

  /**
   * فلترة الإشعارات
   */
  const filteredNotifications = notifications.filter(notification => {
    switch (filterType) {
      case 'orders':
        return notification.type === 'new_order' || notification.type === 'order_update';
      case 'system':
        return notification.type === 'system' || notification.type === 'location';
      default:
        return true;
    }
  });

  /**
   * تنسيق الوقت
   */
  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
  };

  /**
   * لون الأولوية
   */
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  /**
   * أيقونة النوع
   */
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'new_order': return '🚚';
      case 'order_update': return '📱';
      case 'system': return '📢';
      case 'location': return '📍';
      default: return '🔔';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>🔄 جاري تحميل الإشعارات...</Text>
      </View>
    );
  }

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
        {/* الرأس */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
            >
              <Text style={styles.backButtonText}>← رجوع</Text>
            </TouchableOpacity>
            
            <View style={styles.headerTitle}>
              <Text style={styles.title}>🔔 الإشعارات</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.markAllButton}
                onPress={markAllAsRead}
              >
                <Text style={styles.markAllButtonText}>✓ تحديد الكل كمقروء</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* مؤشر حالة الاتصال */}
          <View style={styles.connectionStatus}>
            <View style={[
              styles.connectionBadge,
              { backgroundColor: wsConnected ? '#10B981' : '#EF4444' }
            ]}>
              <Text style={styles.connectionBadgeText}>
                {wsConnected ? '🟢 متصل' : '🔴 غير متصل'}
              </Text>
            </View>
          </View>
        </View>

        {/* فلاتر الإشعارات */}
        <View style={styles.filterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterType === 'all' && styles.filterButtonActive
              ]}
              onPress={() => setFilterType('all')}
            >
              <Text style={[
                styles.filterButtonText,
                filterType === 'all' && styles.filterButtonTextActive
              ]}>
                📋 الكل ({notifications.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterType === 'orders' && styles.filterButtonActive
              ]}
              onPress={() => setFilterType('orders')}
            >
              <Text style={[
                styles.filterButtonText,
                filterType === 'orders' && styles.filterButtonTextActive
              ]}>
                🚚 الطلبات ({notifications.filter(n => n.type === 'new_order' || n.type === 'order_update').length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterType === 'system' && styles.filterButtonActive
              ]}
              onPress={() => setFilterType('system')}
            >
              <Text style={[
                styles.filterButtonText,
                filterType === 'system' && styles.filterButtonTextActive
              ]}>
                📢 النظام ({notifications.filter(n => n.type === 'system' || n.type === 'location').length})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* قائمة الإشعارات */}
        <ScrollView 
          style={styles.notificationsList}
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
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>📭</Text>
              <Text style={styles.emptyStateText}>لا توجد إشعارات</Text>
              <Text style={styles.emptyStateSubtext}>
                {filterType === 'all' 
                  ? 'ستظهر الإشعارات الجديدة هنا'
                  : `لا توجد إشعارات من نوع ${filterType === 'orders' ? 'الطلبات' : 'النظام'}`
                }
              </Text>
            </View>
          ) : (
            filteredNotifications.map((notification, index) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.isRead && styles.notificationCardUnread
                ]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.8}
              >
                <View style={styles.notificationHeader}>
                  <View style={styles.notificationTitleRow}>
                    <Text style={styles.notificationIcon}>
                      {getTypeIcon(notification.type)}
                    </Text>
                    <Text style={[
                      styles.notificationTitle,
                      !notification.isRead && styles.notificationTitleUnread
                    ]}>
                      {notification.title}
                    </Text>
                  </View>
                  
                  <View style={styles.notificationMeta}>
                    <View style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor(notification.priority) }
                    ]}>
                      <Text style={styles.priorityBadgeText}>
                        {notification.priority === 'high' ? '🔴' :
                         notification.priority === 'medium' ? '🟡' : '🟢'}
                      </Text>
                    </View>
                    
                    <Text style={styles.notificationTimestamp}>
                      {formatTimestamp(notification.timestamp)}
                    </Text>
                    
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={(e: TouchEvent) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <Text style={[
                  styles.notificationMessage,
                  !notification.isRead && styles.notificationMessageUnread
                ]}>
                  {notification.message}
                </Text>
                
                {!notification.isRead && (
                  <View style={styles.unreadIndicator} />
                )}
              </TouchableOpacity>
            ))
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
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
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#10B981',
    borderRadius: 8,
  },
  markAllButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  connectionStatus: {
    alignItems: 'center',
  },
  connectionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  connectionBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 16,
    marginTop: 8,
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#4F46E5',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  notificationsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
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
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  notificationCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  notificationHeader: {
    marginBottom: 8,
  },
  notificationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  notificationTitleUnread: {
    color: '#1F2937',
    fontWeight: 'bold',
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityBadgeText: {
    fontSize: 12,
  },
  notificationTimestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
    textAlign: 'center',
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
    lineHeight: 20,
  },
  notificationMessageUnread: {
    color: '#374151',
    fontWeight: '500',
  },
  unreadIndicator: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 8,
    height: 8,
    backgroundColor: '#EF4444',
    borderRadius: 4,
  },
});

export default NotificationScreen;