import React from 'react';
import { View } from 'react-native';
import { Text } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import PrimaryButton from './PrimaryButton';
import styles from '../style/components/EmptyStateStyles';

/**
 * Friendly empty / no-data / error state. Uses a real icon (never emoji) so it
 * reads the same on every platform, and always tells the user what to do next.
 * size "lg" is the full-screen version (big mint tile, h2 title).
 */
export default function EmptyState({
  icon = 'restaurant-outline',
  title,
  message,
  actionTitle,
  actionIcon,
  onAction,
  secondaryTitle,
  secondaryIcon,
  onSecondary,
  size = 'md',
  style,
}) {
  const large = size === 'lg';
  return (
    <View style={[styles.wrap, large && styles.wrapLg, style]}>
      <View style={[styles.iconTile, large && styles.iconTileLg]}>
        <Ionicons name={icon} size={large ? 44 : 26} color={colors.primary} />
      </View>
      {!!title && (
        <Text style={[styles.title, large && styles.titleLg]} accessibilityRole="header">
          {title}
        </Text>
      )}
      {!!message && <Text style={styles.message}>{message}</Text>}
      {(!!onAction || !!onSecondary) && (
        <View style={styles.actions}>
          {!!actionTitle && !!onAction && (
            <PrimaryButton title={actionTitle} icon={actionIcon} onPress={onAction} compact={!large} />
          )}
          {!!secondaryTitle && !!onSecondary && (
            <PrimaryButton
              title={secondaryTitle}
              icon={secondaryIcon}
              variant="soft"
              onPress={onSecondary}
              compact={!large}
            />
          )}
        </View>
      )}
    </View>
  );
}
