/**
 * شاشة تسجيل الدخول الآمن للكابتن - محسنة لتطابق النظام الويب
 */

import React, { useState, useEffect } from 'react';
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
  Dimensions,
  Animated
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
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{username?: string, password?: string}>({});
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    // تأثير الانزلاق والظهور عند التحميل
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  /**
   * التحقق من البيانات المدخلة
   */
  const validateInputs = () => {
    const newErrors: {username?: string, password?: string} = {};
    
    if (!username.trim()) {
      newErrors.username = 'اسم المستخدم مطلوب';
    } else if (username.trim().length < 3) {
      newErrors.username = 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
    }
    
    if (!password.trim()) {
      newErrors.password = 'كلمة المرور مطلوبة';
    } else if (password.trim().length < 4) {
      newErrors.password = 'كلمة المرور يجب أن تكون 4 أحرف على الأقل';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * معالج تسجيل الدخول مع التحقق المحسن
   */
  const handleLogin = async () => {
    if (!validateInputs()) {
      Alert.alert('خطأ في البيانات', 'يرجى تصحيح الأخطاء المطلوبة');
      return;
    }

    if (connectionStatus === 'disconnected') {
      Alert.alert('خطأ في الاتصال', 'لا يوجد اتصال بالخادم. يرجى التحقق من الإنترنت.');
      return;
    }

    setIsLoading(true);
    setErrors({});
    
    try {
      await onLogin({
        username: username.trim(),
        password: password.trim(),
        driverCode: driverCode.trim() || undefined
      });
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error);
      Alert.alert(
        'خطأ في تسجيل الدخول', 
        'فشل في تسجيل الدخول. تأكد من صحة البيانات أو تواصل مع الإدارة.'
      );
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
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* الرأس المحسن */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🚚</Text>
            </View>
            <Text style={styles.title}>اطبعلي</Text>
            <Text style={styles.subtitle}>تسجيل دخول الكباتن</Text>
            
            {/* حالة الاتصال المحسنة */}
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

          {/* تحذير الأمان */}
          <View style={styles.securityWarning}>
            <View style={styles.warningIcon}>
              <Text style={styles.warningEmoji}>⚠️</Text>
            </View>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>منطقة آمنة</Text>
              <Text style={styles.warningText}>
                هذه الصفحة محمية ومخصصة للكباتن المصرح لهم فقط
              </Text>
            </View>
          </View>

          {/* نموذج تسجيل الدخول المحسن */}
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>🔐 دخول آمن للكباتن</Text>
            </View>

            {/* اسم المستخدم */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>اسم المستخدم أو رقم الكبتن</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={[
                    styles.input, 
                    errors.username && styles.inputError
                  ]}
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    if (errors.username) {
                      setErrors(prev => ({ ...prev, username: undefined }));
                    }
                  }}
                  placeholder="أدخل اسم المستخدم"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlign="right"
                  editable={!isLoading}
                />
              </View>
              {errors.username && (
                <Text style={styles.errorText}>{errors.username}</Text>
              )}
            </View>

            {/* كلمة المرور */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>كلمة المرور</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={[
                    styles.input, 
                    errors.password && styles.inputError
                  ]}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: undefined }));
                    }
                  }}
                  placeholder="أدخل كلمة المرور"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  textAlign="right"
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  <Text style={styles.passwordToggleText}>
                    {showPassword ? '🙈' : '👁️'}
                  </Text>
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            {/* كود السائق */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>كود السائق (اختياري)</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>🏷️</Text>
                <TextInput
                  style={styles.input}
                  value={driverCode}
                  onChangeText={setDriverCode}
                  placeholder="أدخل كود السائق إن وجد"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                  textAlign="right"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* زر تسجيل الدخول المحسن */}
            <TouchableOpacity 
              style={[
                styles.loginButton,
                (isLoading || connectionStatus === 'disconnected') && styles.loginButtonDisabled
              ]}
              onPress={handleLogin}
              disabled={isLoading || connectionStatus === 'disconnected'}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>جاري تسجيل الدخول...</Text>
                  </View>
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonIcon}>🔐</Text>
                    <Text style={styles.buttonText}>دخول آمن</Text>
                  </View>
                )}
              </Text>
            </TouchableOpacity>
          </View>

          {/* معلومات إضافية محسنة */}
          <View style={styles.footer}>
            <Text style={styles.helpText}>
              للحصول على حساب كبتن، تواصل مع الإدارة
            </Text>
            <Text style={styles.securityText}>
              جميع محاولات الدخول مسجلة ومراقبة
            </Text>
            <Text style={styles.versionText}>الإصدار 1.0.0 - إطبعلي ©️ 2025</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'linear-gradient(135deg, #F0FDF4, #FFFFFF, #FEF2F2)', // Gradient effect simulation
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 40,
    color: 'white',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  connectionIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  securityWarning: {
    flexDirection: 'row',
    backgroundColor: '#FEF3E2',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  warningIcon: {
    marginRight: 12,
  },
  warningEmoji: {
    fontSize: 20,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 4,
    textAlign: 'right',
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'right',
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 32,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'right',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  passwordToggle: {
    paddingLeft: 8,
  },
  passwordToggleText: {
    fontSize: 18,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginTop: 4,
    textAlign: 'right',
  },
  loginButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    marginTop: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  buttonText: {
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
    marginBottom: 12,
  },
  securityText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  versionText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default LoginScreen;