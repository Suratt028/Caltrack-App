import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import styles from '../style/components/GoalPresetButtonStyles';

/**
 * Tappable goal preset card used on the Profile screen's 2-column grid.
 * Shows the computed daily kcal plus a compact P/C/F line; turns mint with a
 * checkmark when active. Radio semantics so screen readers announce it as a
 * selection within the goal grid.
 */
export default function GoalPresetButton({
  kcal = 0,
  protein = 0,
  carbs = 0,
  fat = 0,
  unit = 'kcal',
  active = false,
  disabled = false,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ selected: active, disabled }}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [
        styles.base,
        active && styles.active,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.textWrap}>
        <Text style={styles.kcal} numberOfLines={1}>
          {Number(kcal).toLocaleString('th-TH')}{' '}
          <Text style={styles.unit}>{unit}</Text>
        </Text>
        <Text style={styles.macros} numberOfLines={1}>
          P{protein} · C{carbs} · F{fat}
        </Text>
      </View>
      {active && <Ionicons name="checkmark-circle" size={22} color={colors.primary} style={styles.check} />}
    </Pressable>
  );
}
