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

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, signInWithGoogle, signInWithFacebook, error } = useAuth()
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني وكلمة المرور')
      return
    }

    setIsLoading(true)
    try {
      await signIn(email, password)
      router.replace('/(tabs)/home')
    } catch (error) {
      Alert.alert('خطأ في تسجيل الدخول', error instanceof Error ? error.message : 'حدث خطأ غير متوقع')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
      router.replace('/(tabs)/home')
    } catch (error) {
      Alert.alert('خطأ', error instanceof Error ? error.message : 'فشل في تسجيل الدخول بجوجل')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFacebookLogin = async () => {
    setIsLoading(true)
    try {
      await signInWithFacebook()
      router.replace('/(tabs)/home')
    } catch (error) {
      Alert.alert('خطأ', error instanceof Error ? error.message : 'فشل في تسجيل الدخول بفيسبوك')
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
            <Text style={styles.subtitle}>أهلاً بك مرة أخرى</Text>
          </View>

          <View style={styles.formContainer}>
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
                placeholder="أدخل كلمة المرور"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
                textAlign="right"
              />
            </View>

            <Link href="/(auth)/forgot-password" style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>نسيت كلمة المرور؟</Text>
            </Link>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>أو</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleLogin}
              disabled={isLoading}
            >
              <Text style={styles.socialButtonText}>تسجيل الدخول بجوجل</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, styles.facebookButton]}
              onPress={handleFacebookLogin}
              disabled={isLoading}
            >
              <Text style={[styles.socialButtonText, styles.facebookButtonText]}>
                تسجيل الدخول بفيسبوك
              </Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>ليس لديك حساب؟ </Text>
              <Link href="/(auth)/signup">
                <Text style={styles.signupLink}>إنشاء حساب جديد</Text>
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
    marginBottom: 20,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#EF2D50',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
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
  loginButtonText: {
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    color: '#6B7280',
    fontSize: 14,
  },
  signupLink: {
    color: '#EF2D50',
    fontSize: 14,
    fontWeight: '600',
  },
})