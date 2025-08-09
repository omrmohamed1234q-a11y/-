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

export default function SignupScreen() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signUp, signInWithGoogle, signInWithFacebook } = useAuth()
  const router = useRouter()

  const validateInputs = () => {
    if (!fullName.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال الاسم الكامل')
      return false
    }
    if (!email.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني')
      return false
    }
    if (!email.includes('@')) {
      Alert.alert('خطأ', 'يرجى إدخال بريد إلكتروني صحيح')
      return false
    }
    if (password.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return false
    }
    if (password !== confirmPassword) {
      Alert.alert('خطأ', 'كلمات المرور غير متطابقة')
      return false
    }
    return true
  }

  const handleSignup = async () => {
    if (!validateInputs()) return

    setIsLoading(true)
    try {
      await signUp(email, password, fullName)
      Alert.alert(
        'تم إنشاء الحساب بنجاح',
        'يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب',
        [
          {
            text: 'موافق',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      )
    } catch (error) {
      Alert.alert('خطأ في إنشاء الحساب', error instanceof Error ? error.message : 'حدث خطأ غير متوقع')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
      router.replace('/(tabs)/home')
    } catch (error) {
      Alert.alert('خطأ', error instanceof Error ? error.message : 'فشل في التسجيل بجوجل')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFacebookSignup = async () => {
    setIsLoading(true)
    try {
      await signInWithFacebook()
      router.replace('/(tabs)/home')
    } catch (error) {
      Alert.alert('خطأ', error instanceof Error ? error.message : 'فشل في التسجيل بفيسبوك')
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
            <Text style={styles.title}>اطبعلي</Text>
            <Text style={styles.subtitle}>إنشاء حساب جديد</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>الاسم الكامل</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="أدخل اسمك الكامل"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                textAlign="right"
              />
            </View>

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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>كلمة المرور</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                textAlign="right"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>تأكيد كلمة المرور</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="أعد إدخال كلمة المرور"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                textAlign="right"
              />
            </View>

            <TouchableOpacity
              style={[styles.signupButton, isLoading && styles.disabledButton]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              <Text style={styles.signupButtonText}>
                {isLoading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب جديد'}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>أو</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleSignup}
              disabled={isLoading}
            >
              <Text style={styles.socialButtonText}>التسجيل بجوجل</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, styles.facebookButton]}
              onPress={handleFacebookSignup}
              disabled={isLoading}
            >
              <Text style={[styles.socialButtonText, styles.facebookButtonText]}>
                التسجيل بفيسبوك
              </Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>لديك حساب بالفعل؟ </Text>
              <Link href="/(auth)/login">
                <Text style={styles.loginLink}>تسجيل الدخول</Text>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#EF2D50',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
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
  signupButton: {
    backgroundColor: '#EF2D50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
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
  signupButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9CA3AF',
    fontSize: 14,
  },
  socialButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  facebookButton: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
  },
  socialButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  facebookButtonText: {
    color: '#ffffff',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    color: '#6B7280',
    fontSize: 14,
  },
  loginLink: {
    color: '#EF2D50',
    fontSize: 14,
    fontWeight: '600',
  },
})