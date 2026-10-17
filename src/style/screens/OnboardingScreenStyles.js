import { StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme/colors';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  progressWrap: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  progressDot: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  progressLabel: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.sm,
    letterSpacing: 0.2,
  },
  content: {
    padding: 20,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.display,
    color: colors.ink,
    marginBottom: 6,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkMuted,
    marginBottom: 18,
    lineHeight: 21,
  },
  fieldLabel: {
    ...typography.bodyBold,
    color: colors.ink,
    marginTop: 10,
    marginBottom: 8,
    fontSize: 13,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
    minHeight: 50,
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  fieldError: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 4,
  },
  fieldBlock: {
    marginBottom: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 12,
    minHeight: 64,
  },
  optionPressed: {
    opacity: 0.9,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  optionLabelSelected: {
    color: colors.primaryDark,
  },
  optionSub: {
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: spacing.xs,
    lineHeight: 17,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  requirementHint: {
    ...typography.body,
    fontSize: 12.5,
    color: colors.inkMuted,
    marginBottom: spacing.sm,
    lineHeight: 17,
  },
});
