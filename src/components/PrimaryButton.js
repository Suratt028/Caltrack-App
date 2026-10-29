import React from 'react';
import { Pressable, View, ActivityIndicator } from 'react-native';
import { Text } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import styles from '../style/components/PrimaryButtonStyles';

// Text/icon colour per variant. "soft" is the mint secondary action from the
// design (e.g. "สแกนอาหารด้วย AI"); "outline" a quiet tertiary; "ghost" a link.
const FOREGROUND = {
  solid: colors.white,
  soft: colors.primaryDark,
  outline: colors.primaryDark,
  ghost: colors.primary,
};

export default function PrimaryButton({
  title,
  onPress,
  variant = 'solid',
  loading = false,
  disabled = false,
  style,
  icon,
  accessibilityHint,
  accessibilityLabel,
  compact = false,
}) {
  const isDisabled = disabled || loading;
  const foreground = FOREGROUND[variant] || FOREGROUND.solid;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        styles[variant] || styles.solid,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      android_ripple={variant === 'solid' ? { color: 'rgba(255,255,255,0.18)' } : { color: 'rgba(33,99,76,0.10)' }}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <View style={styles.content}>
          {!!icon && <Ionicons name={icon} size={20} color={foreground} style={styles.icon} />}
          <Text style={[styles.text, { color: foreground }]} numberOfLines={2}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
