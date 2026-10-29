import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/colors';

export default StyleSheet.create({
  wrap: {
    flex: 1,
    minWidth: 0,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    ...typography.small,
    color: colors.inkMuted,
  },
  value: {
    ...typography.statSm,
    fontSize: 20,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  unit: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  goal: {
    ...typography.small,
    color: colors.inkMuted,
    marginTop: spacing.sm,
  },
});
