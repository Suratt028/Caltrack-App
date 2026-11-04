import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme/colors';

export default StyleSheet.create({
  pressed: { opacity: 0.8 },
  flex: { flex: 1 },
  banner: { marginBottom: spacing.md },
  mealWrap: { marginBottom: spacing.md },

  // Search field
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 60,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    marginBottom: spacing.lg,
  },
  searchWrapFocused: {
    borderColor: colors.primary,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingVertical: spacing.smd,
    paddingHorizontal: spacing.sm,
    fontSize: 16,
    color: colors.ink,
    outlineStyle: 'none',
  },

  // Add manually
  manualToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smd,
    minHeight: 64,
    paddingVertical: spacing.smd,
    marginTop: spacing.sm,
  },
  manualTextCol: { flex: 1, minWidth: 0 },
  manualTitle: { ...typography.h3, color: colors.ink },
  manualSubtitle: { ...typography.bodySm, color: colors.inkMuted },
  manualForm: { marginTop: spacing.xs },
  fieldLabel: { ...typography.label, color: colors.ink, marginBottom: 6 },
  fieldGap: { marginTop: spacing.md },
  input: {
    minHeight: 52,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smd,
    fontSize: 16,
    color: colors.ink,
  },
  hint: { ...typography.small, color: colors.inkMuted, marginTop: spacing.sm, marginBottom: spacing.md },
  manualActions: { flexDirection: 'row', gap: spacing.smd },

  footnote: { ...typography.small, color: colors.inkMuted, marginTop: spacing.lg },
});
