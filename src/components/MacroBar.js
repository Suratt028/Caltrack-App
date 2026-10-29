import React from 'react';
import { View } from 'react-native';
import { Text } from './AppText';
import styles from '../style/components/MacroBarStyles';

const formatNumber = (value) => Math.round(Number(value) || 0).toLocaleString('th-TH');

/**
 * One macro column on the energy card: dot + name, grams eaten, a progress
 * bar and "จาก X กรัม". Over the goal the bar is full and the caption says so
 * in words (no alarm colour).
 */
export default function MacroBar({ label, consumed, goal, color }) {
  const safeConsumed = Math.max(Number(consumed) || 0, 0);
  const safeGoal = Number(goal) || 0;
  const over = safeGoal > 0 && safeConsumed > safeGoal;
  const pct = safeGoal > 0 ? Math.min(safeConsumed / safeGoal, 1) : 0;

  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityLabel={`${label} ${formatNumber(safeConsumed)} จาก ${formatNumber(safeGoal)} กรัม${
        over ? ` มากกว่าเป้า ${formatNumber(safeConsumed - safeGoal)} กรัม` : ''
      }`}
    >
      <View style={styles.labelRow}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
      </View>
      <Text style={styles.value} numberOfLines={1}>
        {formatNumber(safeConsumed)}
        <Text style={styles.unit}> กรัม</Text>
      </Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.goal} numberOfLines={2}>
        {over ? `มากกว่าเป้า ${formatNumber(safeConsumed - safeGoal)} กรัม` : `จาก ${formatNumber(safeGoal)} กรัม`}
      </Text>
    </View>
  );
}
