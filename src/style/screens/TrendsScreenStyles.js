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

  // Range picker + date navigator
  controlsRow: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  controlsRowWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  segmentWrap: {
    width: '100%',
    maxWidth: 320,
  },
  navigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  navigatorWide: {
    flex: 1,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.icon,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnPressed: {
    backgroundColor: colors.mint,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navLabel: {
    ...typography.label,
    flex: 1,
    textAlign: 'center',
    color: colors.inkMuted,
  },

  // Custom range card
  customCard: {
    marginBottom: spacing.md,
  },
  customRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  fieldWrap: {
    flexGrow: 1,
    flexBasis: 130,
  },
  fieldLabel: {
    ...typography.caption,
    color: colors.inkMuted,
    marginBottom: spacing.xs,
  },
  fieldInput: {
    minHeight: 46,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
  },
  customHint: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.inkMuted,
    marginTop: spacing.sm,
  },

  // Insufficient state + CTA
  tipCard: {
    marginBottom: spacing.md,
  },
  cta: {
    marginBottom: spacing.md,
  },

  // Mint summary + reminder cards
  mintCard: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
    marginBottom: spacing.md,
  },
  summaryHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  mintLabel: {
    ...typography.label,
    color: colors.inkMuted,
    flexShrink: 1,
  },
  chip: {
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  summaryValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: spacing.xs,
  },
  summaryValue: {
    ...typography.display,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  summaryUnit: {
    ...typography.body,
    color: colors.inkMuted,
  },
  mintNote: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  reminderTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  reminderBody: {
    ...typography.body,
    lineHeight: 22,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },

  // Stat cards
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flexBasis: '100%',
    flexGrow: 1,
  },
  statCardWide: {
    flexBasis: '30%',
    flexGrow: 1,
  },

  // Chart cards
  chartCard: {
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    ...typography.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkMuted,
    marginBottom: spacing.sm,
  },
  cardNote: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkMuted,
    marginBottom: spacing.sm,
  },
  cardBody: {
    ...typography.body,
    lineHeight: 22,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  selectedDay: {
    ...typography.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkMuted,
    marginTop: spacing.sm,
  },

  // Table card
  tableCard: {
    marginBottom: spacing.md,
  },

  // Weight feature card
  weightCard: {
    marginBottom: spacing.md,
  },
  chartWrap: {
    width: '100%',
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  weightInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  weightInput: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.ink,
    marginRight: spacing.sm,
    minHeight: 50,
  },
  weightButton: {
    minWidth: 104,
  },
  bannerSpacing: {
    marginTop: spacing.sm,
  },
});
