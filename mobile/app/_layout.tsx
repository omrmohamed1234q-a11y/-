import { useEffect } from 'react'
import { Slot, Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { AuthProvider } from '../context/AuthContext'

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after initial setup
    SplashScreen.hideAsync()
  }, [])

  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="splash" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  )
}