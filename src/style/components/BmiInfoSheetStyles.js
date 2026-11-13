import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/colors';

export default StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  // Bottom sheet on phones; on wide screens it sits centred with a max width.
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    ...typography.h2,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  formula: {
    backgroundColor: colors.mint,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  formulaMain: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  formulaWorked: {
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 46,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderRadius: 8,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowName: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
  },
  rowRange: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  note: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.inkMuted,
    marginTop: spacing.md,
  },
  button: {
    marginTop: spacing.lg,
  },
});
