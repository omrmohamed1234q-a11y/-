import { Tabs } from 'expo-router'
import { Text } from 'react-native'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#EF2D50',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="print"
        options={{
          title: 'طباعة',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🖨️</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'المتجر',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🛍️</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'النقاط',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>⭐</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'الملف الشخصي',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>👤</Text>
          ),
        }}
      />
    </Tabs>
  )
}