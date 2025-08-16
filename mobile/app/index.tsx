import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useAuth } from '../context/AuthContext'

// For now, we'll use a text logo since asset imports need proper setup
// TODO: Replace with actual logo image once asset imports are configured

const { width, height } = Dimensions.get('window')

export default function SplashScreen() {
  const { user, loading, isAuthenticated } = useAuth()
  const [fadeAnim] = useState(new Animated.Value(0))
  const [scaleAnim] = useState(new Animated.Value(0.5))
  const [showLogo, setShowLogo] = useState(true)

  useEffect(() => {
    // Start logo animation
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

    // Wait for auth check and show splash for minimum time
    const timer = setTimeout(() => {
      if (!loading) {
        navigateToNextScreen()
      }
    }, 2500) // Show splash for at least 2.5 seconds

    return () => clearTimeout(timer)
  }, [loading, isAuthenticated])

  useEffect(() => {
    if (!loading && showLogo) {
      const navigationTimer = setTimeout(() => {
        navigateToNextScreen()
      }, 1000)
      return () => clearTimeout(navigationTimer)
    }
  }, [loading, showLogo])

  const navigateToNextScreen = () => {
    setShowLogo(false)
    
    if (isAuthenticated) {
      // User is logged in, go to home screen
      router.replace('/(tabs)/home')
    } else {
      // User is not logged in, go to login screen
      router.replace('/(auth)/login')
    }
  }

  if (!showLogo) {
    return null // Let the navigation handle the next screen
  }

  return (
    <LinearGradient
      colors={['#f8f9fa', '#e9ecef', '#f8f9fa']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>📄</Text>
            <Text style={styles.logoArabic}>اطبعلي</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.appName}>اطبعلي</Text>
          <Text style={styles.tagline}>منصة الطباعة الذكية</Text>
          
          <View style={styles.loadingContainer}>
            <View style={styles.loadingDots}>
              <LoadingDot delay={0} />
              <LoadingDot delay={200} />
              <LoadingDot delay={400} />
            </View>
            <Text style={styles.loadingText}>جاري التحميل...</Text>
          </View>
        </Animated.View>

        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          {[...Array(20)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.patternDot,
                {
                  left: Math.random() * width,
                  top: Math.random() * height,
                  animationDelay: `${Math.random() * 2000}ms`,
                },
              ]}
            />
          ))}
        </View>
      </View>
    </LinearGradient>
  )
}

function LoadingDot({ delay }: { delay: number }) {
  const [opacity] = useState(new Animated.Value(0.3))

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    )

    const timer = setTimeout(() => {
      animation.start()
    }, delay)

    return () => {
      clearTimeout(timer)
      animation.stop()
    }
  }, [])

  return (
    <Animated.View
      style={[
        styles.loadingDot,
        {
          opacity,
        },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoPlaceholder: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 80,
    marginBottom: 10,
  },
  logoArabic: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 40,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF2D50',
    marginHorizontal: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#95a5a6',
    textAlign: 'center',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  patternDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(239, 45, 80, 0.1)',
  },
})