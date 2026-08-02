import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import AuthScreen from './src/screens/AuthScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import RootNavigator from './src/navigation/RootNavigator';
import { colors } from './src/theme/colors';
import styles from './src/style/AppStyles';

function Gate() {
  const { isLoading, profile, user } = useApp();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return profile ? <RootNavigator /> : <OnboardingScreen />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <Gate />
      </AppProvider>
    </SafeAreaProvider>
  );
}

