import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import styles from '../style/components/IconButtonStyles';

/**
 * Square icon button with a guaranteed 44×44 touch target.
 * variant: "surface" (white tile, e.g. back), "soft" (mint), "ghost" (no fill).
 */
export default function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  variant = 'surface',
  color = colors.primary,
  size = 22,
  disabled = false,
  style,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={disabled ? colors.inkFaint : color} />
    </Pressable>
  );
}
