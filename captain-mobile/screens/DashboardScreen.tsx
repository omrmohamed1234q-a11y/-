/**
 * شاشة لوحة التحكم الرئيسية للكابتن
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
  Dimensions 
} from 'react-native';

import captainService from '../services/captainService.js';

const { width } = Dimensions.get('window');

interface DashboardScreenProps {
  captain: any;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  onLogout: () => void;
}

const DashboardScreen: React.FC<DashboardScreenProps> = ({ 
  captain, 
  connectionStatus, 
  onLogout 
}) => {
  const [isOnline, setIsOnline] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [orders, setOrders] = useState([]);
  const [dailyStats, setDailyStats] = useState({
    orders: 0,
    earnings: 0,
    distance: 0,
    onlineTime: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    initializeDashboard();
    
    // تسجيل معالجات الأحداث
    captainService.addEventListener('onOrdersUpdate', handleOrdersUpdate);
    captainService.addEventListener('onNewOrder', handleNewOrder);

    return () => {
      // تنظيف المعالجات عند إلغاء المكون
      captainService.removeEventListener('onOrdersUpdate', handleOrdersUpdate);
      captainService.removeEventListener('onNewOrder', handleNewOrder);
    };
  }, []);

  /**
   * تهيئة لوحة التحكم
   */
  const initializeDashboard = async () => {
    try {
      const state = captainService.getState();
      setIsOnline(state.isOnline);
      setIsAvailable(state.isAvailable);
      setOrders(state.orders);
      setDailyStats(state.dailyStats);

      // جلب الطلبات المتاحة
      await captainService.refreshOrders();
    } catch (error) {
      console.error('❌ خطأ في تهيئة لوحة التحكم:', error);
    }
  };

  /**
   * معالج تحديث الطلبات
   */
  const handleOrdersUpdate = (updatedOrders) => {
    setOrders(updatedOrders);
  };

  /**
   * معالج الطلب الجديد
   */
  const handleNewOrder = (newOrder) => {
    // سيتم تحديث الطلبات تلقائياً عبر handleOrdersUpdate
  };

  /**
   * تبديل حالة الكابتن (متاح/غير متاح)
   */
  const toggleAvailability = async () => {
    try {
      const newAvailability = !isAvailable;
      await captainService.setAvailability(newAvailability);
      setIsAvailable(newAvailability);
      setIsOnline(newAvailability);

      Alert.alert(
        'تم التحديث',
        `أنت الآن ${newAvailability ? 'متاح' : 'غير متاح'} لاستقبال الطلبات`
      );
    } catch (error) {
      console.error('❌ خطأ في تحديث الحالة:', error);
      Alert.alert('خطأ', 'فشل في تحديث الحالة');
    }
  };

  /**
   * تحديث البيانات
   */
  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await captainService.refreshOrders();
      await initializeDashboard();
    } catch (error) {
      console.error('❌ خطأ في تحديث البيانات:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * قبول طلب
   */
  const acceptOrder = async (orderId) => {
    try {
      Alert.alert(
        'تأكيد قبول الطلب',
        'هل أنت متأكد من قبول هذا الطلب؟',
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'قبول',
            style: 'default',
            onPress: async () => {
              const result = await captainService.acceptOrder(orderId);
              if (result.success) {
                Alert.alert('تم بنجاح', 'تم قبول الطلب، ابدأ رحلة التوصيل');
              } else {
                Alert.alert('خطأ', result.error || 'فشل في قبول الطلب');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ خطأ في قبول الطلب:', error);
      Alert.alert('خطأ', 'فشل في قبول الطلب');
    }
  };

  /**
   * عرض تفاصيل الطلب
   */
  const showOrderDetails = (order) => {
    const details = `
الطلب رقم: ${order.orderNumber || order.id}
العميل: ${order.customerName || 'غير محدد'}
العنوان: ${order.deliveryAddress || 'غير محدد'}
القيمة: ${order.totalAmount || 0} جنيه
طريقة الدفع: ${order.paymentMethod || 'نقدي'}
    `;

    Alert.alert('تفاصيل الطلب', details.trim(), [
      { text: 'إغلاق', style: 'cancel' },
      { 
        text: 'قبول الطلب', 
        style: 'default',
        onPress: () => acceptOrder(order.id)
      }
    ]);
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

              <TouchableOpacity 
                style={styles.acceptButton}
                onPress={() => acceptOrder(order.id)}
              >
                <Text style={styles.acceptButtonText}>قبول الطلب</Text>
              </TouchableOpacity>
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
});

export default DashboardScreen;