import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/colors';

export default StyleSheet.create({
  wrap: {
    width: '100%',
  },
  headline: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  // Today (left, accent) and the average day (right, grey), big numbers.
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: 30,
    lineHeight: 40,
    fontWeight: '800',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  summaryValueMuted: {
    color: colors.inkFaint,
  },
  summaryUnit: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.inkFaint,
  },
  canvas: {
    width: '100%',
    minHeight: 210,
    marginTop: spacing.xs,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendLine: {
    width: 18,
    height: 3,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 13,
    color: colors.inkMuted,
  },
  hint: {
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: spacing.sm,
  },
});
