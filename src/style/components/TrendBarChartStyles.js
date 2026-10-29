import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme/colors';

export default StyleSheet.create({
  wrap: {
    width: '100%',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  legendText: {
    ...typography.small,
    color: colors.inkMuted,
  },
  legendGoal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDash: {
    width: 14,
    height: 0,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.ink,
  },
  legendGoalText: {
    ...typography.small,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  canvas: {
    width: '100%',
    minHeight: 210,
    alignItems: 'flex-start',
  },
  caption: {
    ...typography.small,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  // Visually hidden but still announced by screen readers.
  srOnly: {
    position: 'absolute',
    left: 0,
    top: 0,
    opacity: 0,
    fontSize: 11,
    lineHeight: 14,
  },
});
