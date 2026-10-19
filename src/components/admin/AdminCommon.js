import React from 'react';
import { Alert, Platform, View } from 'react-native';
import { Text } from '../AppText';
import styles from '../../style/screens/AdminScreenStyles';

// window.confirm / alert only exist on web; native needs Alert.alert.
export function confirmAction(message, confirmLabel = 'ลบ') {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(message));
  return new Promise((resolve) => {
    Alert.alert('ยืนยัน', message, [
      { text: 'ยกเลิก', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ], { cancelable: true, onDismiss: () => resolve(false) });
  });
}

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