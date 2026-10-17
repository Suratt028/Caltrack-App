import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import styles from '../style/components/BannerStyles';

const TONES = {
  success: { icon: 'checkmark-circle', color: colors.success, bg: colors.successSoft, border: '#C6E6D6' },
  error: { icon: 'alert-circle', color: colors.danger, bg: colors.dangerSoft, border: '#F3CFC4' },
  warning: { icon: 'information-circle', color: colors.turmericDark, bg: colors.turmericSoft, border: '#EBD9BC' },
  info: { icon: 'information-circle', color: colors.skyDark, bg: colors.skySoft, border: '#C9DDEF' },
};

/**
 * Inline feedback banner for loading / success / error messages.
 * Always paired with text (never colour alone) and screen-reader friendly.
 */
export default function Banner({ tone = 'info', message, icon, onDismiss, style }) {
  if (!message) return null;
  const preset = TONES[tone] || TONES.info;

  return (
    <View
      style={[styles.wrap, { backgroundColor: preset.bg, borderColor: preset.border }, style]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Ionicons name={icon || preset.icon} size={20} color={preset.color} style={styles.icon} />
      <Text style={[styles.message, { color: preset.color }]}>{message}</Text>
      {!!onDismiss && (
        <Pressable onPress={onDismiss} hitSlop={12} accessibilityRole="button" accessibilityLabel="ปิดข้อความ">
          <Ionicons name="close" size={18} color={preset.color} />
        </Pressable>
      )}
    </View>
  );
}
