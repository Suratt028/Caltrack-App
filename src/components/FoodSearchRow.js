import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import styles from '../style/components/FoodSearchRowStyles';

/**
 * Search result row for the "บันทึกอาหาร" flow (mirrors the web Log search row):
 * name + serving label on the left, kcal on the right, and a mint 44dp round
 * "+" button that opens the portion screen before saving.
 */
export default function FoodSearchRow({ name, subtitle, kcal, onPress }) {
  const calories = Math.round(Number(kcal) || 0);

  return (
    <View style={styles.row}>
      <View style={styles.main}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>

      <Text style={styles.kcal}>
        {calories}
        <Text style={styles.kcalUnit}> kcal</Text>
      </Text>

      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityLabel={`บันทึก ${name}`}
        accessibilityHint="ปรับปริมาณก่อนบันทึกลงบันทึกอาหาร"
        style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
        hitSlop={6}
      >
        <Ionicons name="add" size={22} color={colors.primary} />
      </Pressable>
    </View>
  );
}
