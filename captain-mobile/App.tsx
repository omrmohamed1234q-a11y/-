import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';

// Screens
import DashboardScreen from './src/screens/DashboardScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import EarningsScreen from './src/screens/EarningsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: '#e5e5e5',
              paddingBottom: 8,
              paddingTop: 8,
              height: 70,
            },
            tabBarActiveTintColor: '#3B82F6',
            tabBarInactiveTintColor: '#6B7280',
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
            },
          }}
        >
          <Tab.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{
              title: 'الرئيسية',
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <Feather name="truck" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Orders"
            component={OrdersScreen}
            options={{
              title: 'الطلبات',
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <Feather name="map-pin" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Earnings"
            component={EarningsScreen}
            options={{
              title: 'الأرباح',
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <Feather name="dollar-sign" size={size} color={color} />
              ),
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              title: 'الملف الشخصي',
              tabBarIcon: ({ color, size }: { color: string; size: number }) => (
                <Feather name="user" size={size} color={color} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}