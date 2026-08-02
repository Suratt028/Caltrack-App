import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

import HomeScreen from '../screens/HomeScreen';
import LogScreen from '../screens/LogScreen';
import ScanScreen from '../screens/ScanScreen';
import TrendsScreen from '../screens/TrendsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: 'home',
  Log: 'add-circle',
  Scan: 'camera',
  Trends: 'stats-chart',
  Profile: 'person-circle',
};

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.inkFaint,
          tabBarStyle: { borderTopColor: colors.border, height: 62, paddingBottom: 8, paddingTop: 6 },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarIcon: ({ color, size }) => <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'หน้าหลัก' }} />
        <Tab.Screen name="Log" component={LogScreen} options={{ tabBarLabel: 'บันทึก' }} />
        <Tab.Screen name="Scan" component={ScanScreen} options={{ tabBarLabel: 'สแกน' }} />
        <Tab.Screen name="Trends" component={TrendsScreen} options={{ tabBarLabel: 'เทรนด์' }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'โปรไฟล์' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
