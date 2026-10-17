import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../theme/colors';
import styles from '../style/components/MacroBarStyles';

export default function MacroBar({ label, consumed, goal, color, unit = 'g' }) {
  const safeConsumed = Math.max(Number(consumed) || 0, 0);
  const safeGoal = Number(goal) || 0;
  const over = safeGoal > 0 && safeConsumed > safeGoal;
  const pct = safeGoal > 0 ? Math.min(safeConsumed / safeGoal, 1) : 0;
  const percentLabel = safeGoal > 0 ? Math.round((safeConsumed / safeGoal) * 100) : 0;

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${label} ${Math.round(safeConsumed)} จาก ${Math.round(safeGoal)} ${unit === 'g' ? 'กรัม' : unit}`}
    >
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          <Text style={[styles.valueStrong, over && styles.valueOver]}>
            {Math.round(safeConsumed)}
          </Text>
          /{Math.round(safeGoal)} {unit}
          {safeGoal > 0 ? ` · ${percentLabel}%` : ''}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${pct * 100}%`, backgroundColor: over ? colors.chili : color },
          ]}
        />
      </View>
      {over && (
        <Text style={styles.overHint}>เกินเป้าหมายอยู่ {Math.round(safeConsumed - safeGoal)} {unit}</Text>
      )}
    </View>
  );
}
