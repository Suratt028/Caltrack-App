import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme/colors';

export default StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.smd,
  },
  cell: {
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
    marginTop: spacing.xxs,
  },
  unit: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
});
