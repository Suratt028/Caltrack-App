import { StyleSheet } from 'react-native';
import { colors, spacing, typography, radius, shadows, touch } from '../../theme/colors';

export default StyleSheet.create({
  pressed: { opacity: 0.75 },
  block: { marginBottom: spacing.mdl },
  banner: { marginBottom: spacing.md },

  /* ------------------------------- header -------------------------------- */
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.smd,
    marginBottom: spacing.mdl,
  },
  headerText: { flex: 1, minWidth: 0 },
  title: { ...typography.h1, color: colors.ink },
  subtitle: { ...typography.bodySm, color: colors.inkMuted },
  dayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    ...shadows.soft,
  },
  dayPillCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  dayPillText: { ...typography.label, color: colors.ink },

  /* -------------------------------- layout ------------------------------- */
  columns: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.lg },
  colNarrow: { flex: 4, minWidth: 0 },
  colWide: { flex: 6, minWidth: 0 },
  colHalf: { flex: 1, minWidth: 0 },
  // Desktop grid: left column ≈ 1/3, right area holds next-meal + last-meal.
  colLeft: { flex: 34, minWidth: 0 },
  colRight: { flex: 66, minWidth: 0 },
  columnsTight: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.mdl },
  colNext: { flex: 64, minWidth: 0 },
  colLast: { flex: 36, minWidth: 0 },
  lastMealCard: { flex: 1, padding: spacing.md },
  lastMealArt: {
    aspectRatio: 1.25,
    borderRadius: radius.md,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.smd,
  },
  lastMealMeta: { ...typography.small, color: colors.inkMuted },
  lastMealBody: { ...typography.small, color: colors.inkMuted, marginTop: spacing.xs },

  /* -------------------------------- cards -------------------------------- */
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  cardTitle: { ...typography.h3, color: colors.ink },
  cardTitleLg: { ...typography.h2, color: colors.ink },
  cardBody: { ...typography.body, color: colors.inkMuted, marginTop: spacing.sm },
  cardActions: { marginTop: spacing.mdl },
  linkHit: { minHeight: touch.min, justifyContent: 'center' },
  linkText: { ...typography.label, color: colors.primary },
  linkTextStrong: { ...typography.bodyBold, fontWeight: '700', color: colors.primaryDark },

  /* ----------------------------- energy card ----------------------------- */
  energyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.mdl,
    marginTop: spacing.xs,
  },
  energyStats: { flex: 1, minWidth: 0, gap: spacing.md },
  statLabel: { ...typography.bodySm, color: colors.inkMuted },
  statValue: { ...typography.statMd, color: colors.ink },
  statValueSm: { ...typography.statSm, color: colors.ink },
  statUnit: { fontSize: 13, fontWeight: '600', color: colors.ink },
  overNote: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.smd,
    borderRadius: radius.sm,
    backgroundColor: colors.warnBg,
  },
  overText: { ...typography.label, color: colors.carbStrong, textAlign: 'center' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.mdl },
  macroGrid: { flexDirection: 'row', gap: spacing.md },

  /* ------------------------------ no goal -------------------------------- */
  welcomeCard: { padding: spacing.lg },
  sproutTile: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.mdl,
  },
  welcomeTitle: { ...typography.h1, fontSize: 24, lineHeight: 36, color: colors.ink },
  welcomeBody: { ...typography.body, color: colors.inkMuted, marginTop: spacing.smd },
  welcomeCta: { marginTop: spacing.mdl },
  bigKcal: { ...typography.statMd, fontSize: 32, lineHeight: 44, color: colors.ink, marginTop: spacing.sm },
  explainBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.mint,
  },
  explainTitle: { ...typography.bodyBold, fontWeight: '700', color: colors.ink },
  explainText: { ...typography.small, color: colors.inkMuted, marginTop: spacing.xxs },

  /* ------------------------------ actions -------------------------------- */
  actions: { gap: spacing.smd },
  latestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  latestText: { ...typography.bodySm, color: colors.inkMuted, flex: 1 },

  /* ----------------------------- food list ------------------------------- */
  mealSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 72,
    paddingHorizontal: spacing.mdl,
    paddingVertical: spacing.smd,
    marginBottom: spacing.smd,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  mealSlotText: { flex: 1, minWidth: 0 },
  mealSlotTitle: { ...typography.bodyBold, fontWeight: '700', color: colors.ink },
  mealSlotBody: { ...typography.small, color: colors.inkMuted },

  /* ---------------------------- reflective card -------------------------- */
  reflectHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reflectBody: { ...typography.body, color: colors.primaryDark, marginTop: spacing.smd },
});
