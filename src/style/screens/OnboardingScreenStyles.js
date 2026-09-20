import { StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme/colors';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: 20,
    paddingTop: 18,
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
  content: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 24,
  },
  eyebrow: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: 10,
    letterSpacing: 0.3,
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
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.ink,
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
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    marginLeft: 12,
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
  },
});