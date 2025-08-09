import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

export default function RewardsScreen() {
  const userPoints = 150
  const userLevel = 2

  const rewards = [
    {
      id: 1,
      title: 'خصم 10% على الطباعة',
      points: 50,
      description: 'احصل على خصم 10% على أي طلب طباعة',
      icon: '🖨️',
      available: true,
    },
    {
      id: 2,
      title: 'شحن مجاني',
      points: 100,
      description: 'شحن مجاني لطلبك القادم من المتجر',
      icon: '🚚',
      available: true,
    },
    {
      id: 3,
      title: 'طباعة ملونة مجانية',
      points: 200,
      description: '10 صفحات طباعة ملونة مجانية',
      icon: '🎨',
      available: false,
    },
    {
      id: 4,
      title: 'كتاب مجاني',
      points: 300,
      description: 'اختر أي كتاب من المتجر مجاناً',
      icon: '📚',
      available: false,
    },
  ]

  const challenges = [
    {
      id: 1,
      title: 'اطبع 5 مستندات',
      progress: 3,
      total: 5,
      reward: 25,
      description: 'اطبع 5 مستندات هذا الأسبوع',
    },
    {
      id: 2,
      title: 'اشتر من المتجر',
      progress: 1,
      total: 3,
      reward: 50,
      description: 'قم بشراء 3 منتجات من المتجر',
    },
    {
      id: 3,
      title: 'استخدم المسح الذكي',
      progress: 0,
      total: 10,
      reward: 30,
      description: 'امسح 10 مستندات باستخدام الكاميرا',
    },
  ]

  const redeemReward = (rewardId: number) => {
    console.log('Redeeming reward:', rewardId)
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={['#EF2D50', '#DC2626']} style={styles.header}>
        <Text style={styles.headerTitle}>نظام المكافآت</Text>
        <Text style={styles.headerSubtitle}>اجمع النقاط واحصل على مكافآت رائعة</Text>
        
        <View style={styles.pointsCard}>
          <View style={styles.pointsInfo}>
            <Text style={styles.pointsLabel}>نقاطك الحالية</Text>
            <Text style={styles.pointsValue}>{userPoints} نقطة</Text>
          </View>
          <View style={styles.levelInfo}>
            <Text style={styles.levelLabel}>المستوى</Text>
            <Text style={styles.levelValue}>{userLevel}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Active Challenges */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>التحديات النشطة</Text>
        {challenges.map((challenge) => (
          <View key={challenge.id} style={styles.challengeCard}>
            <View style={styles.challengeHeader}>
              <Text style={styles.challengeTitle}>{challenge.title}</Text>
              <View style={styles.rewardBadge}>
                <Text style={styles.rewardBadgeText}>+{challenge.reward}</Text>
              </View>
            </View>
            <Text style={styles.challengeDescription}>{challenge.description}</Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${(challenge.progress / challenge.total) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {challenge.progress}/{challenge.total}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Available Rewards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>المكافآت المتاحة</Text>
        {rewards.map((reward) => (
          <View key={reward.id} style={styles.rewardCard}>
            <View style={styles.rewardIcon}>
              <Text style={styles.rewardIconText}>{reward.icon}</Text>
            </View>
            
            <View style={styles.rewardContent}>
              <Text style={styles.rewardTitle}>{reward.title}</Text>
              <Text style={styles.rewardDescription}>{reward.description}</Text>
              <Text style={styles.rewardPoints}>{reward.points} نقطة</Text>
            </View>
            
            <TouchableOpacity
              style={[
                styles.redeemButton,
                !reward.available && styles.disabledButton
              ]}
              onPress={() => reward.available && redeemReward(reward.id)}
              disabled={!reward.available}
            >
              <Text style={[
                styles.redeemButtonText,
                !reward.available && styles.disabledButtonText
              ]}>
                {reward.available ? 'استبدال' : 'غير متاح'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* How to Earn Points */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>كيفية كسب النقاط</Text>
        <View style={styles.earnCard}>
          <View style={styles.earnItem}>
            <Text style={styles.earnIcon}>🖨️</Text>
            <View style={styles.earnContent}>
              <Text style={styles.earnTitle}>طباعة مستند</Text>
              <Text style={styles.earnPoints}>+5 نقاط</Text>
            </View>
          </View>
          
          <View style={styles.earnItem}>
            <Text style={styles.earnIcon}>🛍️</Text>
            <View style={styles.earnContent}>
              <Text style={styles.earnTitle}>شراء من المتجر</Text>
              <Text style={styles.earnPoints}>+10 نقاط</Text>
            </View>
          </View>
          
          <View style={styles.earnItem}>
            <Text style={styles.earnIcon}>📱</Text>
            <View style={styles.earnContent}>
              <Text style={styles.earnTitle}>استخدام المسح الذكي</Text>
              <Text style={styles.earnPoints}>+3 نقاط</Text>
            </View>
          </View>
          
          <View style={styles.earnItem}>
            <Text style={styles.earnIcon}>🔄</Text>
            <View style={styles.earnContent}>
              <Text style={styles.earnTitle}>إكمال التحديات اليومية</Text>
              <Text style={styles.earnPoints}>+15-50 نقطة</Text>
            </View>
          </View>
        </View>
      </View>

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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 20,
  },
  pointsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsInfo: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 4,
    textAlign: 'right',
  },
  pointsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'right',
  },
  levelInfo: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    padding: 16,
    minWidth: 80,
  },
  levelLabel: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 4,
  },
  levelValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
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
  challengeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
  },
  rewardBadge: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rewardBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  challengeDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'right',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginLeft: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#EF2D50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 40,
    textAlign: 'center',
  },
  rewardCard: {
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
  rewardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  rewardIconText: {
    fontSize: 24,
  },
  rewardContent: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'right',
  },
  rewardDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'right',
  },
  rewardPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EF2D50',
    textAlign: 'right',
  },
  redeemButton: {
    backgroundColor: '#EF2D50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  redeemButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  disabledButtonText: {
    color: '#ffffff',
  },
  earnCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  earnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  earnIcon: {
    fontSize: 20,
    marginLeft: 16,
  },
  earnContent: {
    flex: 1,
  },
  earnTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'right',
  },
  earnPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
    textAlign: 'right',
  },
  bottomSpacer: {
    height: 20,
  },
})