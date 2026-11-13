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
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  summaryColumn: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  summaryValue: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '800',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  summaryUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkMuted,
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
  goalLegendLine: {
    height: 0,
    borderTopWidth: 2,
    borderTopColor: colors.turmericDark,
    borderStyle: 'dashed',
  },
  avgLegendLine: {
    height: 0,
    borderTopWidth: 2,
    borderTopColor: colors.inkFaint,
    borderStyle: 'dashed',
  },
  legendText: {
    fontSize: 13,
    color: colors.inkMuted,
  },
  hint: {
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: spacing.sm,
  },
});
