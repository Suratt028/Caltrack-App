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
    paddingBottom: 48,
  },

  /* ------------------------------- header -------------------------------- */
  greetingSmall: {
    ...typography.body,
    color: colors.inkMuted,
    marginBottom: spacing.sm,
  },
  dateSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  dateArrow: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCenter: {
    flex: 1,
    alignItems: 'center',
  },
  dateTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  dateText: {
    fontSize: 13,
    color: colors.inkMuted,
  },
  backToToday: {
    alignSelf: 'center',
    minHeight: 32,
    justifyContent: 'center',
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
  },
  leafBtnPressed: {
    opacity: 0.75,
  },
  banner: {
    marginBottom: spacing.md,
  },

  /* ------------------------------ shared --------------------------------- */
  block: {
    marginBottom: spacing.md,
  },
  mintCard: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  linkText: {
    ...typography.label,
    fontSize: 12,
    color: colors.primary,
  },

  /* ---------------------------- energy card ------------------------------ */
  energyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  energyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  energyStats: {
    flex: 1,
    minWidth: 0,
    gap: spacing.md,
    alignItems: 'flex-start',
  },
  statLabel: {
    fontSize: 12,
    color: colors.inkMuted,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 2,
  },
  statValueSm: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 2,
  },
  statUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.inkMuted,
  },
  overText: {
    ...typography.label,
    fontSize: 13,
    color: colors.carbStrong,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  macroCell: {
    flex: 1,
    minWidth: 0,
  },

  /* ----------------------------- no-goal cards --------------------------- */
  sproutTile: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  noGoalTitle: {
    ...typography.h3,
    color: colors.ink,
    marginTop: spacing.xs,
  },
  noGoalDesc: {
    ...typography.body,
    fontSize: 13.5,
    color: colors.primaryDark,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  noGoalCta: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
  bigKcal: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.ink,
    marginTop: spacing.sm,
  },
  bigKcalUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.inkMuted,
  },
  explainText: {
    ...typography.body,
    fontSize: 13,
    color: colors.inkMuted,
    lineHeight: 20,
    marginTop: spacing.sm,
  },

  /* --------------------------- food today list --------------------------- */
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  countText: {
    fontSize: 12,
    color: colors.inkMuted,
  },
  mealGroup: {
    marginBottom: spacing.md,
  },
  mealGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    marginBottom: spacing.xs,
    paddingLeft: spacing.xs,
  },
  mealGroupTitle: {
    ...typography.bodyBold,
    flex: 1,
    color: colors.ink,
  },
  mealGroupEmpty: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.inkMuted,
  },
  mealGroupKcal: {
    ...typography.label,
    color: colors.inkMuted,
  },
  mealAddBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ---------------------------- reflective card -------------------------- */
  reflectBody: {
    ...typography.body,
    fontSize: 13.5,
    color: colors.primaryDark,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
});
