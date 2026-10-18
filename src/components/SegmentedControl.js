import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './AppText';
import styles from '../style/components/SegmentedControlStyles';

/**
 * Pill segmented control (meals, trends ranges).
 * Radio semantics so screen readers announce the selected option.
 */
export default function SegmentedControl({ options = [], value, onChange, label, size = 'md' }) {
  return (
    <View style={styles.track} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            style={({ pressed }) => [
              styles.segment,
              size === 'sm' && styles.segmentSm,
              selected && styles.segmentSelected,
              pressed && !selected && styles.segmentPressed,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.segmentText,
                size === 'sm' && styles.segmentTextSm,
                selected && styles.segmentTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
