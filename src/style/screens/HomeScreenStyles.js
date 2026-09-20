import { StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme/colors';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 20,
    paddingTop: 22,
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  coachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
    boxShadow: '0px 5px 12px rgba(47, 143, 107, 0.1)',
    elevation: 2,
  },
  coachMascot: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  coachEmoji: {
    fontSize: 22,
  },
  coachText: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  ringCard: {
    alignItems: 'center',
    paddingVertical: 22,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  remainingCaption: {
    color: colors.inkMuted,
    fontSize: 13,
    marginTop: -spacing.sm,
    marginBottom: 10,
  },
  macroRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    marginTop: 4,
  },
  macroChip: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryChip: {
    backgroundColor: colors.primarySoft,
  },
  turmericChip: {
    backgroundColor: colors.turmericSoft,
  },
  skyChip: {
    backgroundColor: '#DCEAF7',
  },
  macroEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  primaryText: {
    color: colors.primaryDark,
  },
  turmericText: {
    color: colors.turmeric,
  },
  skyText: {
    color: '#4C8FC0',
  },
  macroLabel: {
    color: colors.inkMuted,
    fontSize: 10,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  quickAction: {
    flex: 1,
    minHeight: 82,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    justifyContent: 'center',
    boxShadow: '0px 5px 10px rgba(43, 36, 32, 0.05)',
    elevation: 2,
  },
  quickActionAccent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickIcon: {
    color: colors.turmeric,
    fontSize: 26,
    fontWeight: '300',
    lineHeight: 28,
  },
  quickIconAccent: {
    color: colors.turmericSoft,
  },
  quickLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  quickLabelAccent: {
    color: colors.white,
  },
  macroCard: {
    marginTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHint: {
    color: colors.inkFaint,
    fontSize: 11,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  mealCount: {
    color: colors.inkFaint,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.inkMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});