import React from 'react';
import { View } from 'react-native';
import { Text } from './AppText';
import Card from './Card';
import styles from '../style/components/TrendStatCardStyles';

/**
 * Compact stat tile for the Trends screen: caption title, big tabular value and
 * a short helper body. Wraps the shared Card so it matches the rest of the app.
 */
export default function TrendStatCard({ title, value, body, style }) {
  const label = [title, value, body].filter(Boolean).join('. ');
  return (
    <Card style={[styles.card, style]}>
      <View accessible accessibilityLabel={label} style={styles.inner}>
        {!!title && <Text style={styles.title}>{title}</Text>}
        {!!value && <Text style={styles.value}>{value}</Text>}
        {!!body && <Text style={styles.body}>{body}</Text>}
      </View>
    </Card>
  );
}
