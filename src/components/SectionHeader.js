import React from 'react';
import { View } from 'react-native';
import { Text } from './AppText';
import styles from '../style/components/SectionHeaderStyles';

/** Section title with optional right-aligned meta text (e.g. "3 รายการ") or node. */
export default function SectionHeader({ title, meta, right, style }) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {!!meta && <Text style={styles.meta}>{meta}</Text>}
      {right}
    </View>
  );
}
