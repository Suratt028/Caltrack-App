import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme/colors';

export default StyleSheet.create({
  card: {
    padding: 16,
  },
  inner: {
    width: '100%',
  },
  title: {
    ...typography.caption,
    color: colors.inkMuted,
  },
  value: {
    ...typography.h2,
    color: colors.ink,
    marginTop: spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  body: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
});
