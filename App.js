import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native'; // เพิ่ม Platform
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import { FONT_ASSETS } from './src/theme/fonts';
import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import RootNavigator from './src/navigation/RootNavigator';
import AdminScreen from './src/screens/Admin/AdminScreen';
import { colors } from './src/theme/colors';
import styles from './src/style/AppStyles';

function Gate() {
  const { isLoading, profile, user } = useApp();
  
  // ตรวจสอบว่าเป็น Web และมี window.location อยู่จริงก่อนเรียกใช้
  const [pathname, setPathname] = useState(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
      return window.location.pathname;
    }
    return '/';
  });

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handlePopState = () => setPathname(window.location?.pathname || '/');
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, []);

  // Keep direct auth URLs from being interpreted as app tab routes after login.
  useEffect(() => {
    if (
      Platform.OS === 'web' &&
      user &&
      (pathname === '/login' || pathname === '/register') &&
      typeof window !== 'undefined'
    ) {
      window.history.replaceState({}, '', '/');
      setPathname('/');
    }
  }, [user, pathname]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Web Path-based Routing
  if (Platform.OS === 'web') {
    if (pathname.startsWith('/admin') || user?.role === 'admin') {
      return <AdminScreen />;
    }
    if (!user) return <AuthScreen />;
    return profile ? <RootNavigator /> : <OnboardingScreen />;
  }

  // Native Mobile App Routing (Android & iOS)
  if (user?.role === 'admin') {
    return <AdminScreen />;
  }
  if (!user) {
    return <AuthScreen />;
  }
  return profile ? <RootNavigator /> : <OnboardingScreen />;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);

  // Keep the splash/loading state until Noto Sans Thai is ready (or has failed,
  // in which case we fall back to the platform font rather than blocking).
  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Gate />
      </AppProvider>
    </SafeAreaProvider>
  );
}