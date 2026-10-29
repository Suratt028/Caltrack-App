import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { colors } from '../theme/colors';
import { useLayout } from '../theme/layout';
import AppNavBar, { NAV_ITEMS } from '../components/AppNavBar';

import HomeScreen from '../screens/HomeScreen';
import LogScreen from '../screens/LogScreen';
import ScanScreen from '../screens/ScanScreen';
import TrendsScreen from '../screens/TrendsScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Flow screens pushed above the tabs (each has its own back button).
import PortionScreen from '../screens/PortionScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const WEB_LINKING = {
  prefixes: [],
  config: {
    screens: {
      Tabs: {
        path: '',
        screens: {
          Home: '',
          Log: 'log',
          Trends: 'trends',
          Profile: 'profile',
        },
      },
      Scan: 'scan',
      Portion: 'log/portion/:foodId',
    },
  },
};

// Bar position per layout: bottom on phones, top on tablets, left on desktop.
const TAB_POSITION = { mobile: 'bottom', tablet: 'top', desktop: 'left' };

// The four primary destinations from the design. Scanning is a step of
// logging, so it lives in the stack (Home, Log and recovery link to it).
function Tabs() {
  const { layout } = useLayout();

  return (
    <Tab.Navigator
      tabBar={(props) => <AppNavBar {...props} layout={layout} />}
      screenOptions={{
        headerShown: false,
        tabBarPosition: TAB_POSITION[layout],
        tabBarHideOnKeyboard: layout === 'mobile',
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: NAV_ITEMS.Home.label }} />
      <Tab.Screen name="Log" component={LogScreen} options={{ title: NAV_ITEMS.Log.label }} />
      <Tab.Screen name="Trends" component={TrendsScreen} options={{ title: NAV_ITEMS.Trends.label }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: NAV_ITEMS.Profile.label }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer
      linking={Platform.OS === 'web' ? WEB_LINKING : undefined}
      documentTitle={{ formatter: (options) => (options?.title ? `${options.title} · CalTrack` : 'CalTrack') }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        {/* The tab navigator lives under the "Tabs" route so flow screens can
            be pushed on top and still navigate back into a specific tab. */}
        <Stack.Screen name="Tabs" component={Tabs} />
        <Stack.Screen name="Scan" component={ScanScreen} options={{ title: 'สแกนอาหารด้วย AI' }} />
        <Stack.Screen name="Portion" component={PortionScreen} options={{ title: 'ปรับปริมาณอาหาร' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
