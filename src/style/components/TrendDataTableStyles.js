import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme/colors';

export default StyleSheet.create({
  wrap: {
    width: '100%',
  },
  title: {
    ...typography.bodyBold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  table: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  headRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
    marginBottom: 2,
    alignItems: 'flex-start',
  },
  bodyRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 7,
    alignItems: 'center',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  headCell: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '600',
    color: colors.inkMuted,
    paddingRight: 4,
  },
  cell: {
    fontSize: 12,
    color: colors.inkMuted,
    paddingRight: 4,
    fontVariant: ['tabular-nums'],
  },
  dateHead: {
    flex: 2.4,
    textAlign: 'left',
  },
  dateCell: {
    flex: 2.4,
    textAlign: 'left',
    color: colors.ink,
  },
  numCell: {
    flex: 1,
    textAlign: 'right',
  },
  numCellLast: {
    flex: 1,
    textAlign: 'right',
    paddingRight: 0,
  },
  strong: {
    fontWeight: '700',
    color: colors.ink,
  },
});
