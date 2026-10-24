import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/colors';

export default StyleSheet.create({
  wrap: {
    width: '100%',
    gap: spacing.md,
  },
  row: {
    gap: spacing.sm,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  seriesLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
  },
  avgText: {
    fontSize: 13,
    color: colors.inkMuted,
  },
  avgValue: {
    fontWeight: '700',
    color: colors.ink,
  },
  canvas: {
    width: '100%',
    minHeight: 56,
  },
  note: {
    fontSize: 12,
    color: colors.inkMuted,
  },
});
