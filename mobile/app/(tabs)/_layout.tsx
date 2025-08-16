import { Tabs } from 'expo-router'
import React from 'react'
import { useColorScheme, Text } from 'react-native'

export default function TabLayout() {
  const colorScheme = useColorScheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#EF2D50',
        tabBarInactiveTintColor: '#7f8c8d',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colorScheme === 'dark' ? '#2c3e50' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: colorScheme === 'dark' ? '#34495e' : '#e9ecef',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ focused, color, size }) => (
            <Text style={{ fontSize: size, color }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="print"
        options={{
          title: 'طباعة',
          tabBarIcon: ({ focused, color, size }) => (
            <Text style={{ fontSize: size, color }}>🖨️</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'المتجر',
          tabBarIcon: ({ focused, color, size }) => (
            <Text style={{ fontSize: size, color }}>🛒</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'المكافآت',
          tabBarIcon: ({ focused, color, size }) => (
            <Text style={{ fontSize: size, color }}>🎁</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'الملف الشخصي',
          tabBarIcon: ({ focused, color, size }) => (
            <Text style={{ fontSize: size, color }}>👤</Text>
          ),
        }}
      />
    </Tabs>
  )
}