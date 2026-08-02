import React from 'react';
import { View, Text, Pressable } from 'react-native';
import styles from '../style/components/FoodItemRowStyles';

export default function FoodItemRow({ name, subtitle, kcal, onPress, onRemove }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {!!subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
      <Text style={styles.kcal}>{Math.round(kcal)} kcal</Text>
      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={10} style={styles.removeBtn}>
          <Text style={styles.removeText}>ลบ</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

