import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography, shadows } from '../../theme/colors';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
    paddingBottom: 40,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnPressed: {
    opacity: 0.75,
    backgroundColor: colors.mint,
  },

  // Food identity card
  identityName: {
    ...typography.h3,
    color: colors.ink,
  },
  identityMeta: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  identityKcal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: 6,
  },

  // Controls card
  sectionCard: {
    marginTop: spacing.md,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  mealWrap: {
    marginBottom: spacing.md,
  },
  unitLabel: {
    marginTop: spacing.md,
  },

  // Live calculation card
  calcCard: {
    marginTop: spacing.md,
    backgroundColor: colors.mint,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    ...shadows.soft,
  },
  calcLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  calcKcalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: spacing.xs,
  },
  calcKcal: {
    ...typography.stat,
    color: colors.ink,
  },
  calcKcalUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryDark,
    marginLeft: 6,
    marginBottom: 8,
  },
  calcMacros: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
    marginTop: spacing.sm,
  },
  calcNote: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },

  hint: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.inkMuted,
    lineHeight: 18,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  confirmBtn: {
    width: '100%',
  },
});
