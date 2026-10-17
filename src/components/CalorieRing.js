import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography } from '../theme/colors';
import styles from '../style/components/CalorieRingStyles';

// A ring that fills as the day's calories are logged.
// Green while there is room left, warm red once the goal is passed.
// consumed/goal are in kcal. size/strokeWidth are in dp.
export default function CalorieRing({ consumed, goal, size = 220, strokeWidth = 18 }) {
  const safeConsumed = Math.max(Number(consumed) || 0, 0);
  const safeGoal = Number(goal) > 0 ? Number(goal) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = safeGoal > 0 ? Math.min(safeConsumed / safeGoal, 1) : 0;
  const remaining = Math.max(safeGoal - safeConsumed, 0);
  const over = Math.max(safeConsumed - safeGoal, 0);
  const isOver = safeGoal > 0 && safeConsumed > safeGoal;

  // The ring always reads as progress in brand green — over-goal is never
  // signalled with alarm red (design keeps feedback supportive, not blaming).
  const ringColor = colors.primary;

  return (
    <View
      style={[styles.wrap, { width: size, height: size }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={
        isOver
          ? `กินไป ${Math.round(safeConsumed)} แคลอรี่ เกินเป้าหมาย ${Math.round(over)} แคลอรี่`
          : `กินไป ${Math.round(safeConsumed)} แคลอรี่ จากเป้าหมาย ${Math.round(safeGoal)} แคลอรี่ เหลือ ${Math.round(remaining)} แคลอรี่`
      }
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.mint}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={[circumference, circumference]}
          strokeDashoffset={circumference * (1 - pct)}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.centerLabel} pointerEvents="none">
        <Text style={[typography.stat, styles.value]}>{Math.round(isOver ? over : remaining)}</Text>
        <Text style={[styles.unit, isOver && styles.unitOver]}>kcal</Text>
        <Text style={[styles.caption, isOver && styles.captionOver]}>
          {isOver ? 'เกินเป้าหมายวันนี้' : 'เหลือในวันนี้'}
        </Text>
      </View>
    </View>
  );
}
