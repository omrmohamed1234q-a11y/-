/**
 * لوحة الإجراءات السريعة للكابتن - تحسين UX
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  Vibration,
  Platform
} from 'react-native';

import captainService from '../services/captainService.js';
import locationService from '../services/locationService.js';
import performanceService from '../services/performanceService.js';

const { width } = Dimensions.get('window');

interface QuickActionsPanelProps {
  onToggleAvailability?: (isAvailable: boolean) => void;
  onEmergencyMode?: () => void;
  onRefreshData?: () => void;
  onNavigateToOrders?: () => void;
  onNavigateToEarnings?: () => void;
  isAvailable?: boolean;
  connectionStatus?: 'connected' | 'connecting' | 'disconnected';
}

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({
  onToggleAvailability,
  onEmergencyMode,
  onRefreshData,
  onNavigateToOrders,
  onNavigateToEarnings,
  isAvailable = false,
  connectionStatus = 'disconnected'
}) => {
  // حالة الأزرار والتأثيرات
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [quickStats, setQuickStats] = useState({
    todayOrders: 0,
    todayEarnings: 0,
    activeOrders: 0
  });

  // متحكمات الحركة
  const [pulseAnim] = useState(new Animated.Value(1));
  const [slideAnim] = useState(new Animated.Value(0));
  const [emergencyPulse] = useState(new Animated.Value(1));

  useEffect(() => {
    // تهيئة التأثيرات البصرية
    startPulseAnimation();
    slideIn();
    
    // تحديث الإحصائيات السريعة
    loadQuickStats();
  }, []);

  useEffect(() => {
    // تحديث التأثيرات حسب حالة الاتصال
    if (connectionStatus === 'connected' && isAvailable) {
      startPulseAnimation();
    } else {
      stopPulseAnimation();
    }
  }, [connectionStatus, isAvailable]);

  /**
   * تحريك الدخول
   */
  const slideIn = () => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  /**
   * تحريك النبض للحالة النشطة
   */
  const startPulseAnimation = () => {
    if (!isAvailable) return;
    
    const pulseSequence = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.05,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ]);

    Animated.loop(pulseSequence).start();
  };

  /**
   * إيقاف تحريك النبض
   */
  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  /**
   * تحريك الطوارئ
   */
  const startEmergencyPulse = () => {
    const emergencySequence = Animated.sequence([
      Animated.timing(emergencyPulse, {
        toValue: 1.1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(emergencyPulse, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]);

    Animated.loop(emergencySequence, { iterations: 3 }).start();
  };

  /**
   * تحميل الإحصائيات السريعة
   */
  const loadQuickStats = async () => {
    try {
      const timer = performanceService.startPerformanceTimer('load_quick_stats');
      
      // محاولة استرجاع من الـ cache أولاً
      const cachedStats = await performanceService.getCache('quick_stats');
      if (cachedStats) {
        setQuickStats(cachedStats);
        timer?.end();
        return;
      }

      // جلب البيانات الحديثة
      const state = captainService.getState();
      const stats = {
        todayOrders: state.dailyStats?.orders || 0,
        todayEarnings: state.dailyStats?.earnings || 0,
        activeOrders: state.orders?.filter((o: any) => o.status === 'active').length || 0
      };

      setQuickStats(stats);
      
      // حفظ في الـ cache
      await performanceService.setCache('quick_stats', stats, 2 * 60 * 1000); // 2 دقائق
      
      timer?.end();
    } catch (error) {
      console.error('❌ خطأ في تحميل الإحصائيات السريعة:', error);
    }
  };

  /**
   * تبديل حالة التوفر مع تأثيرات بصرية
   */
  const handleToggleAvailability = async () => {
    try {
      // اهتزاز خفيف للتأكيد
      if (Platform.OS !== 'web') {
        Vibration.vibrate(50);
      }

      const newAvailability = !isAvailable;
      
      if (newAvailability) {
        startPulseAnimation();
      } else {
        stopPulseAnimation();
      }

      // استدعاء الدالة المرسلة
      onToggleAvailability?.(newAvailability);
      
      // تحديث الإحصائيات
      setTimeout(() => {
        loadQuickStats();
      }, 1000);

    } catch (error) {
      console.error('❌ خطأ في تبديل حالة التوفر:', error);
    }
  };

  /**
   * تحديث البيانات مع تأثيرات بصرية
   */
  const handleRefreshData = async () => {
    if (isRefreshing) return;

    try {
      setIsRefreshing(true);
      
      // تأثير بصري للتحديث
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: 0.95,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        })
      ]).start();

      // تحديث البيانات
      await Promise.all([
        loadQuickStats(),
        onRefreshData?.()
      ]);

      console.log('✅ تم تحديث البيانات بنجاح');

    } catch (error) {
      console.error('❌ خطأ في تحديث البيانات:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * وضع الطوارئ
   */
  const handleEmergencyMode = () => {
    Alert.alert(
      '🚨 وضع الطوارئ',
      'هل تريد تفعيل وضع الطوارئ؟\nسيتم إشعار الدعم الفني فوراً.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد',
          style: 'destructive',
          onPress: () => {
            setEmergencyMode(true);
            startEmergencyPulse();
            
            // اهتزاز قوي
            if (Platform.OS !== 'web') {
              Vibration.vibrate([500, 200, 500]);
            }
            
            onEmergencyMode?.();
            
            // إزالة وضع الطوارئ بعد 30 ثانية
            setTimeout(() => {
              setEmergencyMode(false);
            }, 30000);
          }
        }
      ]
    );
  };

  /**
   * التنقل السريع للطلبات
   */
  const handleNavigateToOrders = () => {
    // تأثير بصري
    Animated.timing(slideAnim, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    });

    onNavigateToOrders?.();
  };

  /**
   * التنقل السريع للأرباح
   */
  const handleNavigateToEarnings = () => {
    // تأثير بصري
    Animated.timing(slideAnim, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    });

    onNavigateToEarnings?.();
  };

  return (
    <Animated.View style={[
      styles.container,
      {
        transform: [
          { scale: slideAnim },
          { translateY: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0]
          })}
        ],
        opacity: slideAnim
      }
    ]}>
      {/* الإحصائيات السريعة */}
      <View style={styles.quickStatsRow}>
        <TouchableOpacity 
          style={styles.statItem}
          onPress={handleNavigateToOrders}
          data-testid="quick-stat-orders"
        >
          <Text style={styles.statValue}>{quickStats.todayOrders}</Text>
          <Text style={styles.statLabel}>طلبات اليوم</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.statItem}
          onPress={handleNavigateToEarnings}
          data-testid="quick-stat-earnings"
        >
          <Text style={styles.statValue}>{quickStats.todayEarnings} جنيه</Text>
          <Text style={styles.statLabel}>أرباح اليوم</Text>
        </TouchableOpacity>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{quickStats.activeOrders}</Text>
          <Text style={styles.statLabel}>طلبات نشطة</Text>
        </View>
      </View>

      {/* الأزرار السريعة */}
      <View style={styles.actionsRow}>
        {/* زر التوفر الرئيسي */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[
              styles.availabilityButton,
              {
                backgroundColor: isAvailable ? '#10B981' : '#6B7280',
                shadowColor: isAvailable ? '#10B981' : '#6B7280',
              }
            ]}
            onPress={handleToggleAvailability}
            data-testid="toggle-availability"
          >
            <Text style={styles.availabilityIcon}>
              {isAvailable ? '🟢' : '🔴'}
            </Text>
            <Text style={styles.availabilityText}>
              {isAvailable ? 'متاح' : 'غير متاح'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* زر التحديث */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: '#3B82F6' },
            isRefreshing && styles.buttonDisabled
          ]}
          onPress={handleRefreshData}
          disabled={isRefreshing}
          data-testid="refresh-data"
        >
          <Text style={styles.actionIcon}>
            {isRefreshing ? '⏳' : '🔄'}
          </Text>
          <Text style={styles.actionText}>
            {isRefreshing ? 'جاري...' : 'تحديث'}
          </Text>
        </TouchableOpacity>

        {/* زر الطوارئ */}
        <Animated.View style={{ transform: [{ scale: emergencyPulse }] }}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              {
                backgroundColor: emergencyMode ? '#DC2626' : '#EF4444',
                shadowColor: '#EF4444',
              }
            ]}
            onPress={handleEmergencyMode}
            data-testid="emergency-mode"
          >
            <Text style={styles.actionIcon}>🚨</Text>
            <Text style={styles.actionText}>
              {emergencyMode ? 'طوارئ!' : 'مساعدة'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* مؤشر حالة الاتصال */}
      <View style={styles.connectionIndicator}>
        <View style={[
          styles.connectionDot,
          {
            backgroundColor: connectionStatus === 'connected' 
              ? '#10B981' 
              : connectionStatus === 'connecting'
              ? '#F59E0B'
              : '#EF4444'
          }
        ]} />
        <Text style={styles.connectionText}>
          {connectionStatus === 'connected' 
            ? '⚡ متصل'
            : connectionStatus === 'connecting'
            ? '🔄 جاري الاتصال'
            : '❌ منقطع'
          }
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  availabilityButton: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginRight: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  availabilityIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  actionIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectionText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

export default QuickActionsPanel;