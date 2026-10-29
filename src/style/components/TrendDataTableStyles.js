import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/colors';

export default StyleSheet.create({
  wrap: {
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.smd,
  },
  title: {
    ...typography.h3,
    color: colors.ink,
  },
  meta: {
    ...typography.small,
    color: colors.inkMuted,
  },
  table: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  headRow: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    paddingVertical: spacing.smd,
    paddingHorizontal: spacing.smd,
    marginBottom: spacing.xs,
    alignItems: 'center',
  },
  bodyRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.smd,
    paddingHorizontal: spacing.smd,
    alignItems: 'center',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  headCell: {
    ...typography.small,
    color: colors.inkMuted,
    paddingRight: 4,
  },
  cell: {
    ...typography.bodySm,
    color: colors.ink,
    paddingRight: 4,
    fontVariant: ['tabular-nums'],
  },
  dateHead: {
    flex: 2,
    textAlign: 'left',
  },
  dateCell: {
    flex: 2,
    textAlign: 'left',
  },
  numCell: {
    flex: 1.5,
    textAlign: 'right',
  },
  numCellLast: {
    flex: 1.5,
    textAlign: 'right',
    paddingRight: 0,
  },
  strong: {
    fontWeight: '700',
  },
});
