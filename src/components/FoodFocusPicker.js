import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './AppText';
import { colors } from '../theme/colors';
import styles from '../style/components/FoodFocusPickerStyles';

// Wording is about what the food gives you, never about "good" or "bad" food.
export const FOOD_FOCUS = [
  {
    key: 'protein',
    title: 'โปรตีนเด่น',
    tagline: 'อิ่มนาน ดูแลกล้ามเนื้อ',
    listTitle: 'เมนูโปรตีนเด่น',
    badge: 'โปรตีน',
    icon: 'barbell-outline',
    color: colors.protein,
    ink: colors.skyDark,
    soft: colors.skySoft,
  },
  {
    key: 'carbs',
    title: 'คาร์บพลังดี',
    tagline: 'พลังงานพร้อมใช้ระหว่างวัน',
    listTitle: 'เมนูคาร์บพลังดี',
    badge: 'คาร์บ',
    icon: 'flash-outline',
    color: colors.carbs,
    ink: colors.carbStrong,
    soft: colors.turmericSoft,
  },
  {
    key: 'fat',
    title: 'ไขมันเข้มข้น',
    tagline: 'พลังงานแน่น ทานพอดีก็อิ่ม',
    listTitle: 'เมนูไขมันเข้มข้น',
    badge: 'ไขมัน',
    icon: 'water-outline',
    color: colors.fat,
    ink: '#8E4A3B',
    soft: colors.chiliSoft,
  },
];

export const focusByKey = (key) => FOOD_FOCUS.find((item) => item.key === key) || null;

/**
 * Three cards for picking the style of this meal (protein / carbs / fat).
 * Tapping the selected card again clears it.
 */
export default function FoodFocusPicker({ value, onChange }) {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>เลือกตามสไตล์มื้อนี้</Text>
        {value ? (
          <Pressable
            onPress={() => onChange(null)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="ล้างตัวเลือกสไตล์มื้อ"
          >
            <Text style={styles.clear}>ล้าง</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.row} accessibilityRole="radiogroup">
        {FOOD_FOCUS.map((item) => {
          const active = value === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => onChange(active ? null : item.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${item.title} ${item.tagline}`}
              style={({ pressed }) => [
                styles.card,
                active && { borderColor: item.color, backgroundColor: item.soft },
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.cardTop}>
                <View style={[styles.iconCircle, { backgroundColor: active ? item.color : item.soft }]}>
                  <Ionicons name={item.icon} size={20} color={active ? colors.white : item.ink} />
                </View>
                {active && <Ionicons name="checkmark-circle" size={20} color={item.color} />}
              </View>
              <Text style={[styles.cardTitle, { color: active ? item.ink : colors.ink }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.cardTagline} numberOfLines={2}>
                {item.tagline}
              </Text>
              <View style={[styles.accent, { backgroundColor: item.color }]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
