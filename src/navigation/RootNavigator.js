import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

import HomeScreen from '../screens/HomeScreen';
import LogScreen from '../screens/LogScreen';
import ScanScreen from '../screens/ScanScreen';
import TrendsScreen from '../screens/TrendsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

// Focused / unfocused icon pairs so the active tab always looks active.
const TAB_ICONS = {
  Home: ['home', 'home-outline'],
  Log: ['add-circle', 'add-circle-outline'],
  Trends: ['stats-chart', 'stats-chart-outline'],
  Profile: ['person-circle', 'person-circle-outline'],
};

export default function RootNavigator() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: colors.primaryDark,
          tabBarInactiveTintColor: colors.inkMuted,
          tabBarStyle: {
            borderTopColor: colors.border,
            backgroundColor: colors.surface,
            height: 62 + bottomPadding,
            paddingBottom: bottomPadding,
            paddingTop: 7,
            boxShadow: '0px -2px 10px rgba(27, 61, 47, 0.08)',
            elevation: 6,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
          tabBarIcon: ({ color, size, focused }) => {
            if (route.name === 'Scan') {
              return (
                <View
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: -18,
                    borderWidth: 4,
                    borderColor: colors.surface,
                    boxShadow: '0px 6px 12px rgba(27, 61, 47, 0.35)',
                    elevation: 6,
                  }}
                >
                  <Ionicons name="camera" size={26} color={colors.white} />
                </View>
              );
            }
            const [activeIcon, inactiveIcon] = TAB_ICONS[route.name] || ['ellipse', 'ellipse-outline'];
            return (
              <View
                style={
                  focused
                    ? {
                        backgroundColor: colors.mint,
                        borderRadius: 999,
                        paddingHorizontal: 16,
                        paddingVertical: 3,
                      }
                    : null
                }
              >
                <Ionicons name={focused ? activeIcon : inactiveIcon} size={focused ? size + 1 : size} color={color} />
              </View>
            );
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'หน้าหลัก' }} />
        <Tab.Screen
          name="Log"
          component={LogScreen}
          options={{ tabBarLabel: 'บันทึก', tabBarAccessibilityLabel: 'บันทึกอาหาร' }}
        />
        <Tab.Screen
          name="Scan"
          component={ScanScreen}
          options={{ tabBarLabel: 'สแกน', tabBarAccessibilityLabel: 'สแกนอาหารด้วย AI' }}
        />
        <Tab.Screen name="Trends" component={TrendsScreen} options={{ tabBarLabel: 'แนวโน้ม' }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'โปรไฟล์' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
