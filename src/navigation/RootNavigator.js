import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

import HomeScreen from '../screens/HomeScreen';
import LogScreen from '../screens/LogScreen';
import ScanScreen from '../screens/ScanScreen';
import TrendsScreen from '../screens/TrendsScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Flow screen pushed above the tabs (reached from Log search results).
import PortionScreen from '../screens/PortionScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const WEB_APP_FRAME =
  Platform.OS === 'web' ? { width: '100%', maxWidth: 1120, alignSelf: 'center' } : undefined;

const WEB_LINKING = {
  prefixes: [],
  config: {
    screens: {
      Tabs: {
        path: '',
        screens: {
          Home: '',
          Log: 'log',
          Scan: 'scan',
          Trends: 'trends',
          Profile: 'profile',
        },
      },
      Portion: 'log/portion/:foodId',
    },
  },
};

// Focused / unfocused icon pairs so the active tab always looks active.
const TAB_ICONS = {
  Home: ['home', 'home-outline'],
  Log: ['add-circle', 'add-circle-outline'],
  Trends: ['stats-chart', 'stats-chart-outline'],
  Profile: ['person-circle', 'person-circle-outline'],
};

// The five primary tabs. Flow screens (Portion) sit above these in the stack.
function Tabs() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: WEB_APP_FRAME,
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
          // Fixed-size pill: the tab bar's icon box is only ~31px wide, so
          // horizontal padding would squeeze the icon itself to zero width.
          return (
            <View
              style={
                focused
                  ? {
                      width: 56,
                      height: 30,
                      flexShrink: 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.mint,
                      borderRadius: 999,
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
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer linking={Platform.OS === 'web' ? WEB_LINKING : undefined}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: WEB_APP_FRAME,
        }}
      >
        {/* The tab navigator lives under the "Tabs" route so flow screens can
            be pushed on top and still navigate back into a specific tab. */}
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="Portion" component={PortionScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
