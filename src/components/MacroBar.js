import React from 'react';
import { View, Text } from 'react-native';
import styles from '../style/components/MacroBarStyles';

export default function MacroBar({ label, consumed, goal, color, unit = 'g' }) {
  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {Math.round(consumed)}/{Math.round(goal)}
          {unit}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

