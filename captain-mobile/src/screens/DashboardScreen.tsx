import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface CaptainStats {
  todayOrders: number;
  todayEarnings: number;
  onlineHours: number;
  rating: number;
}

export default function DashboardScreen() {
  const [isOnline, setIsOnline] = useState(false);
  const [stats, setStats] = useState<CaptainStats>({
    todayOrders: 8,
    todayEarnings: 240,
    onlineHours: 6.5,
    rating: 4.8,
  });

  const toggleOnlineStatus = () => {
    if (!isOnline) {
      Alert.alert(
        'بدء العمل',
        'هل تريد بدء استقبال الطلبات؟',
        [
          { text: 'إلغاء', style: 'cancel' },
          { 
            text: 'نعم', 
            onPress: () => setIsOnline(true),
            style: 'default'
          },
        ]
      );
    } else {
      setIsOnline(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>مرحباً، كابتن محمد!</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('ar-EG', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Online Status Toggle */}
        <TouchableOpacity
          style={[
            styles.statusButton,
            isOnline ? styles.onlineButton : styles.offlineButton,
          ]}
          onPress={toggleOnlineStatus}
        >
          <View style={styles.statusContent}>
            <View
              style={[
                styles.statusIndicator,
                isOnline ? styles.onlineIndicator : styles.offlineIndicator,
              ]}
            />
            <Text style={styles.statusText}>
              {isOnline ? 'متاح للطلبات' : 'غير متاح'}
            </Text>
          </View>
          <Text style={styles.statusAction}>
            {isOnline ? 'اضغط لإيقاف العمل' : 'اضغط لبدء العمل'}
          </Text>
        </TouchableOpacity>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Feather name="truck" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.statNumber}>{stats.todayOrders}</Text>
              <Text style={styles.statLabel}>طلبات اليوم</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Feather name="check-circle" size={24} color="#10B981" />
              </View>
              <Text style={styles.statNumber}>{stats.todayEarnings} جنيه</Text>
              <Text style={styles.statLabel}>أرباح اليوم</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Feather name="clock" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.statNumber}>{stats.onlineHours} ساعة</Text>
              <Text style={styles.statLabel}>ساعات العمل</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Feather name="map-pin" size={24} color="#EF4444" />
              </View>
              <Text style={styles.statNumber}>⭐ {stats.rating}</Text>
              <Text style={styles.statLabel}>التقييم</Text>
            </View>
          </View>
        </View>

        {/* Current Order (if any) */}
        {isOnline && (
          <View style={styles.currentOrder}>
            <Text style={styles.currentOrderTitle}>الطلب الحالي</Text>
            <View style={styles.orderCard}>
              <Text style={styles.orderText}>لا توجد طلبات حالياً</Text>
              <Text style={styles.orderSubtext}>
                ستصلك إشعارات عند وجود طلبات جديدة
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
  },
  statusButton: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  onlineButton: {
    backgroundColor: '#10B981',
  },
  offlineButton: {
    backgroundColor: '#EF4444',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  onlineIndicator: {
    backgroundColor: '#FFFFFF',
  },
  offlineIndicator: {
    backgroundColor: '#FFFFFF',
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusAction: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flex: 0.48,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statIcon: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  currentOrder: {
    marginTop: 8,
  },
  currentOrderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'right',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  orderSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});