import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import styles from '../style/components/FoodItemRowStyles';

export default function FoodItemRow({ name, subtitle, kcal, onPress, onRemove }) {
  const calories = Math.round(Number(kcal) || 0);
  const accessibilityLabel = [name, subtitle, `${calories} แคลอรี่`].filter(Boolean).join(' ');

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.row, pressed && onPress && styles.rowPressed]}
    >
      <View style={styles.main}>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        {!!subtitle && <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>}
      </View>
      <Text style={styles.kcal}>{calories} kcal</Text>
      {!!onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={`ลบ ${name}`}
          style={({ pressed }) => [styles.removeBtn, pressed && styles.removeBtnPressed]}
        >
          <Ionicons name="trash-outline" size={17} color={colors.danger} />
        </Pressable>
      )}
    </Pressable>
  );
}
