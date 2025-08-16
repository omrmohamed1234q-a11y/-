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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!email) {
      newErrors.email = 'البريد الإلكتروني مطلوب'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleResetPassword = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch('/api/auth/supabase/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        setEmailSent(true)
        Alert.alert(
          'تم الإرسال بنجاح',
          'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد والبريد المهمل.',
          [{ text: 'حسناً', onPress: () => router.back() }]
        )
      } else {
        Alert.alert('خطأ', data.message || 'فشل في إرسال رابط إعادة التعيين')
      }
    } catch (error) {
      console.error('Password reset error:', error)
      Alert.alert('خطأ', 'حدث خطأ أثناء إرسال رابط إعادة التعيين')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <View style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successIconText}>✅</Text>
          </View>
          <Text style={styles.successTitle}>تم الإرسال بنجاح!</Text>
          <Text style={styles.successMessage}>
            تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.
            يرجى التحقق من صندوق الوارد والبريد المهمل.
          </Text>
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            data-testid="button-back-to-login"
          >
            <LinearGradient colors={['#EF2D50', '#DC2626']} style={styles.gradientButton}>
              <Text style={styles.backButtonText}>العودة لتسجيل الدخول</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    )
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
          <Text style={styles.headerTitle}>نسيت كلمة المرور؟</Text>
          <Text style={styles.headerSubtitle}>
            لا تقلق، سنرسل لك رابط إعادة تعيين كلمة المرور
          </Text>
        </View>

        {/* Reset Form */}
        <View style={styles.formContainer}>
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور الخاصة بك.
            </Text>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>البريد الإلكتروني</Text>
            <View style={[styles.inputContainer, errors.email && styles.inputError]}>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="أدخل بريدك الإلكتروني"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign="right"
                data-testid="input-reset-email"
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Reset Button */}
          <TouchableOpacity
            style={[styles.resetButton, loading && styles.disabledButton]}
            onPress={handleResetPassword}
            disabled={loading}
            data-testid="button-reset-password"
          >
            <LinearGradient colors={['#EF2D50', '#DC2626']} style={styles.gradientButton}>
              <Text style={styles.resetButtonText}>
                {loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Help Section */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>هل تحتاج مساعدة؟</Text>
          <Text style={styles.helpText}>
            إذا لم تتلقى الرسالة خلال 5 دقائق، تحقق من مجلد البريد المهمل أو جرب إدخال بريد إلكتروني آخر.
          </Text>
        </View>

        {/* Back to Login Link */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>تذكرت كلمة المرور؟ </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity data-testid="link-back-to-login">
              <Text style={styles.loginLink}>تسجيل الدخول</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <View style={styles.securityIcon}>
            <Text style={styles.securityIconText}>🔒</Text>
          </View>
          <Text style={styles.securityText}>
            نحن نأخذ أمان حسابك على محمل الجد. لن نرسل كلمة المرور الخاصة بك عبر البريد الإلكتروني أبداً.
          </Text>
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
    paddingTop: 80,
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
  instructionsContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  instructionsText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
    textAlign: 'right',
  },
  inputGroup: {
    marginBottom: 24,
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
  resetButton: {
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
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'right',
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'right',
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
  securityNotice: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  securityIcon: {
    marginLeft: 12,
    marginTop: 2,
  },
  securityIconText: {
    fontSize: 16,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    color: '#16A34A',
    lineHeight: 18,
    textAlign: 'right',
  },
  // Success Screen Styles
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIconText: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
})