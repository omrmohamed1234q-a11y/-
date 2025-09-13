/**
 * شاشة التحميل - عرض بسيط أثناء تهيئة التطبيق
 */

import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ActivityIndicator,
  Dimensions 
} from 'react-native';

const { width } = Dimensions.get('window');

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* لوجو التطبيق */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>🚚</Text>
          <Text style={styles.appName}>اطبعلي - كابتن</Text>
        </View>

        {/* مؤشر التحميل */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>

        {/* معلومات الإصدار */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>الإصدار 1.0.0</Text>
          <Text style={styles.copyrightText}>© 2025 اطبعلي</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoText: {
    fontSize: 64,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  loadingText: {
    fontSize: 16,
    color: 'white',
    marginTop: 16,
    textAlign: 'center',
  },
  versionContainer: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 50,
  },
  versionText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  copyrightText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

export default LoadingScreen;