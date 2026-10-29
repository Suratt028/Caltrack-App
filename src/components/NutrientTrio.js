import React from 'react';
import { View } from 'react-native';
import { Text } from './AppText';
import { colors } from '../theme/colors';
import styles from '../style/components/NutrientTrioStyles';

const MACROS = [
  { key: 'protein', label: 'โปรตีน', color: colors.protein },
  { key: 'carbs', label: 'คาร์บ', color: colors.carbs },
  { key: 'fat', label: 'ไขมัน', color: colors.fat },
];

const format = (value) => {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return Math.round(Number(value)).toLocaleString('th-TH');
};

/**
 * Protein / carbs / fat in three columns: coloured dot + name, then grams.
 * Colour is never the only cue — every value is labelled.
 */
export default function NutrientTrio({ protein, carbs, fat, style }) {
  const values = { protein, carbs, fat };
  return (
    <View style={[styles.row, style]}>
      {MACROS.map((macro) => (
        <View
          key={macro.key}
          style={styles.cell}
          accessible
          accessibilityLabel={`${macro.label} ${format(values[macro.key])} กรัม`}
        >
          <View style={styles.labelRow}>
            <View style={[styles.dot, { backgroundColor: macro.color }]} />
            <Text style={styles.label}>{macro.label}</Text>
          </View>
          <Text style={styles.value}>
            {format(values[macro.key])}
            <Text style={styles.unit}> กรัม</Text>
          </Text>
        </View>
      ))}
    </View>
  );
}
