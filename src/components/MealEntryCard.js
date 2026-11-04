import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { MEAL_ICON, MEAL_LABEL } from './MealChips';
import styles from '../style/components/MealEntryCardStyles';

const formatNumber = (value) => Math.round(Number(value) || 0).toLocaleString('th-TH');

// Entries store an ISO timestamp; show local "HH:mm". Older values may already be "HH:mm".
function formatTime(value) {
  if (!value) return '';
  if (/^\d{1,2}:\d{2}$/.test(String(value))) return String(value);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * A single logged food entry for the Home screen: mint meal tile, meal label +
 * time, name, serving line (plus macros when `detailed`), kcal on the right,
 * and an optional remove button.
 */
export default function MealEntryCard({
  meal,
  mealLabel,
  name,
  time,
  servings,
  unit,
  grams,
  kcal,
  protein,
  carbs,
  fat,
  detailed = false,
  onRemove,
}) {
  const label = mealLabel || MEAL_LABEL[meal] || 'อาหาร';
  const iconName = MEAL_ICON[meal] || 'restaurant-outline';
  const calories = Math.round(Number(kcal) || 0);
  const timeLabel = formatTime(time);
  const servingCount = Number(servings) || 0;
  const gramCount = Math.round(Number(grams) || 0);
  // Entries from the portion screen carry a unit and gram total; older ones only a count.
  let servingLabel = '';
  if (unit === 'กรัม' && gramCount > 0) servingLabel = `${gramCount} กรัม`;
  else if (unit && servingCount > 0) servingLabel = `${servingCount} ${unit}${gramCount > 0 ? ` (≈${gramCount} ก.)` : ''}`;
  else if (servingCount > 0 && servingCount !== 1) servingLabel = `${servingCount} หน่วย`;
  const macroLabel = detailed
    ? `โปรตีน ${formatNumber(protein)} / คาร์บ ${formatNumber(carbs)} / ไขมัน ${formatNumber(fat)} กรัม`
    : '';
  const detailLine = [servingLabel, macroLabel].filter(Boolean).join(' · ');
  const accessibilityLabel = [label, timeLabel || null, name, detailLine || null, `${formatNumber(calories)} กิโลแคลอรี`]
    .filter(Boolean)
    .join(' ');

  return (
    <View style={styles.card}>
      <View style={styles.body} accessible accessibilityLabel={accessibilityLabel}>
        <View style={styles.iconTile}>
          <Ionicons name={iconName} size={22} color={colors.primary} />
        </View>
        <View style={styles.main}>
          <Text style={styles.meta} numberOfLines={1}>
            {label}
            {timeLabel ? ` · ${timeLabel}` : ''}
          </Text>
          <Text style={styles.name} numberOfLines={2}>{name}</Text>
          {detailLine ? (
            <Text style={styles.subtitle} numberOfLines={2}>{detailLine}</Text>
          ) : null}
        </View>
        <View style={styles.kcalCol}>
          <Text style={styles.kcal}>{formatNumber(calories)}</Text>
          <Text style={styles.kcalUnit}>kcal</Text>
        </View>
      </View>
      {!!onRemove && (
        <Pressable
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`ลบ ${name}`}
          accessibilityHint="ลบรายการนี้ออกจากบันทึก"
          style={({ pressed }) => [styles.removeBtn, pressed && styles.removeBtnPressed]}
        >
          <Ionicons name="trash-outline" size={18} color={colors.inkMuted} />
        </Pressable>
      )}
    </View>
  );
}
