import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../../context/AuthContext'

const { width } = Dimensions.get('window')

export default function HomeScreen() {
  const { user, signOut } = useAuth()

  const quickActions = [
    { id: 1, title: 'طباعة فورية', icon: '🖨️', color: '#EF2D50' },
    { id: 2, title: 'مسح ذكي', icon: '📱', color: '#3B82F6' },
    { id: 3, title: 'أدوات PDF', icon: '📄', color: '#10B981' },
    { id: 4, title: 'قوالب جاهزة', icon: '📝', color: '#F59E0B' },
  ]

  const features = [
    {
      id: 1,
      title: 'طباعة من أي مكان',
      description: 'احصل على طباعة عالية الجودة من أقرب مطبعة',
      icon: '🌍',
    },
    {
      id: 2,
      title: 'مسح ذكي بالكاميرا',
      description: 'امسح المستندات وحولها إلى PDF عالي الجودة',
      icon: '📸',
    },
    {
      id: 3,
      title: 'متجر رقمي',
      description: 'تسوق المواد التعليمية والقرطاسية',
      icon: '🛒',
    },
  ]

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={['#EF2D50', '#DC2626']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.greeting}>
            <Text style={styles.welcomeText}>أهلاً وسهلاً</Text>
            <Text style={styles.userName}>{user?.full_name || 'مستخدم عزيز'}</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
            <Text style={styles.logoutText}>خروج</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>طلب طباعة</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>150</Text>
            <Text style={styles.statLabel}>نقاط المكافآت</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>مشتريات</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.id} style={styles.actionCard}>
              <LinearGradient
                colors={[action.color, action.color + 'CC']}
                style={styles.actionGradient}
              >
                <Text style={styles.actionIcon}>{action.icon}</Text>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الميزات الرئيسية</Text>
        {features.map((feature) => (
          <TouchableOpacity key={feature.id} style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>{feature.icon}</Text>
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
            <Text style={styles.featureArrow}>{'<'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>النشاط الأخير</Text>
        <View style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>طباعة مستند - مكتمل</Text>
            <Text style={styles.activityTime}>منذ ساعتين</Text>
          </View>
          <Text style={styles.activityDescription}>
            تم طباعة 10 صفحات بجودة عالية من مطبعة الجامعة
          </Text>
        </View>
        
        <View style={styles.activityCard}>
          <View style={styles.activityHeader}>
            <Text style={styles.activityTitle}>شراء من المتجر - قيد التوصيل</Text>
            <Text style={styles.activityTime}>أمس</Text>
          </View>
          <Text style={styles.activityDescription}>
            طلب كتب دراسية وقرطاسية، متوقع الوصول غداً
          </Text>
        </View>
      </View>

      {/* Bottom Spacer */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    borderRadius: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'right',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 60) / 2,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'right',
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
    lineHeight: 20,
  },
  featureArrow: {
    fontSize: 16,
    color: '#9CA3AF',
    transform: [{ rotate: '180deg' }],
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  activityDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 20,
  },
})