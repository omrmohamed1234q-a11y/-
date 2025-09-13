/**
 * شاشة إعدادات التطبيق
 * تتيح تخصيص إعدادات التطبيق والتفضيلات الشخصية
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  SafeAreaView,
  Linking,
  Platform
} from 'react-native';

// Types
import type { CaptainType } from '../types/index';

// Services
import captainService from '../services/captainService.js';

interface SettingsScreenProps {
  navigation: any;
  route: any;
}

interface AppSettings {
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
    newOrders: boolean;
    orderUpdates: boolean;
    systemAlerts: boolean;
  };
  location: {
    highAccuracy: boolean;
    backgroundTracking: boolean;
    shareLocation: boolean;
  };
  app: {
    language: 'ar' | 'en';
    theme: 'light' | 'dark' | 'auto';
    autoLogout: boolean;
    keepScreenOn: boolean;
  };
  privacy: {
    analytics: boolean;
    crashReports: boolean;
    dataSharing: boolean;
  };
}

export default function SettingsScreen({ navigation, route }: SettingsScreenProps) {
  // State management
  const [captain, setCaptain] = useState<CaptainType | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    notifications: {
      enabled: true,
      sound: true,
      vibration: true,
      newOrders: true,
      orderUpdates: true,
      systemAlerts: true
    },
    location: {
      highAccuracy: true,
      backgroundTracking: true,
      shareLocation: true
    },
    app: {
      language: 'ar',
      theme: 'light',
      autoLogout: false,
      keepScreenOn: false
    },
    privacy: {
      analytics: true,
      crashReports: true,
      dataSharing: false
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  /**
   * تحميل البيانات عند فتح الشاشة
   */
  useEffect(() => {
    loadSettingsData();
  }, []);

  /**
   * تحميل بيانات الإعدادات
   */
  const loadSettingsData = async () => {
    try {
      console.log('⚙️ Loading settings data...');

      // جلب بيانات الكابتن
      const captainState = captainService.getState();
      if (captainState.captain) {
        setCaptain(captainState.captain);
      }

      // تحميل الإعدادات المحفوظة
      const savedSettings = await captainService.getSettings();
      if (savedSettings) {
        setSettings(prevSettings => ({
          ...prevSettings,
          ...savedSettings
        }));
      }

      console.log('✅ Settings data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load settings:', error);
    }
  };

  /**
   * حفظ الإعدادات
   */
  const saveSettings = async (newSettings: AppSettings) => {
    try {
      setIsLoading(true);
      await captainService.saveSettings(newSettings);
      console.log('✅ Settings saved successfully');
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      Alert.alert('خطأ', 'فشل في حفظ الإعدادات');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * تحديث إعداد محدد
   */
  const updateSetting = async (category: keyof AppSettings, key: string, value: any) => {
    const newSettings = {
      ...settings,
      [category]: {
        ...settings[category],
        [key]: value
      }
    };
    
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  /**
   * إعادة تعيين الإعدادات
   */
  const resetSettings = () => {
    Alert.alert(
      'إعادة تعيين الإعدادات',
      'هل تريد إعادة جميع الإعدادات إلى القيم الافتراضية؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إعادة تعيين',
          style: 'destructive',
          onPress: async () => {
            const defaultSettings: AppSettings = {
              notifications: {
                enabled: true,
                sound: true,
                vibration: true,
                newOrders: true,
                orderUpdates: true,
                systemAlerts: true
              },
              location: {
                highAccuracy: true,
                backgroundTracking: true,
                shareLocation: true
              },
              app: {
                language: 'ar',
                theme: 'light',
                autoLogout: false,
                keepScreenOn: false
              },
              privacy: {
                analytics: true,
                crashReports: true,
                dataSharing: false
              }
            };
            
            setSettings(defaultSettings);
            await saveSettings(defaultSettings);
            Alert.alert('تم', 'تم إعادة تعيين الإعدادات بنجاح');
          }
        }
      ]
    );
  };

  /**
   * تسجيل الخروج
   */
  const handleLogout = () => {
    Alert.alert(
      'تسجيل الخروج',
      'هل تريد تسجيل الخروج من التطبيق؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تسجيل خروج',
          style: 'destructive',
          onPress: async () => {
            try {
              await captainService.logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'login' }]
              });
            } catch (error) {
              console.error('❌ Logout error:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الخروج');
            }
          }
        }
      ]
    );
  };

  /**
   * فتح رابط خارجي
   */
  const openExternalLink = (url: string) => {
    Linking.openURL(url).catch(err => {
      console.error('❌ Failed to open URL:', err);
      Alert.alert('خطأ', 'فشل في فتح الرابط');
    });
  };

  /**
   * مكون التبديل
   */
  const SettingsToggle = ({ 
    title, 
    subtitle, 
    value, 
    onValueChange, 
    icon 
  }: {
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    icon: string;
  }) => (
    <View style={styles.settingsRow}>
      <View style={styles.settingsContent}>
        <Text style={styles.settingsIcon}>{icon}</Text>
        <View style={styles.settingsTextContainer}>
          <Text style={styles.settingsTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.settingsSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
        thumbColor={value ? '#FFFFFF' : '#FFFFFF'}
      />
    </View>
  );

  /**
   * مكون الإجراء
   */
  const SettingsAction = ({ 
    title, 
    subtitle, 
    onPress, 
    icon, 
    color = '#111827' 
  }: {
    title: string;
    subtitle?: string;
    onPress: () => void;
    icon: string;
    color?: string;
  }) => (
    <TouchableOpacity style={styles.settingsRow} onPress={onPress}>
      <View style={styles.settingsContent}>
        <Text style={styles.settingsIcon}>{icon}</Text>
        <View style={styles.settingsTextContainer}>
          <Text style={[styles.settingsTitle, { color }]}>{title}</Text>
          {subtitle && (
            <Text style={styles.settingsSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      <Text style={styles.actionArrow}>←</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* عنوان الشاشة */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← العودة</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>الإعدادات</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* معلومات الكابتن */}
        <View style={styles.captainInfo}>
          <Text style={styles.captainName}>{captain?.name || 'اسم الكابتن'}</Text>
          <Text style={styles.captainDetails}>
            {captain?.vehicleType || 'نوع المركبة'} • {captain?.vehicleNumber || 'رقم اللوحة'}
          </Text>
        </View>

        {/* إعدادات الإشعارات */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>🔔 الإشعارات</Text>
          
          <SettingsToggle
            title="تفعيل الإشعارات"
            subtitle="تلقي إشعارات الطلبات والتحديثات"
            value={settings.notifications.enabled}
            onValueChange={(value) => updateSetting('notifications', 'enabled', value)}
            icon="📢"
          />
          
          <SettingsToggle
            title="صوت الإشعارات"
            subtitle="تشغيل صوت عند وصول إشعار"
            value={settings.notifications.sound}
            onValueChange={(value) => updateSetting('notifications', 'sound', value)}
            icon="🔊"
          />
          
          <SettingsToggle
            title="الاهتزاز"
            subtitle="اهتزاز الجهاز مع الإشعارات"
            value={settings.notifications.vibration}
            onValueChange={(value) => updateSetting('notifications', 'vibration', value)}
            icon="📳"
          />
          
          <SettingsToggle
            title="إشعارات الطلبات الجديدة"
            subtitle="تنبيه عند وصول طلب جديد"
            value={settings.notifications.newOrders}
            onValueChange={(value) => updateSetting('notifications', 'newOrders', value)}
            icon="🆕"
          />
        </View>

        {/* إعدادات الموقع */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>📍 الموقع والملاحة</Text>
          
          <SettingsToggle
            title="دقة عالية للموقع"
            subtitle="استخدام GPS للحصول على موقع دقيق"
            value={settings.location.highAccuracy}
            onValueChange={(value) => updateSetting('location', 'highAccuracy', value)}
            icon="🎯"
          />
          
          <SettingsToggle
            title="تتبع الموقع في الخلفية"
            subtitle="مواصلة تتبع الموقع حتى عند إغلاق التطبيق"
            value={settings.location.backgroundTracking}
            onValueChange={(value) => updateSetting('location', 'backgroundTracking', value)}
            icon="📲"
          />
          
          <SettingsToggle
            title="مشاركة الموقع"
            subtitle="مشاركة موقعك مع العملاء أثناء التوصيل"
            value={settings.location.shareLocation}
            onValueChange={(value) => updateSetting('location', 'shareLocation', value)}
            icon="📤"
          />
        </View>

        {/* إعدادات التطبيق */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>⚙️ إعدادات التطبيق</Text>
          
          <SettingsToggle
            title="إبقاء الشاشة مضيئة"
            subtitle="منع إغلاق الشاشة أثناء التوصيل"
            value={settings.app.keepScreenOn}
            onValueChange={(value) => updateSetting('app', 'keepScreenOn', value)}
            icon="💡"
          />
          
          <SettingsToggle
            title="تسجيل خروج تلقائي"
            subtitle="تسجيل خروج بعد فترة عدم نشاط"
            value={settings.app.autoLogout}
            onValueChange={(value) => updateSetting('app', 'autoLogout', value)}
            icon="⏰"
          />
        </View>

        {/* إعدادات الخصوصية */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>🔒 الخصوصية والبيانات</Text>
          
          <SettingsToggle
            title="تحليلات الاستخدام"
            subtitle="مساعدة في تحسين التطبيق"
            value={settings.privacy.analytics}
            onValueChange={(value) => updateSetting('privacy', 'analytics', value)}
            icon="📊"
          />
          
          <SettingsToggle
            title="تقارير الأخطاء"
            subtitle="إرسال تقارير الأخطاء تلقائياً"
            value={settings.privacy.crashReports}
            onValueChange={(value) => updateSetting('privacy', 'crashReports', value)}
            icon="🐛"
          />
        </View>

        {/* المساعدة والدعم */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>❓ المساعدة والدعم</Text>
          
          <SettingsAction
            title="دليل الاستخدام"
            subtitle="تعلم كيفية استخدام التطبيق"
            onPress={() => openExternalLink('https://help.example.com')}
            icon="📖"
          />
          
          <SettingsAction
            title="اتصل بالدعم الفني"
            subtitle="تواصل مع فريق الدعم"
            onPress={() => openExternalLink('tel:+201234567890')}
            icon="📞"
          />
          
          <SettingsAction
            title="أبلغ عن مشكلة"
            subtitle="أرسل تقريراً عن مشكلة في التطبيق"
            onPress={() => openExternalLink('mailto:support@example.com')}
            icon="🚨"
          />
          
          <SettingsAction
            title="تقييم التطبيق"
            subtitle="شاركنا رأيك في متجر التطبيقات"
            onPress={() => {
              const storeUrl = Platform.OS === 'ios' 
                ? 'https://apps.apple.com/app/id123456789'
                : 'https://play.google.com/store/apps/details?id=com.example.app';
              openExternalLink(storeUrl);
            }}
            icon="⭐"
          />
        </View>

        {/* معلومات التطبيق */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>ℹ️ معلومات التطبيق</Text>
          
          <SettingsAction
            title="الشروط والأحكام"
            subtitle="قراءة شروط الاستخدام"
            onPress={() => openExternalLink('https://example.com/terms')}
            icon="📋"
          />
          
          <SettingsAction
            title="سياسة الخصوصية"
            subtitle="كيف نحمي بياناتك"
            onPress={() => openExternalLink('https://example.com/privacy')}
            icon="🛡️"
          />
          
          <View style={styles.versionInfo}>
            <Text style={styles.versionText}>إصدار التطبيق: 1.0.0</Text>
            <Text style={styles.versionText}>آخر تحديث: {new Date().toLocaleDateString('ar')}</Text>
          </View>
        </View>

        {/* إجراءات خطيرة */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>⚠️ إجراءات النظام</Text>
          
          <SettingsAction
            title="إعادة تعيين الإعدادات"
            subtitle="إعادة جميع الإعدادات للقيم الافتراضية"
            onPress={resetSettings}
            icon="🔄"
            color="#F59E0B"
          />
          
          <SettingsAction
            title="تسجيل الخروج"
            subtitle="تسجيل خروج من الحساب"
            onPress={handleLogout}
            icon="🚪"
            color="#EF4444"
          />
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
  headerSpacer: {
    width: 60
  },
  captainInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginVertical: 8,
    alignItems: 'center'
  },
  captainName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4
  },
  captainDetails: {
    fontSize: 14,
    color: '#6B7280'
  },
  settingsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    overflow: 'hidden'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    padding: 16,
    paddingBottom: 8,
    textAlign: 'right'
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  settingsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  settingsIcon: {
    fontSize: 20,
    marginRight: 12
  },
  settingsTextContainer: {
    flex: 1
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'right',
    marginBottom: 2
  },
  settingsSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right'
  },
  actionArrow: {
    fontSize: 16,
    color: '#9CA3AF',
    marginLeft: 8
  },
  versionInfo: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    alignItems: 'center'
  },
  versionText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 2
  }
});