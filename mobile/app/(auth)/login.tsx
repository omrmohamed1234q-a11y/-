import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Link, router } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'

export default function LoginScreen() {
  const { signIn } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.email) {
      newErrors.email = 'البريد الإلكتروني مطلوب'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح'
    }

    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة'
    } else if (formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const result = await authService.signInWithSupabase({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      if (result.success && result.user && result.token) {
        await signIn(result.user, result.token, formData.rememberMe);
        Alert.alert('نجح تسجيل الدخول', result.message, [
          { text: 'حسناً', onPress: () => router.replace('/(tabs)/home') }
        ]);
      }
    } catch (error) {
      console.error('Login error:', error)
      Alert.alert('خطأ', error instanceof Error ? error.message : 'فشل في تسجيل الدخول. يرجى المحاولة مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'replit') => {
    setLoading(true)
    try {
      let result;
      
      switch (provider) {
        case 'google':
          result = await authService.signInWithGoogle();
          break;
        case 'facebook':
          result = await authService.signInWithFacebook();
          break;
        case 'replit':
          result = await authService.signInWithReplit();
          break;
        default:
          throw new Error('مزود المصادقة غير مدعوم');
      }
      
      if (result.success && result.user && result.token) {
        await signIn(result.user, result.token, true);
        Alert.alert('نجح تسجيل الدخول', result.message, [
          { text: 'حسناً', onPress: () => router.replace('/(tabs)/home') }
        ]);
      }
    } catch (error) {
      console.error(`${provider} login error:`, error)
      Alert.alert('خطأ', error instanceof Error ? error.message : `حدث خطأ أثناء تسجيل الدخول باستخدام ${authService.getProviderDisplayName(provider)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>اطبعلي</Text>
          <Text style={styles.headerTitle}>أهلاً بعودتك</Text>
          <Text style={styles.headerSubtitle}>سجل دخولك للوصول إلى حسابك</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
              <TextInput
                style={styles.textInput}
                value={formData.email}
                onChangeText={(email) => setFormData({ ...formData, email })}
                placeholder="أدخل بريدك الإلكتروني"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
                data-testid="input-email"
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>كلمة المرور</Text>
            <View style={[styles.inputContainer, errors.password && styles.inputError]}>
              <TextInput
                style={styles.textInput}
                value={formData.password}
                onChangeText={(password) => setFormData({ ...formData, password })}
                placeholder="أدخل كلمة المرور"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                textAlign="right"
                data-testid="input-password"
              />
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          {/* Remember Me & Forgot Password */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberMeContainer}
              onPress={() => setFormData({ ...formData, rememberMe: !formData.rememberMe })}
              data-testid="button-remember-me"
            >
              <View style={[styles.checkbox, formData.rememberMe && styles.checkboxActive]}>
                {formData.rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.rememberMeText}>تذكرني</Text>
            </TouchableOpacity>

            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity data-testid="link-forgot-password">
                <Text style={styles.forgotPasswordText}>نسيت كلمة المرور؟</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
            data-testid="button-login"
          >
            <LinearGradient colors={['#EF2D50', '#DC2626']} style={styles.gradientButton}>
              <Text style={styles.loginButtonText}>
                {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>أو</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Login Options */}
        <View style={styles.socialContainer}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialLogin('replit')}
            disabled={loading}
            data-testid="button-replit-login"
          >
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradientSocial}>
              <Text style={styles.socialButtonText}>🔗 تسجيل الدخول بـ Replit</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialLogin('google')}
            disabled={loading}
            data-testid="button-google-login"
          >
            <View style={[styles.socialButtonContent, styles.googleButton]}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>تسجيل الدخول بـ Google</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialLogin('facebook')}
            disabled={loading}
            data-testid="button-facebook-login"
          >
            <LinearGradient colors={['#4267B2', '#365899']} style={styles.gradientSocial}>
              <Text style={styles.socialButtonText}>📘 تسجيل الدخول بـ Facebook</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Sign Up Link */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>ليس لديك حساب؟ </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity data-testid="link-signup">
              <Text style={styles.signupLink}>إنشاء حساب جديد</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* VIP Notice */}
        <View style={styles.vipNotice}>
          <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.vipGradient}>
            <Text style={styles.vipText}>👑 انضم لعضوية VIP واحصل على مزايا حصرية!</Text>
          </LinearGradient>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#EF2D50',
    marginBottom: 16,
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'right',
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  textInput: {
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'right',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
    textAlign: 'right',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#EF2D50',
    borderColor: '#EF2D50',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#EF2D50',
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
  },
  gradientButton: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9CA3AF',
  },
  socialContainer: {
    marginBottom: 24,
  },
  socialButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  gradientSocial: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
    marginLeft: 12,
  },
  socialButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  googleButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  signupText: {
    fontSize: 16,
    color: '#6B7280',
  },
  signupLink: {
    fontSize: 16,
    color: '#EF2D50',
    fontWeight: '600',
  },
  vipNotice: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  vipGradient: {
    padding: 16,
    alignItems: 'center',
  },
  vipText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
})