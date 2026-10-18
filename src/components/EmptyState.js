import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import styles from '../style/components/EmptyStateStyles';

/**
 * Friendly empty / no-data state. Uses a real icon (never emoji) so it reads
 * the same on every platform, and always tells the user what to do next.
 */
export default function EmptyState({ icon = 'restaurant-outline', title, message, actionTitle, onAction }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      {!!title && <Text style={styles.title}>{title}</Text>}
      {!!message && <Text style={styles.message}>{message}</Text>}
      {!!actionTitle && !!onAction && (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionTitle}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        >
          <Text style={styles.actionText}>{actionTitle}</Text>
        </Pressable>
      )}
    </View>
  );
}
