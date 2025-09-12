import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Order {
  id: string;
  customerName: string;
  address: string;
  items: string[];
  total: number;
  distance: string;
  estimatedTime: string;
  status: 'available' | 'accepted' | 'picked_up' | 'delivered';
}

const mockOrders: Order[] = [
  {
    id: '1',
    customerName: 'أحمد محمد',
    address: 'شارع التحرير، المعادي، القاهرة',
    items: ['طباعة مستندات (50 صفحة)', 'تجليد'],
    total: 85,
    distance: '2.5 كم',
    estimatedTime: '15 دقيقة',
    status: 'available',
  },
  {
    id: '2',
    customerName: 'فاطمة أحمد',
    address: 'شارع النيل، الزمالك، القاهرة',
    items: ['طباعة ملونة (20 صفحة)'],
    total: 120,
    distance: '3.8 كم',
    estimatedTime: '20 دقيقة',
    status: 'available',
  },
];

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [selectedTab, setSelectedTab] = useState<'available' | 'current'>('available');

  const handleAcceptOrder = (orderId: string) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status: 'accepted' }
        : order
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#10B981';
      case 'accepted':
        return '#3B82F6';
      case 'picked_up':
        return '#F59E0B';
      case 'delivered':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'متاح';
      case 'accepted':
        return 'مقبول';
      case 'picked_up':
        return 'تم الاستلام';
      case 'delivered':
        return 'تم التوصيل';
      default:
        return 'غير محدد';
    }
  };

  const availableOrders = orders.filter(order => order.status === 'available');
  const currentOrders = orders.filter(order => order.status !== 'available' && order.status !== 'delivered');

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.orderTotal}>{item.total} جنيه</Text>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Feather name="map-pin" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{item.address}</Text>
        </View>

        <View style={styles.detailRow}>
          <Feather name="clock" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{item.distance} • {item.estimatedTime}</Text>
        </View>

        <View style={styles.itemsContainer}>
          <Text style={styles.itemsTitle}>المطلوب:</Text>
          {item.items.map((itemText, index) => (
            <Text key={index} style={styles.itemText}>• {itemText}</Text>
          ))}
        </View>
      </View>

      {item.status === 'available' && (
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptOrder(item.id)}
        >
          <Text style={styles.acceptButtonText}>قبول الطلب</Text>
        </TouchableOpacity>
      )}

      {item.status === 'accepted' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>تواصل مع العميل</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
            <Text style={[styles.actionButtonText, styles.primaryButtonText]}>
              بدء التوصيل
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الطلبات</Text>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'available' && styles.activeTab,
            ]}
            onPress={() => setSelectedTab('available')}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'available' && styles.activeTabText,
              ]}
            >
              الطلبات المتاحة ({availableOrders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'current' && styles.activeTab,
            ]}
            onPress={() => setSelectedTab('current')}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'current' && styles.activeTabText,
              ]}
            >
              الطلبات الحالية ({currentOrders.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={selectedTab === 'available' ? availableOrders : currentOrders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.ordersList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {selectedTab === 'available' 
                ? 'لا توجد طلبات متاحة حالياً' 
                : 'لا توجد طلبات حالية'
              }
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1F2937',
    fontWeight: 'bold',
  },
  ordersList: {
    padding: 20,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderTotal: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  orderDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  itemsContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  acceptButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});