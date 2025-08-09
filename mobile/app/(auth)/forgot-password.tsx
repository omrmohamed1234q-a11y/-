import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../../context/AuthContext'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { resetPassword } = useAuth()
  const router = useRouter()

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني')
      return
    }

    if (!email.includes('@')) {
      Alert.alert('خطأ', 'يرجى إدخال بريد إلكتروني صحيح')
      return
    }

    setIsLoading(true)
    try {
      await resetPassword(email)
      setEmailSent(true)
      Alert.alert(
        'تم إرسال الرابط',
        'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني',
        [
          {
            text: 'موافق',
            onPress: () => router.back(),
          },
        ]
      )
    } catch (error) {
      Alert.alert('خطأ', error instanceof Error ? error.message : 'حدث خطأ غير متوقع')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={['#ffffff', '#f8f9fa']} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>نسيت كلمة المرور؟</Text>
            <Text style={styles.subtitle}>
              أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور
            </Text>
          </View>

          <View style={styles.formContainer}>
            {!emailSent ? (
              <>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>البريد الإلكتروني</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="أدخل بريدك الإلكتروني"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textAlign="right"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.resetButton, isLoading && styles.disabledButton]}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                >
                  <Text style={styles.resetButtonText}>
                    {isLoading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.successContainer}>
                <Text style={styles.successTitle}>تم إرسال الرابط!</Text>
                <Text style={styles.successMessage}>
                  تحقق من بريدك الإلكتروني واتبع التعليمات لإعادة تعيين كلمة المرور
                </Text>
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={() => {
                    setEmailSent(false)
                    setEmail('')
                  }}
                >
                  <Text style={styles.resendButtonText}>إرسال مرة أخرى</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.backContainer}>
              <Link href="/(auth)/login">
                <Text style={styles.backLink}>العودة إلى تسجيل الدخول</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#EF2D50',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlign: 'right',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  resetButton: {
    backgroundColor: '#EF2D50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#EF2D50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successContainer: {
    alignItems: 'center',
    padding: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  resendButton: {
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
    shadowRadius: 3,
    elevation: 2,
  },
  resendButtonText: {
    color: '#EF2D50',
    fontSize: 16,
    fontWeight: '600',
  },
  backContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  backLink: {
    color: '#EF2D50',
    fontSize: 16,
    fontWeight: '600',
  },
})