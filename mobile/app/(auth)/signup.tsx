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

export default function SignupScreen() {
  const { signIn } = useAuth()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'الاسم الكامل مطلوب'
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'الاسم يجب أن يكون حرفين على الأقل'
    }

    if (!formData.email) {
      newErrors.email = 'البريد الإلكتروني مطلوب'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح'
    }

    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة'
    } else if (formData.password.length < 8) {
      newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'كلمة المرور يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'تأكيد كلمة المرور مطلوب'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمات المرور غير متطابقة'
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'يجب الموافقة على الشروط والأحكام'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignup = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const result = await authService.signUpWithSupabase({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        agreeToTerms: formData.agreeToTerms,
      });

      if (result.success && result.user && result.token) {
        await signIn(result.user, result.token, true);
        Alert.alert('تم بنجاح', result.message, [
          {
            text: 'متابعة',
            onPress: () => router.replace('/(tabs)/home'),
          },
        ]);
      }
    } catch (error) {
      console.error('Signup error:', error)
      Alert.alert('خطأ', error instanceof Error ? error.message : 'فشل في إنشاء الحساب. يرجى المحاولة مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  const handleSocialSignup = async (provider: 'google' | 'facebook' | 'replit') => {
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
        Alert.alert('تم بنجاح', result.message, [
          {
            text: 'متابعة',
            onPress: () => router.replace('/(tabs)/home'),
          },
        ]);
      }
    } catch (error) {
      console.error(`${provider} signup error:`, error)
      Alert.alert('خطأ', `حدث خطأ أثناء التسجيل باستخدام ${provider}`)
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
          <Text style={styles.headerTitle}>إنشاء حساب جديد</Text>
          <Text style={styles.headerSubtitle}>انضم إلينا واستمتع بخدمات الطباعة الذكية</Text>
        </View>

        {/* Signup Form */}
        <View style={styles.formContainer}>
          {/* Full Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>الاسم الكامل</Text>
            <View style={[styles.inputContainer, errors.fullName && styles.inputError]}>
              <TextInput
                style={styles.textInput}
                value={formData.fullName}
                onChangeText={(fullName) => setFormData({ ...formData, fullName })}
                placeholder="أدخل اسمك الكامل"
                placeholderTextColor="#9CA3AF"
                textAlign="right"
                data-testid="input-fullname"
              />
            </View>
            {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
          </View>

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

          {/* Confirm Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>تأكيد كلمة المرور</Text>
            <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
              <TextInput
                style={styles.textInput}
                value={formData.confirmPassword}
                onChangeText={(confirmPassword) => setFormData({ ...formData, confirmPassword })}
                placeholder="أعد إدخال كلمة المرور"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                textAlign="right"
                data-testid="input-confirm-password"
              />
            </View>
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>متطلبات كلمة المرور:</Text>
            <Text style={[styles.requirementItem, formData.password.length >= 8 && styles.requirementMet]}>
              • 8 أحرف على الأقل
            </Text>
            <Text style={[styles.requirementItem, /[A-Z]/.test(formData.password) && styles.requirementMet]}>
              • حرف كبير واحد على الأقل
            </Text>
            <Text style={[styles.requirementItem, /[a-z]/.test(formData.password) && styles.requirementMet]}>
              • حرف صغير واحد على الأقل
            </Text>
            <Text style={[styles.requirementItem, /\d/.test(formData.password) && styles.requirementMet]}>
              • رقم واحد على الأقل
            </Text>
          </View>

          {/* Terms and Conditions */}
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setFormData({ ...formData, agreeToTerms: !formData.agreeToTerms })}
            data-testid="button-terms"
          >
            <View style={[styles.checkbox, formData.agreeToTerms && styles.checkboxActive]}>
              {formData.agreeToTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              أوافق على{' '}
              <Text style={styles.termsLink}>الشروط والأحكام</Text>
              {' '}و{' '}
              <Text style={styles.termsLink}>سياسة الخصوصية</Text>
            </Text>
          </TouchableOpacity>
          {errors.agreeToTerms && <Text style={styles.errorText}>{errors.agreeToTerms}</Text>}

          {/* Signup Button */}
          <TouchableOpacity
            style={[styles.signupButton, loading && styles.disabledButton]}
            onPress={handleSignup}
            disabled={loading}
            data-testid="button-signup"
          >
            <LinearGradient colors={['#EF2D50', '#DC2626']} style={styles.gradientButton}>
              <Text style={styles.signupButtonText}>
                {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب جديد'}
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

        {/* Social Signup Options */}
        <View style={styles.socialContainer}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialSignup('replit')}
            disabled={loading}
            data-testid="button-replit-signup"
          >
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradientSocial}>
              <Text style={styles.socialButtonText}>🔗 التسجيل بـ Replit</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialSignup('google')}
            disabled={loading}
            data-testid="button-google-signup"
          >
            <View style={[styles.socialButtonContent, styles.googleButton]}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleButtonText}>التسجيل بـ Google</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialSignup('facebook')}
            disabled={loading}
            data-testid="button-facebook-signup"
          >
            <LinearGradient colors={['#4267B2', '#365899']} style={styles.gradientSocial}>
              <Text style={styles.socialButtonText}>📘 التسجيل بـ Facebook</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>لديك حساب بالفعل؟ </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity data-testid="link-login">
              <Text style={styles.loginLink}>تسجيل الدخول</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* VIP Signup Notice */}
        <View style={styles.vipNotice}>
          <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.vipGradient}>
            <Text style={styles.vipText}>🎉 مرحباً بك في عائلة اطبعلي! سجل الآن واحصل على نقاط مكافآت مجانية</Text>
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
    lineHeight: 22,
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
  requirementsContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'right',
  },
  requirementItem: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'right',
  },
  requirementMet: {
    color: '#059669',
    fontWeight: '500',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingRight: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
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
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'right',
  },
  termsLink: {
    color: '#EF2D50',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  signupButton: {
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
  signupButtonText: {
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
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  loginText: {
    fontSize: 16,
    color: '#6B7280',
  },
  loginLink: {
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
    lineHeight: 20,
  },
})