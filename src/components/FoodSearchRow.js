import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import styles from '../style/components/FoodSearchRowStyles';

// Splits `name` around the first case-insensitive match of `query` so the
// matched part can be bolded (Thai has no case, English does).
function splitMatch(name, query) {
  const text = String(name || '');
  const needle = String(query || '').trim();
  if (!needle) return [text, '', ''];
  const at = text.toLowerCase().indexOf(needle.toLowerCase());
  if (at < 0) return [text, '', ''];
  return [text.slice(0, at), text.slice(at, at + needle.length), text.slice(at + needle.length)];
}

/**
 * Food result card for the "บันทึกอาหาร" flow: utensils tile, name (query
 * match in bold), serving line, kcal, an optional "ค่าประมาณ" tag, and a mint
 * "+" — the whole card is one button that opens the portion screen.
 */
export default function FoodSearchRow({ name, eyebrow, subtitle, kcal, kcalEstimated = false, kcalSuffix, query, onPress }) {
  // Missing energy shows "—", not 0; calculated (not measured) energy gets "≈".
  const hasKcal = kcal != null && Number.isFinite(Number(kcal));
  const calories = hasKcal ? `${kcalEstimated ? '≈ ' : ''}${Math.round(Number(kcal)).toLocaleString('th-TH')}` : '—';
  const [before, match, after] = splitMatch(name, query);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name} ${subtitle || ''} ${hasKcal ? `${calories} กิโลแคลอรี` : 'ไม่มีข้อมูลพลังงาน'}`}
      accessibilityHint="ปรับปริมาณก่อนบันทึก"
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.tile}>
        <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
      </View>
      <View style={styles.main}>
        {!!eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.name} numberOfLines={2}>
          {before}
          {!!match && <Text style={styles.nameMatch}>{match}</Text>}
          {after}
        </Text>
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        <Text style={styles.kcal}>
          {calories} kcal
          {!!kcalSuffix && <Text style={styles.kcalSuffix}>{` ${kcalSuffix}`}</Text>}
        </Text>
        {kcalEstimated && <Text style={styles.tag}>ค่าประมาณ</Text>}
      </View>
      <View style={styles.addBtn}>
        <Ionicons name="add" size={24} color={colors.primaryDark} />
      </View>
    </Pressable>
  );
}
