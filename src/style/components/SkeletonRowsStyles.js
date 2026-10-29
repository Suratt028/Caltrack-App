import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme/colors';

export default StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.mdl,
    marginBottom: spacing.smd,
  },
  tile: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  lines: { flex: 1, gap: spacing.sm },
  line: { height: 12, borderRadius: 6, backgroundColor: colors.surfaceMuted },
  lineWide: { width: '70%' },
  lineShort: { width: '40%' },
});
