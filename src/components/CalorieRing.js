import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography } from '../theme/colors';
import styles from '../style/components/CalorieRingStyles';

// A ring that fills like a rice bowl as the day's calories are logged.
// consumed/goal are in kcal. size/strokeWidth are in dp.
export default function CalorieRing({ consumed, goal, size = 220, strokeWidth = 18 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0;
  const remaining = Math.max(goal - consumed, 0);
  const isOver = consumed > goal;

  const ringColor = isOver ? colors.chili : colors.turmeric;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceMuted}
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
          strokeDasharray={`${circumference}, ${circumference}`}
          strokeDashoffset={circumference * (1 - pct)}
          fill="none"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.centerLabel} pointerEvents="none">
        <Text style={[typography.stat, { color: colors.ink }]}>{Math.round(Math.abs(remaining))}</Text>
        <Text style={styles.caption}>{isOver ? 'kcal เกินเป้า' : 'kcal เหลือวันนี้'}</Text>
      </View>
    </View>
  );
}

