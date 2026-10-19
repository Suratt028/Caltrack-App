import React from 'react';
import { Alert, Platform, View } from 'react-native';
import { Text } from '../AppText';
import styles from '../../style/screens/AdminScreenStyles';
import { API_BASE_URL } from '../../config';

// Authenticated JSON request for admin sub-pages.
export async function adminRequest(path, token, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'Request failed');
    error.status = response.status;
    throw error;
  }
  return data;
}

// window.alert only exists on web; native needs Alert.alert.
// (For confirmations use confirmAsync from src/utils/confirm.)
export function notify(message) {
  if (Platform.OS === 'web') window.alert(message);
  else Alert.alert('', message);
}

export function formatDate(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Badge({ children, color = 'green' }) {
  return <Text style={[styles.badge, styles[`badge_${color}`]]}>{children}</Text>;
}

export function Title({ name, detail }) {
  return (
    <>
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.detail}>{detail}</Text>
    </>
  );
}

export function Stat({ icon, value, label, tone }) {
  return (
    <Card>
      <View style={[styles.statIcon, styles[`tone_${tone}`]]}>
        <Text style={styles.statIconText}>{icon}</Text>
      </View>
      <Text style={styles.statValue}>{value ?? '-'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statHint}>Live data from API</Text>
    </Card>
  );
}