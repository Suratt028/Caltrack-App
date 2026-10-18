import { StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme/colors';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  // ----- Name card -----
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  identityInfo: {
    flex: 1,
  },
  identityName: {
    ...typography.h3,
    color: colors.ink,
  },
  identityMeta: {
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.inkMuted,
    marginBottom: spacing.xs,
  },
  nameInput: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minHeight: 48,
    fontSize: 16,
    color: colors.ink,
  },
  // ----- Shared section pieces -----
  cardSpacing: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    ...typography.body,
    fontSize: 12.5,
    color: colors.inkMuted,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  label: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
    minHeight: 48,
    fontSize: 16,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  inputError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  inputHint: {
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  inputHintError: {
    color: colors.danger,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionRowLast: {
    borderBottomWidth: 0,
  },
  optionTextWrap: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  optionText: {
    fontSize: 14,
    color: colors.ink,
    fontWeight: '700',
  },
  optionSub: {
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
    lineHeight: 17,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  // ----- Goal card -----
  goalSummary: {
    backgroundColor: colors.mint,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  goalSummaryTitle: {
    ...typography.label,
    color: colors.primaryDark,
    marginBottom: spacing.sm,
  },
  goalValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  goalValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.ink,
  },
  goalUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
    marginLeft: spacing.xs,
  },
  goalMacroRow: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryDark,
    marginTop: spacing.xs,
  },
  goalNote: {
    fontSize: 12,
    color: colors.primaryDark,
    marginTop: spacing.sm,
    lineHeight: 17,
  },
  previewHint: {
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: spacing.sm,
    lineHeight: 17,
  },
  placeholderCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  placeholderIcon: {
    marginTop: 2,
    marginRight: spacing.sm,
  },
  placeholderTextWrap: {
    flex: 1,
  },
  placeholderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  placeholderBody: {
    fontSize: 13.5,
    color: colors.inkMuted,
    marginTop: 2,
    lineHeight: 20,
  },
  legend: {
    ...typography.label,
    color: colors.inkMuted,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetItem: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flexBasis: '46%',
    flexGrow: 1,
  },
  savedWrap: {
    marginTop: spacing.md,
  },
  activityHint: {
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: spacing.sm,
    lineHeight: 17,
  },
  // ----- Support -----
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  supportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  supportText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
    flex: 1,
  },
  // ----- Footer actions -----
  footerActions: {
    marginTop: spacing.lg,
    alignItems: 'stretch',
  },
  footerBtn: {
    marginBottom: spacing.sm,
  },
  resetBtn: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  resetBtnPressed: {
    opacity: 0.85,
  },
  resetText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 14,
  },
  footerHint: {
    fontSize: 12,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 17,
  },
});
