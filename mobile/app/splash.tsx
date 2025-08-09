import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../context/AuthContext'

export default function SplashScreen() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start()

    // Navigate after splash
    const timer = setTimeout(() => {
      if (!loading) {
        if (user) {
          router.replace('/(tabs)/home')
        } else {
          router.replace('/(auth)/login')
        }
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [user, loading])

  return (
    <LinearGradient
      colors={['#ffffff', '#f8f9fa']}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>اطبعلي</Text>
        <Text style={styles.subtitle}>طباعة ذكية وسهلة</Text>
      </Animated.View>

      <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
        <View style={styles.loadingDot} />
        <View style={styles.loadingDot} />
        <View style={styles.loadingDot} />
      </Animated.View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#EF2D50',
    marginBottom: 8,
    fontFamily: 'System',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    fontFamily: 'System',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 100,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF2D50',
    marginHorizontal: 4,
    opacity: 0.6,
  },
})