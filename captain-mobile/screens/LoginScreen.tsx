/**
 * شاشة تسجيل الدخول للكابتن
 */

import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions 
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface LoginScreenProps {
  onLogin: (credentials: {username: string, password: string, driverCode?: string}) => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, connectionStatus }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [driverCode, setDriverCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setIsLoading(true);
    
    try {
      await onLogin({
        username: username.trim(),
        password: password.trim(),
        driverCode: driverCode.trim() || null
      });
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#10B981'; // أخضر
      case 'disconnected':
        return '#EF4444'; // أحمر
      default:
        return '#F59E0B'; // أصفر
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'متصل';
      case 'disconnected':
        return 'غير متصل';
      default:
        return 'جاري الاتصال...';
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* الرأس */}
        <View style={styles.header}>
          <Text style={styles.logoEmoji}>🚚</Text>
          <Text style={styles.title}>اطبعلي - كابتن</Text>
          <Text style={styles.subtitle}>سجل دخولك لبدء العمل</Text>
          
          {/* حالة الاتصال */}
          <View style={styles.connectionStatus}>
            <View 
              style={[
                styles.connectionIndicator, 
                { backgroundColor: getConnectionStatusColor() }
              ]} 
            />
            <Text style={styles.connectionText}>
              {getConnectionStatusText()}
            </Text>
          </View>
        </View>

        {/* نموذج تسجيل الدخول */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>اسم المستخدم</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="أدخل اسم المستخدم"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
              textAlign="right"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>كلمة المرور</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="أدخل كلمة المرور"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              textAlign="right"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>كود السائق (اختياري)</Text>
            <TextInput
              style={styles.input}
              value={driverCode}
              onChangeText={setDriverCode}
              placeholder="أدخل كود السائق إن وجد"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
              textAlign="right"
            />
          </View>

          {/* زر تسجيل الدخول */}
          <TouchableOpacity 
            style={[
              styles.loginButton,
              (isLoading || connectionStatus === 'disconnected') && styles.loginButtonDisabled
            ]}
            onPress={handleLogin}
            disabled={isLoading || connectionStatus === 'disconnected'}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* معلومات إضافية */}
        <View style={styles.footer}>
          <Text style={styles.helpText}>
            هل تحتاج مساعدة؟ تواصل مع الإدارة
          </Text>
          <Text style={styles.versionText}>الإصدار 1.0.0</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  connectionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  loginButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 12,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default LoginScreen;