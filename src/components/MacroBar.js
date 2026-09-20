import React from 'react';
import { View, Text } from 'react-native';
import styles from '../style/components/MacroBarStyles';

export default function MacroBar({ label, consumed, goal, color, unit = 'g' }) {
  const safeConsumed = Number(consumed) || 0;
  const safeGoal = Number(goal) || 0;
  const pct = safeGoal > 0 ? Math.min(safeConsumed / safeGoal, 1) : 0;
  return (
    <View style={styles.row}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {Math.round(safeConsumed)}/{Math.round(safeGoal)}
          {unit}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

