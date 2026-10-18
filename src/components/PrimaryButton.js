import React from 'react';
import { Pressable, View, ActivityIndicator } from 'react-native';
import { Text } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import styles from '../style/components/PrimaryButtonStyles';

export default function PrimaryButton({
  title,
  onPress,
  variant = 'solid',
  loading = false,
  disabled = false,
  style,
  icon,
  accessibilityHint,
  compact = false,
}) {
  const isSolid = variant === 'solid';
  const isDisabled = disabled || loading;
  const iconColor = isSolid ? colors.white : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        isSolid ? styles.solid : styles.outline,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      android_ripple={isSolid ? { color: 'rgba(255,255,255,0.18)' } : { color: 'rgba(33,99,76,0.10)' }}
    >
      {loading ? (
        <ActivityIndicator color={isSolid ? colors.white : colors.primary} />
      ) : (
        <View style={styles.content}>
          {!!icon && <Ionicons name={icon} size={18} color={iconColor} style={styles.icon} />}
          <Text style={[styles.text, isSolid ? styles.textSolid : styles.textOutline]} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
