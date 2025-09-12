import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface EarningsData {
  today: number;
  thisWeek: number;
  thisMonth: number;
  totalOrders: number;
  averagePerOrder: number;
  bonus: number;
}

const mockEarnings: EarningsData = {
  today: 240,
  thisWeek: 1680,
  thisMonth: 6720,
  totalOrders: 156,
  averagePerOrder: 43,
  bonus: 120,
};

export default function EarningsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [earnings] = useState<EarningsData>(mockEarnings);

  const getPeriodEarnings = () => {
    switch (selectedPeriod) {
      case 'today':
        return earnings.today;
      case 'week':
        return earnings.thisWeek;
      case 'month':
        return earnings.thisMonth;
      default:
        return earnings.today;
    }
  };

  const getPeriodText = () => {
    switch (selectedPeriod) {
      case 'today':
        return 'اليوم';
      case 'week':
        return 'هذا الأسبوع';
      case 'month':
        return 'هذا الشهر';
      default:
        return 'اليوم';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>الأرباح</Text>
          <Text style={styles.headerSubtitle}>
            تتبع أرباحك ومكافآتك
          </Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'today' && styles.activePeriodButton,
            ]}
            onPress={() => setSelectedPeriod('today')}
          >
            <Text
              style={[
                styles.periodText,
                selectedPeriod === 'today' && styles.activePeriodText,
              ]}
            >
              اليوم
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'week' && styles.activePeriodButton,
            ]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text
              style={[
                styles.periodText,
                selectedPeriod === 'week' && styles.activePeriodText,
              ]}
            >
              الأسبوع
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'month' && styles.activePeriodButton,
            ]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text
              style={[
                styles.periodText,
                selectedPeriod === 'month' && styles.activePeriodText,
              ]}
            >
              الشهر
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Earnings Card */}
        <View style={styles.mainEarningsCard}>
          <View style={styles.earningsIcon}>
            <Feather name="dollar-sign" size={32} color="#10B981" />
          </View>
          <Text style={styles.earningsAmount}>
            {getPeriodEarnings()} جنيه
          </Text>
          <Text style={styles.earningsPeriod}>
            إجمالي الأرباح {getPeriodText()}
          </Text>
          <View style={styles.trendContainer}>
            <Feather name="trending-up" size={16} color="#10B981" />
            <Text style={styles.trendText}>+12% من الفترة السابقة</Text>
          </View>
        </View>

        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Feather name="calendar" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.statNumber}>{earnings.totalOrders}</Text>
              <Text style={styles.statLabel}>إجمالي الطلبات</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Feather name="dollar-sign" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.statNumber}>{earnings.averagePerOrder} جنيه</Text>
              <Text style={styles.statLabel}>متوسط الطلب</Text>
            </View>
          </View>

          <View style={styles.bonusCard}>
            <View style={styles.bonusHeader}>
              <Feather name="award" size={24} color="#8B5CF6" />
              <Text style={styles.bonusTitle}>المكافآت الإضافية</Text>
            </View>
            <Text style={styles.bonusAmount}>{earnings.bonus} جنيه</Text>
            <Text style={styles.bonusDescription}>
              مكافآت التقييم العالي والسرعة في التوصيل
            </Text>
          </View>
        </View>

        {/* Earnings Breakdown */}
        <View style={styles.breakdownContainer}>
          <Text style={styles.breakdownTitle}>تفاصيل الأرباح</Text>
          
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>أرباح التوصيل</Text>
              <Text style={styles.breakdownValue}>
                {Math.floor(getPeriodEarnings() * 0.8)} جنيه
              </Text>
            </View>
            
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>مكافآت الأداء</Text>
              <Text style={styles.breakdownValue}>
                {Math.floor(getPeriodEarnings() * 0.15)} جنيه
              </Text>
            </View>
            
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>إكراميات العملاء</Text>
              <Text style={styles.breakdownValue}>
                {Math.floor(getPeriodEarnings() * 0.05)} جنيه
              </Text>
            </View>
            
            <View style={styles.breakdownDivider} />
            
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownTotalLabel}>الإجمالي</Text>
              <Text style={styles.breakdownTotalValue}>
                {getPeriodEarnings()} جنيه
              </Text>
            </View>
          </View>
        </View>

        {/* Cash Out Button */}
        <TouchableOpacity style={styles.cashOutButton}>
          <Text style={styles.cashOutText}>سحب الأرباح</Text>
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activePeriodButton: {
    backgroundColor: '#3B82F6',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activePeriodText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  mainEarningsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  earningsIcon: {
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  earningsAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  earningsPeriod: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 14,
    color: '#10B981',
    marginLeft: 6,
    fontWeight: '500',
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
  statIconContainer: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  bonusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bonusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bonusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  bonusAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  bonusDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  breakdownContainer: {
    marginBottom: 24,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'right',
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  breakdownTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  breakdownTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10B981',
  },
  cashOutButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cashOutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});