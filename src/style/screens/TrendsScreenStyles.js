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
  },
  title: {
    ...typography.h1,
    color: colors.ink,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: 4,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  periodChip: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodChipPressed: {
    opacity: 0.8,
  },
  periodChipActive: {
    backgroundColor: colors.primary,
  },
  periodChipText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.inkMuted,
  },
  periodChipTextActive: {
    color: colors.white,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  summaryCard: {
    flex: 1,
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.inkMuted,
    marginBottom: 6,
  },
  summaryValue: {
    ...typography.h2,
    color: colors.ink,
  },
  summaryUnit: {
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.xs,
  },
  cardSubtitle: {
    ...typography.body,
    color: colors.inkMuted,
    marginBottom: spacing.sm,
    fontSize: 12,
    lineHeight: 18,
  },
  chartWrap: {
    width: '100%',
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginRight: 6,
  },
  legendLine: {
    width: 14,
    height: 0,
    borderTopWidth: 2,
    borderTopColor: colors.inkFaint,
    borderStyle: 'dashed',
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.inkMuted,
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
  insightBox: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#C6E6D6',
  },
  insightTitle: {
    ...typography.bodyBold,
    color: colors.primaryDark,
    marginBottom: spacing.xs,
  },
  insightText: {
    ...typography.body,
    color: colors.ink,
    lineHeight: 21,
  },
  emptyWrap: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
});
