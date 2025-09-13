/**
 * شاشة الملف الشخصي للكابتن
 * تتيح عرض وتحديث البيانات الشخصية والمهنية
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Platform,
  SafeAreaView,
  RefreshControl,
  Dimensions
} from 'react-native';

// Types
import type { 
  CaptainType, 
  DailyStatsType,
  ApiResponse 
} from '../types/index';

// Services
import captainService from '../services/captainService.js';
import apiService from '../services/apiService.js';

const { width, height } = Dimensions.get('window');

interface ProfileScreenProps {
  navigation: any;
  route: any;
}

export default function ProfileScreen({ navigation, route }: ProfileScreenProps) {
  // State management
  const [captain, setCaptain] = useState<CaptainType | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStatsType>({
    orders: 0,
    earnings: 0,
    distance: 0,
    onlineTime: 0,
    completedOrders: 0,
    rating: 4.8,
    totalDeliveries: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Form state
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    vehicleType: '',
    vehicleNumber: ''
  });

  /**
   * تحميل البيانات عند فتح الشاشة
   */
  useEffect(() => {
    loadProfileData();
  }, []);

  /**
   * تحميل بيانات الملف الشخصي
   */
  const loadProfileData = async () => {
    try {
      console.log('📋 Loading profile data...');
      setIsLoading(true);

      // جلب بيانات الكابتن من الخدمة
      const captainState = captainService.getState();
      if (captainState.captain) {
        setCaptain(captainState.captain);
        setEditForm({
          name: captainState.captain.name || '',
          phone: captainState.captain.phone || '',
          email: captainState.captain.email || '',
          vehicleType: captainState.captain.vehicleType || '',
          vehicleNumber: captainState.captain.vehicleNumber || ''
        });
      }

      // جلب الإحصائيات اليومية
      if (captainState.captain?.id) {
        await loadDailyStats(captainState.captain.id);
      }

      console.log('✅ Profile data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load profile data:', error);
      Alert.alert('خطأ', 'فشل في تحميل بيانات الملف الشخصي');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * تحميل الإحصائيات اليومية
   */
  const loadDailyStats = async (captainId: string) => {
    try {
      const statsResponse = await apiService.getCaptainStats(captainId);
      if (statsResponse.success && statsResponse.stats) {
        setDailyStats(prev => ({
          ...prev,
          ...statsResponse.stats,
          rating: captain?.rating || prev.rating,
          totalDeliveries: captain?.totalDeliveries || prev.totalDeliveries
        }));
      }
    } catch (error) {
      console.error('❌ Failed to load daily stats:', error);
    }
  };

  /**
   * تحديث البيانات الشخصية
   */
  const updateProfile = async () => {
    if (!captain?.id) {
      Alert.alert('خطأ', 'لا يوجد معرف للكابتن');
      return;
    }

    // التحقق من البيانات المطلوبة
    if (!editForm.name.trim() || !editForm.phone.trim()) {
      Alert.alert('خطأ', 'الاسم ورقم الهاتف مطلوبان');
      return;
    }

    try {
      setIsLoading(true);
      console.log('💾 Updating profile data...');

      const updateData = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim(),
        vehicleType: editForm.vehicleType.trim(),
        vehicleNumber: editForm.vehicleNumber.trim()
      };

      const result = await captainService.updateProfile(captain.id, updateData);
      
      if (result.success) {
        // تحديث البيانات المحلية
        const updatedCaptain = { ...captain, ...updateData };
        setCaptain(updatedCaptain);
        setIsEditing(false);
        
        Alert.alert('تم بنجاح', 'تم تحديث البيانات الشخصية بنجاح');
        console.log('✅ Profile updated successfully');
      } else {
        Alert.alert('خطأ', result.error || 'فشل في تحديث البيانات');
      }
    } catch (error) {
      console.error('❌ Failed to update profile:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث البيانات');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * إلغاء التحرير
   */
  const cancelEdit = () => {
    if (captain) {
      setEditForm({
        name: captain.name || '',
        phone: captain.phone || '',
        email: captain.email || '',
        vehicleType: captain.vehicleType || '',
        vehicleNumber: captain.vehicleNumber || ''
      });
    }
    setIsEditing(false);
  };

  /**
   * تحديث البيانات
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  /**
   * تنسيق الوقت
   */
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} ساعة و ${mins} دقيقة`;
    }
    return `${mins} دقيقة`;
  };

  /**
   * حساب معدل الكسب في الساعة
   */
  const getHourlyRate = (): string => {
    if (dailyStats.onlineTime > 0) {
      const hourlyRate = (dailyStats.earnings / (dailyStats.onlineTime / 60));
      return `${hourlyRate.toFixed(1)} جنيه/ساعة`;
    }
    return 'غير متاح';
  };

  if (isLoading && !captain) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>جاري تحميل الملف الشخصي...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* عنوان الشاشة */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← العودة</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>الملف الشخصي</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Text style={styles.editButtonText}>
              {isEditing ? 'إلغاء' : '✏️ تحرير'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* صورة الملف الشخصي ومعلومات أساسية */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {captain?.name?.charAt(0)?.toUpperCase() || 'ك'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.captainName}>{captain?.name || 'اسم الكابتن'}</Text>
          <Text style={styles.captainId}>معرف: {captain?.username || captain?.id}</Text>
          
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>⭐ {captain?.rating?.toFixed(1) || '4.8'}</Text>
            <Text style={styles.deliveriesText}>
              {captain?.totalDeliveries || 0} توصيلة
            </Text>
          </View>
        </View>

        {/* إحصائيات اليوم */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>إحصائيات اليوم</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{dailyStats.orders}</Text>
              <Text style={styles.statLabel}>طلبات</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{dailyStats.earnings.toFixed(0)}</Text>
              <Text style={styles.statLabel}>جنيه</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{dailyStats.distance.toFixed(1)}</Text>
              <Text style={styles.statLabel}>كم</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{formatTime(dailyStats.onlineTime)}</Text>
              <Text style={styles.statLabel}>متصل</Text>
            </View>
          </View>
          
          <View style={styles.additionalStats}>
            <Text style={styles.hourlyRate}>معدل الكسب: {getHourlyRate()}</Text>
          </View>
        </View>

        {/* البيانات الشخصية */}
        <View style={styles.personalInfo}>
          <Text style={styles.sectionTitle}>البيانات الشخصية</Text>
          
          {isEditing ? (
            <View style={styles.editForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>الاسم *</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.name}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
                  placeholder="أدخل اسمك الكامل"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>رقم الهاتف *</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.phone}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
                  placeholder="أدخل رقم الهاتف"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.email}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
                  placeholder="أدخل البريد الإلكتروني"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>نوع المركبة</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.vehicleType}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, vehicleType: text }))}
                  placeholder="مثال: دراجة نارية، سيارة"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>رقم اللوحة</Text>
                <TextInput
                  style={styles.textInput}
                  value={editForm.vehicleNumber}
                  onChangeText={(text) => setEditForm(prev => ({ ...prev, vehicleNumber: text }))}
                  placeholder="أدخل رقم لوحة المركبة"
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.saveButton]}
                  onPress={updateProfile}
                  disabled={isLoading}
                >
                  <Text style={styles.saveButtonText}>
                    {isLoading ? 'جاري الحفظ...' : '💾 حفظ التغييرات'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.cancelButton]}
                  onPress={cancelEdit}
                >
                  <Text style={styles.cancelButtonText}>❌ إلغاء</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.infoDisplay}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>الاسم:</Text>
                <Text style={styles.infoValue}>{captain?.name || 'غير محدد'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>الهاتف:</Text>
                <Text style={styles.infoValue}>{captain?.phone || 'غير محدد'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>البريد:</Text>
                <Text style={styles.infoValue}>{captain?.email || 'غير محدد'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>المركبة:</Text>
                <Text style={styles.infoValue}>{captain?.vehicleType || 'غير محدد'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>اللوحة:</Text>
                <Text style={styles.infoValue}>{captain?.vehicleNumber || 'غير محدد'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>تاريخ الانضمام:</Text>
                <Text style={styles.infoValue}>
                  {captain?.joinDate ? new Date(captain.joinDate).toLocaleDateString('ar') : 'غير متاح'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* أزرار الإجراءات السريعة */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
          
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('settings')}
            data-testid="button-settings"
          >
            <Text style={styles.actionIcon}>⚙️</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>إعدادات التطبيق</Text>
              <Text style={styles.actionSubtitle}>تخصيص التطبيق والتفضيلات</Text>
            </View>
            <Text style={styles.actionArrow}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('order-history')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>سجل الطلبات</Text>
              <Text style={styles.actionSubtitle}>عرض تاريخ الطلبات المكتملة</Text>
            </View>
            <Text style={styles.actionArrow}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('earnings-report')}
          >
            <Text style={styles.actionIcon}>💰</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>تقرير الأرباح</Text>
              <Text style={styles.actionSubtitle}>تفاصيل الأرباح والمدفوعات</Text>
            </View>
            <Text style={styles.actionArrow}>←</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  scrollView: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB'
  },
  backButton: {
    padding: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 8
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827'
  },
  editButton: {
    padding: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 8
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  profileHeader: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    padding: 24,
    marginVertical: 8
  },
  avatarContainer: {
    marginBottom: 16
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  captainName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4
  },
  captainId: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F59E0B'
  },
  deliveriesText: {
    fontSize: 14,
    color: '#6B7280'
  },
  statsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'right',
    marginBottom: 16
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8
  },
  statCard: {
    backgroundColor: '#F9FAFB',
    width: (width - 64) / 2,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280'
  },
  additionalStats: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center'
  },
  hourlyRate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669'
  },
  personalInfo: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12
  },
  editForm: {
    gap: 16
  },
  inputGroup: {
    gap: 8
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'right'
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'right'
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  saveButton: {
    backgroundColor: '#10B981'
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  cancelButton: {
    backgroundColor: '#E5E7EB'
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151'
  },
  infoDisplay: {
    gap: 16
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280'
  },
  infoValue: {
    fontSize: 14,
    color: '#111827'
  },
  quickActions: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 12
  },
  actionContent: {
    flex: 1
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
    marginBottom: 2
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right'
  },
  actionArrow: {
    fontSize: 16,
    color: '#9CA3AF',
    marginLeft: 8
  }
});