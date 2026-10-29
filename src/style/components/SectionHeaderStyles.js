import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme/colors';

export default StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.smd,
  },
  title: {
    ...typography.h2,
    color: colors.ink,
    flexShrink: 1,
  },
  meta: {
    ...typography.small,
    color: colors.inkMuted,
  },
});
