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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    ...typography.h1,
    color: colors.ink,
  },
  dateText: {
    ...typography.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  leafBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
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
  mealGroupTitle: {
    ...typography.label,
    color: colors.inkMuted,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },

  /* ---------------------------- reflective card -------------------------- */
  reflectBody: {
    ...typography.body,
    fontSize: 13.5,
    color: colors.primaryDark,
    lineHeight: 20,
    marginTop: spacing.sm,
  },

  /* ------------------------------ goal card ------------------------------ */
  goalKcal: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.ink,
    marginTop: spacing.sm,
  },
  goalMacros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  goalMacroItem: {
    fontSize: 13,
    color: colors.inkMuted,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  goalDisclaimer: {
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: spacing.md,
  },
  goalLinkRow: {
    marginTop: spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },

  /* ------------------------------- actions ------------------------------- */
  actions: {
    gap: spacing.sm,
  },
});
