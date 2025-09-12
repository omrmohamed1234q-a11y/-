import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface CaptainProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  vehicleType: string;
  vehiclePlate: string;
  rating: number;
  totalDeliveries: number;
  joinDate: string;
  avatar?: string;
}

const mockProfile: CaptainProfile = {
  id: 'CAPT001',
  name: 'محمد أحمد علي',
  phone: '+201234567890',
  email: 'mohammed.ahmed@example.com',
  vehicleType: 'دراجة نارية',
  vehiclePlate: 'أ ب ج 1234',
  rating: 4.8,
  totalDeliveries: 156,
  joinDate: '2023-01-15',
};

export default function ProfileScreen() {
  const [profile] = useState<CaptainProfile>(mockProfile);

  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل أنت متأكد من أنك تريد تسجيل الخروج؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'نعم', 
          onPress: () => {
            // Handle logout logic here
            console.log('Logging out...');
          },
          style: 'destructive'
        },
      ]
    );
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Text key={i} style={styles.star}>⭐</Text>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Text key="half" style={styles.star}>⭐</Text>
      );
    }

    return stars;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>الملف الشخصي</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {profile.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Feather name="user" size={40} color="#FFFFFF" />
              </View>
            )}
          </View>

          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileId}>كود الكابتن: {profile.id}</Text>

          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(profile.rating)}
            </View>
            <Text style={styles.ratingText}>
              {profile.rating} ({profile.totalDeliveries} تقييم)
            </Text>
          </View>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>إحصائيات الأداء</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Feather name="truck" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.statNumber}>{profile.totalDeliveries}</Text>
              <Text style={styles.statLabel}>إجمالي التوصيلات</Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Feather name="star" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.statNumber}>{profile.rating}</Text>
              <Text style={styles.statLabel}>التقييم</Text>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Feather name="calendar" size={20} color="#10B981" />
              </View>
              <Text style={styles.statNumber}>
                {new Date().getFullYear() - new Date(profile.joinDate).getFullYear()}+
              </Text>
              <Text style={styles.statLabel}>سنوات الخبرة</Text>
            </View>
          </View>
        </View>

        {/* Information Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>معلومات الحساب</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Feather name="phone" size={20} color="#6B7280" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>رقم الهاتف</Text>
              <Text style={styles.infoValue}>{profile.phone}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Feather name="user" size={20} color="#6B7280" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>البريد الإلكتروني</Text>
              <Text style={styles.infoValue}>{profile.email}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Feather name="truck" size={20} color="#6B7280" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>نوع المركبة</Text>
              <Text style={styles.infoValue}>{profile.vehicleType}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Feather name="map-pin" size={20} color="#6B7280" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>رقم اللوحة</Text>
              <Text style={styles.infoValue}>{profile.vehiclePlate}</Text>
            </View>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Feather name="settings" size={20} color="#6B7280" />
            </View>
            <Text style={styles.menuText}>الإعدادات</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuIcon}>
              <Feather name="help-circle" size={20} color="#6B7280" />
            </View>
            <Text style={styles.menuText}>المساعدة والدعم</Text>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <View style={styles.menuIcon}>
              <Feather name="log-out" size={20} color="#EF4444" />
            </View>
            <Text style={[styles.menuText, styles.logoutText]}>تسجيل الخروج</Text>
          </TouchableOpacity>
        </View>
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
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  star: {
    fontSize: 16,
    marginHorizontal: 1,
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 8,
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
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'right',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoIcon: {
    marginLeft: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIcon: {
    marginLeft: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  logoutText: {
    color: '#EF4444',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 48,
  },
});