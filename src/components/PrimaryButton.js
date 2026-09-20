import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import styles from '../style/components/PrimaryButtonStyles';

export default function PrimaryButton({ title, onPress, variant = 'solid', loading = false, disabled = false, style }) {
  const isSolid = variant === 'solid';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isSolid ? styles.solid : styles.outline,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && { opacity: 0.9, transform: [{ scale: 0.985 }] },
        style,
      ]}
      android_ripple={isSolid ? { color: 'rgba(255,255,255,0.15)' } : { color: 'rgba(47,143,107,0.08)' }}
    >
      {loading ? (
        <ActivityIndicator color={isSolid ? colors.white : colors.primary} />
      ) : (
        <Text style={[styles.text, isSolid ? styles.textSolid : styles.textOutline]}>{title}</Text>
      )}
    </Pressable>
  );
}

