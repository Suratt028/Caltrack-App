import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { MEAL_LABEL } from './MealChips';
import styles from '../style/components/MealEntryCardStyles';

// One icon per meal, mirroring the web MealCard (coffee / utensils / soup /
// cookie). soup/cookie aren't in this Ionicons build, so closest matches.
const MEAL_ICON = {
  breakfast: 'cafe-outline',
  lunch: 'restaurant-outline',
  dinner: 'fast-food-outline',
  snack: 'ice-cream-outline',
};

const formatNumber = (value) => Math.round(Number(value) || 0).toLocaleString('th-TH');

/**
 * A single logged food entry for the Home screen: mint meal tile, meal label +
 * time, name, serving line, kcal on the right, and an optional remove button.
 */
export default function MealEntryCard({
  meal,
  mealLabel,
  name,
  time,
  servings,
  kcal,
  onRemove,
}) {
  const label = mealLabel || MEAL_LABEL[meal] || 'อาหาร';
  const iconName = MEAL_ICON[meal] || 'restaurant-outline';
  const calories = Math.round(Number(kcal) || 0);
  const servingCount = Number(servings) || 0;
  const showServings = servingCount > 0 && servingCount !== 1;
  const accessibilityLabel = [
    label,
    time || null,
    name,
    showServings ? `${servingCount} หน่วย` : null,
    `${calories} แคลอรี่`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <View style={styles.card} accessible accessibilityLabel={accessibilityLabel}>
      <View style={styles.iconTile}>
        <Ionicons name={iconName} size={20} color={colors.primary} />
      </View>
      <View style={styles.main}>
        <Text style={styles.meta} numberOfLines={1}>
          {label}
          {time ? ` · ${time}` : ''}
        </Text>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {showServings ? (
          <Text style={styles.subtitle} numberOfLines={1}>{servingCount} หน่วย</Text>
        ) : null}
      </View>
      <Text style={styles.kcal}>
        {formatNumber(calories)}
        <Text style={styles.kcalUnit}> kcal</Text>
      </Text>
      {!!onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`ลบ ${name}`}
          accessibilityHint="ลบรายการนี้ออกจากบันทึกวันนี้"
          style={({ pressed }) => [styles.removeBtn, pressed && styles.removeBtnPressed]}
        >
          <Ionicons name="close" size={18} color={colors.inkMuted} />
        </Pressable>
      )}
    </View>
  );
}
