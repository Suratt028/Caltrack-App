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

  // Synchronize browser URL on login / logout (ทำเฉพาะบน Web)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.history) {
      if (user?.role === 'admin' && pathname !== '/admin') {
        window.history.pushState({}, '', '/admin');
        setPathname('/admin');
      } else if (user && user.role !== 'admin' && pathname === '/') {
        window.history.pushState({}, '', '/user');
        setPathname('/user');
      } else if (!user && pathname !== '/') {
        window.history.pushState({}, '', '/');
        setPathname('/');
      }
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
    if (pathname.startsWith('/admin')) {
      return <AdminScreen />;
    }
    if (pathname.startsWith('/user')) {
      if (!user) {
        return <AuthScreen />;
      }
      return profile ? <RootNavigator /> : <OnboardingScreen />;
    }
    // '/' path -> AuthScreen
    return <AuthScreen />;
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