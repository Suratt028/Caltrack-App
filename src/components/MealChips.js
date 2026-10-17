import React from 'react';
import { View, Text, Pressable } from 'react-native';
import styles from '../style/components/MealChipsStyles';

// Single source of truth for meal options (shared by Log + Scan screens).
export const MEALS = [
  { key: 'breakfast', label: 'มื้อเช้า' },
  { key: 'lunch', label: 'มื้อเที่ยง' },
  { key: 'dinner', label: 'มื้อเย็น' },
  { key: 'snack', label: 'ของว่าง' },
];

export const MEAL_LABEL = MEALS.reduce((acc, meal) => ({ ...acc, [meal.key]: meal.label }), {});

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
