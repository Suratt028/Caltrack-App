import React from 'react';
import { View } from 'react-native';
import { Text } from './AppText';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme/colors';
import styles from '../style/components/CalorieRingStyles';

const formatNumber = (value) => Math.round(Number(value) || 0).toLocaleString('th-TH');

// A ring that fills as the day's calories are logged.
// consumed/goal are in kcal. size/strokeWidth are in dp.
// Over the goal the ring is simply full and the centre reads
// "มากกว่าเป้า X" — never a negative number or an alarm colour.
export default function CalorieRing({ consumed, goal, size = 200, strokeWidth = 16 }) {
  const safeConsumed = Math.max(Number(consumed) || 0, 0);
  const safeGoal = Number(goal) > 0 ? Number(goal) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = safeGoal > 0 ? Math.min(safeConsumed / safeGoal, 1) : 0;
  const remaining = Math.max(safeGoal - safeConsumed, 0);
  const over = Math.max(safeConsumed - safeGoal, 0);
  const isOver = safeGoal > 0 && safeConsumed > safeGoal;
  // Scale the centre number with the ring so 4-5 digit values never clip.
  const valueSize = Math.round(size * 0.2);

  return (
    <View
      style={[styles.wrap, { width: size, height: size }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: Math.round(safeGoal), now: Math.round(Math.min(safeConsumed, safeGoal)) }}
      accessibilityLabel={
        isOver
          ? `ทานแล้ว ${formatNumber(safeConsumed)} กิโลแคลอรี มากกว่าเป้าหมายที่ตั้งไว้ ${formatNumber(over)} กิโลแคลอรี`
          : `ทานแล้ว ${formatNumber(safeConsumed)} จากเป้าหมาย ${formatNumber(safeGoal)} กิโลแคลอรี เหลืออีก ${formatNumber(remaining)} กิโลแคลอรี`
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
        {pct > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.primary}
            strokeWidth={strokeWidth}
            strokeLinecap={pct >= 1 ? 'butt' : 'round'}
            strokeDasharray={[circumference, circumference]}
            strokeDashoffset={circumference * (1 - pct)}
            fill="none"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </Svg>
      <View style={[styles.centerLabel, { pointerEvents: 'none' }]}>
        <Text style={styles.caption}>{isOver ? 'มากกว่าเป้า' : 'เหลืออีก'}</Text>
        <Text
          style={[styles.value, { fontSize: valueSize, lineHeight: Math.round(valueSize * 1.3) }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {formatNumber(isOver ? over : remaining)}
        </Text>
        <Text style={styles.unit}>กิโลแคลอรี</Text>
      </View>
    </View>
  );
}
