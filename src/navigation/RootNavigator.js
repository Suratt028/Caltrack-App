import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
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
          tabBarStyle: {
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
            height: 74,
            paddingBottom: 8,
            paddingTop: 7,
            boxShadow: '0px -2px 10px rgba(43, 36, 32, 0.08)',
            elevation: 6,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarIcon: ({ color, size, focused }) => (
            route.name === 'Scan' ? (
              <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: -18, borderWidth: 4, borderColor: colors.surface, boxShadow: '0px 6px 10px rgba(47, 143, 107, 0.35)', elevation: 6 }}>
                <Ionicons name="add" size={30} color={colors.white} />
              </View>
            ) : <Ionicons name={TAB_ICONS[route.name]} size={focused ? size + 1 : size} color={color} />
          ),
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'หน้าหลัก' }} />
        <Tab.Screen name="Log" component={LogScreen} options={{ tabBarLabel: 'บันทึก' }} />
        <Tab.Screen name="Scan" component={ScanScreen} options={{ tabBarLabel: 'เพิ่มอาหาร' }} />
        <Tab.Screen name="Trends" component={TrendsScreen} options={{ tabBarLabel: 'เทรนด์' }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'โปรไฟล์' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
