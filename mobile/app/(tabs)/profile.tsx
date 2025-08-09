import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../../context/AuthContext'

export default function ProfileScreen() {
  const { user, signOut } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [email, setEmail] = useState(user?.email || '')

  const handleSave = () => {
    // Here you would typically update the user profile
    console.log('Saving profile:', { fullName, email })
    setIsEditing(false)
    Alert.alert('تم الحفظ', 'تم تحديث الملف الشخصي بنجاح')
  }

  const handleSignOut = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'خروج', style: 'destructive', onPress: signOut },
      ]
    )
  }

  const menuItems = [
    {
      id: 1,
      title: 'طلبات الطباعة',
      subtitle: 'عرض جميع طلبات الطباعة',
      icon: '🖨️',
      action: () => console.log('Print orders'),
    },
    {
      id: 2,
      title: 'طلبات المتجر',
      subtitle: 'عرض مشترياتك من المتجر',
      icon: '🛍️',
      action: () => console.log('Store orders'),
    },
    {
      id: 3,
      title: 'المحفظة والدفع',
      subtitle: 'إدارة طرق الدفع والرصيد',
      icon: '💳',
      action: () => console.log('Wallet'),
    },
    {
      id: 4,
      title: 'الإعدادات',
      subtitle: 'إعدادات التطبيق والإشعارات',
      icon: '⚙️',
      action: () => console.log('Settings'),
    },
    {
      id: 5,
      title: 'المساعدة والدعم',
      subtitle: 'الحصول على المساعدة',
      icon: '❓',
      action: () => console.log('Help'),
    },
    {
      id: 6,
      title: 'حول التطبيق',
      subtitle: 'معلومات عن اطبعلي',
      icon: 'ℹ️',
      action: () => console.log('About'),
    },
  ]

  const stats = [
    { label: 'طلبات الطباعة', value: '24', color: '#EF2D50' },
    { label: 'المشتريات', value: '5', color: '#3B82F6' },
    { label: 'النقاط', value: '150', color: '#10B981' },
    { label: 'التوفير', value: '45 ريال', color: '#F59E0B' },
  ]

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={['#EF2D50', '#DC2626']} style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          
          {isEditing ? (
            <View style={styles.editForm}>
              <TextInput
                style={styles.editInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="الاسم الكامل"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                textAlign="right"
              />
              <TextInput
                style={styles.editInput}
                value={email}
                onChangeText={setEmail}
                placeholder="البريد الإلكتروني"
                placeholderTextColor="rgba(255, 255, 255, 0.7)"
                keyboardType="email-address"
                textAlign="right"
              />
              <View style={styles.editButtons}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>حفظ</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={styles.cancelButtonText}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.full_name || 'مستخدم عزيز'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.editButtonText}>تعديل الملف الشخصي</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>إحصائياتك</Text>
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الإعدادات والخيارات</Text>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.id} style={styles.menuItem} onPress={item.action}>
            <View style={styles.menuIcon}>
              <Text style={styles.menuIconText}>{item.icon}</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.menuArrow}>{'<'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.appInfo}>اطبعلي v1.0.0</Text>
        <Text style={styles.appInfo}>طباعة ذكية وسهلة</Text>
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
  profileInfo: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 16,
    textAlign: 'center',
  },
  editButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  editForm: {
    width: '100%',
    alignItems: 'center',
  },
  editInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    width: '100%',
    textAlign: 'right',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: '#EF2D50',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
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
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  menuItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  menuIconText: {
    fontSize: 18,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
    textAlign: 'right',
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'right',
  },
  menuArrow: {
    fontSize: 16,
    color: '#9CA3AF',
    transform: [{ rotate: '180deg' }],
  },
  signOutButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF2D50',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF2D50',
  },
  appInfo: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 4,
  },
  bottomSpacer: {
    height: 20,
  },
})