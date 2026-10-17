import { StyleSheet } from 'react-native';
import { colors, spacing, typography, radius, shadows } from '../../theme/colors';

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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  eyebrow: {
    ...typography.bodyBold,
    color: colors.primary,
    fontSize: 13,
    marginBottom: 2,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.ink,
  },
  dateText: {
    ...typography.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
    ...shadows.soft,
  },
  avatarText: {
    color: colors.primaryDark,
    fontSize: 19,
    fontWeight: '800',
  },
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coachIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  coachText: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 20,
  },
  ringCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
  },
  ringCaption: {
    color: colors.inkMuted,
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  ringCaptionStrong: {
    color: colors.ink,
    fontWeight: '700',
  },
  ringStatsRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: spacing.md,
  },
  ringStat: {
    flex: 1,
    alignItems: 'center',
  },
  ringStatDivider: {
    width: 1,
    backgroundColor: colors.border,
    alignSelf: 'stretch',
  },
  ringStatValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.ink,
  },
  ringStatLabel: {
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  quickAction: {
    flex: 1,
    minHeight: 104,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadows.card,
  },
  quickActionPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  quickActionAccent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickIconWrapAccent: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  quickLabel: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  quickLabelAccent: {
    color: colors.white,
  },
  quickHint: {
    color: colors.inkMuted,
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },
  quickHintAccent: {
    color: 'rgba(255,255,255,0.85)',
  },
  macroCard: {
    marginTop: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.ink,
  },
  sectionHint: {
    color: colors.inkMuted,
    fontSize: 12,
  },
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  mealCount: {
    color: colors.inkMuted,
    fontSize: 12,
  },
  mealGroup: {
    marginBottom: spacing.md,
  },
  mealGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  mealGroupTitle: {
    ...typography.label,
    color: colors.ink,
  },
  mealGroupKcal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  emptyWrap: {
    marginTop: spacing.xs,
  },
});
