import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false,
          title: 'تسجيل الدخول' 
        }} 
      />
      <Stack.Screen 
        name="signup" 
        options={{ 
          headerShown: false,
          title: 'إنشاء حساب جديد' 
        }} 
      />
      <Stack.Screen 
        name="forgot-password" 
        options={{ 
          headerShown: false,
          title: 'نسيت كلمة المرور' 
        }} 
      />
    </Stack>
  )
}