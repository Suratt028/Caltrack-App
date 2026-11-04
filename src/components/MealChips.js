import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './AppText';
import styles from '../style/components/MealChipsStyles';

// Single source of truth for meal options (shared by Log + Scan screens).
// `short` is the segmented-control wording (เช้า · กลางวัน · เย็น · ว่าง);
// `icon` the Ionicons glyph used on meal tiles (sunrise, sun, moon, cup).
export const MEALS = [
  { key: 'breakfast', label: 'มื้อเช้า', short: 'เช้า', icon: 'partly-sunny-outline' },
  { key: 'lunch', label: 'มื้อกลางวัน', short: 'กลางวัน', icon: 'sunny-outline' },
  { key: 'dinner', label: 'มื้อเย็น', short: 'เย็น', icon: 'moon-outline' },
  { key: 'snack', label: 'ของว่าง', short: 'ว่าง', icon: 'cafe-outline' },
];

export const MEAL_LABEL = MEALS.reduce((acc, meal) => ({ ...acc, [meal.key]: meal.label }), {});
export const MEAL_ICON = MEALS.reduce((acc, meal) => ({ ...acc, [meal.key]: meal.icon }), {});
// Options for <SegmentedControl> on Log, Portion and Scan.
export const MEAL_OPTIONS = MEALS.map((meal) => ({ value: meal.key, label: meal.short }));

/** Suggest the meal that best matches the current time of day. */
export function defaultMealForNow(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 10) return 'breakfast';
  if (hour >= 10 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 21) return 'dinner';
  return 'snack';
}

/**
 * Meal picker chips with proper touch targets and a single active state style.
 */
export default function MealChips({ value, onChange, label = 'มื้ออาหาร' }) {
  return (
    <View>
      {!!label && <Text style={styles.fieldLabel}>{label}</Text>}
      <View style={styles.row} accessibilityRole="radiogroup">
        {MEALS.map((meal) => {
          const active = value === meal.key;
          return (
            <Pressable
              key={meal.key}
              onPress={() => onChange(meal.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={meal.label}
              hitSlop={6}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.chipPressed,
              ]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{meal.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
