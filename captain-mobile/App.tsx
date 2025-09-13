/**
 * التطبيق الرئيسي للكابتن المحمول - اطبعلي
 * نسخة محدثة تعمل مع React Native والنظام الحقيقي
 */

import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  Alert,
  Platform,
  Dimensions
} from 'react-native';

// استيراد الخدمات المحدثة
import captainService from './services/captainService.js';

// مكونات مخصصة بسيطة
import LoginScreen from './screens/LoginScreen.tsx';
import DashboardScreen from './screens/DashboardScreen.tsx';
import LoadingScreen from './screens/LoadingScreen.tsx';
import DeliveryTrackingScreen from './screens/DeliveryTrackingScreen.tsx';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [captain, setCaptain] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [currentScreen, setCurrentScreen] = useState('dashboard');

  useEffect(() => {
    initializeApp();
    
    // تنظيف الموارد عند إغلاق التطبيق
    return () => {
      captainService.cleanup();
    };
  }, []);

  /**
   * تهيئة التطبيق
   */
  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing captain app...');

      // تسجيل معالجات الأحداث أولاً
      captainService.addEventListener('onAuthChange', handleAuthChange);
      captainService.addEventListener('onConnectionChange', handleConnectionChange);
      captainService.addEventListener('onNewOrder', handleNewOrder);

      // محاولة استرجاع بيانات المصادقة المحفوظة
      const hasAuth = await captainService.loadSavedAuth();
      
      if (hasAuth) {
        const state = captainService.getState();
        
        // التحقق الصارم من JWT token قبل الاتصال بـ WebSocket
        const authToken = await captainService.getAuthToken();
        const hasValidToken = authToken && authToken.length > 10;
        const hasValidCaptain = state.captain && state.captain.id;
        
        console.log('🔐 Auth validation:', {
          hasAuthToken: !!authToken,
          tokenLength: authToken?.length || 0,
          hasValidCaptain: hasValidCaptain,
          captainId: state.captain?.id
        });
        
        if (hasValidToken && hasValidCaptain) {
          setIsAuthenticated(true);
          setCaptain(state.captain);
          
          // الاتصال بالخدمات مع auth data صحيح فقط
          captainService.connectWebSocket();
          
          console.log('✅ Restored saved authentication data with valid JWT');
        } else {
          // مسح البيانات المعطوبة ومنع الاتصال
          console.warn('⚠️ Invalid authentication data found - clearing and preventing connection');
          await captainService.clearAuthData();
          console.log('📱 Cleared invalid authentication data');
        }
      } else {
        console.log('📱 No saved authentication found');
      }

      setIsLoading(false);

    } catch (error) {
      console.error('❌ Error initializing app:', error);
      Alert.alert('خطأ', 'فشل في تهيئة التطبيق');
      setIsLoading(false);
    }
  };

  /**
   * معالج تغيير المصادقة
   */
  const handleAuthChange = (data) => {
    console.log('🔐 Auth state change:', data);
    setIsAuthenticated(data.isAuthenticated);
    setCaptain(data.captain);
  };

  /**
   * معالج تغيير الاتصال
   */
  const handleConnectionChange = (data) => {
    console.log('🔗 Connection state change:', data);
    
    if (data.isConnected && data.isAuthenticated) {
      setConnectionStatus('connected');
    } else if (data.isConnected && !data.isAuthenticated) {
      setConnectionStatus('authenticating');
    } else {
      setConnectionStatus('disconnected');
    }
  };

  /**
   * معالج الطلب الجديد
   */
  const handleNewOrder = (orderData) => {
    console.log('🚚 New order available:', orderData);
    
    // عرض تنبيه للطلب الجديد
    Alert.alert(
      '🚚 طلب جديد متاح!',
      `طلب رقم ${orderData.orderNumber || orderData.id}\nبقيمة ${orderData.totalAmount || 0} جنيه`,
      [
        {
          text: 'عرض الطلب',
          onPress: () => {
            console.log('📱 Captain wants to view order:', orderData.id);
          }
        },
        {
          text: 'لاحقاً',
          style: 'cancel'
        }
      ]
    );
  };

  /**
   * معالج تسجيل الدخول
   */
  const handleLogin = async (credentials) => {
    try {
      setIsLoading(true);
      console.log('🔐 Attempting login...');
      
      const result = await captainService.login(
        credentials.username,
        credentials.password,
        credentials.driverCode
      );

      if (result.success) {
        console.log('✅ Login successful');
        // الحالة ستتغير تلقائياً عبر handleAuthChange
      } else {
        console.error('❌ Login failed:', result.error);
        Alert.alert('خطأ في تسجيل الدخول', result.error);
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      Alert.alert('خطأ', 'فشل في تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * معالج تسجيل الخروج
   */
  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out...');
      await captainService.logout();
      console.log('✅ Logout successful');
      // الحالة ستتغير تلقائياً عبر handleAuthChange
    } catch (error) {
      console.error('❌ Logout error:', error);
      Alert.alert('خطأ', 'فشل في تسجيل الخروج');
    }
  };

  /**
   * معالج تبديل الحالة (متاح/غير متاح)
   */
  const handleToggleAvailability = async (isAvailable) => {
    try {
      console.log(`📱 Setting availability to: ${isAvailable ? 'available' : 'unavailable'}`);
      await captainService.setAvailability(isAvailable);
    } catch (error) {
      console.error('❌ Error setting availability:', error);
      Alert.alert('خطأ', 'فشل في تحديث الحالة');
    }
  };

  /**
   * معالج قبول الطلب
   */
  const handleAcceptOrder = async (orderId) => {
    try {
      console.log('✅ Accepting order:', orderId);
      const result = await captainService.acceptOrder(orderId);
      
      if (result.success) {
        Alert.alert('تم بنجاح', 'تم قبول الطلب بنجاح');
      } else {
        Alert.alert('خطأ', result.error || 'فشل في قبول الطلب');
      }
    } catch (error) {
      console.error('❌ Error accepting order:', error);
      Alert.alert('خطأ', 'فشل في قبول الطلب');
    }
  };

  // عرض شاشة التحميل
  if (isLoading) {
    return <LoadingScreen />;
  }

  // عرض شاشة تسجيل الدخول
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <LoginScreen 
          onLogin={handleLogin}
          connectionStatus={connectionStatus}
        />
      </SafeAreaView>
    );
  }

  // عرض الشاشة المطلوبة
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'delivery-tracking':
        return (
          <DeliveryTrackingScreen
            navigation={{
              goBack: () => setCurrentScreen('dashboard'),
              navigate: (screen) => setCurrentScreen(screen)
            }}
            route={{}}
          />
        );
      case 'dashboard':
      default:
        return (
          <DashboardScreen
            captain={captain}
            connectionStatus={connectionStatus}
            onLogout={handleLogout}
            onToggleAvailability={handleToggleAvailability}
            onAcceptOrder={handleAcceptOrder}
            onNavigateToTracking={() => setCurrentScreen('delivery-tracking')}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderCurrentScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});