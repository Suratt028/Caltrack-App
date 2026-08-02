import { StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme/colors';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  title: {
    ...typography.h1,
    color: colors.ink,
    marginBottom: 6,
  },

  subtitle: {
    ...typography.body,
    color: colors.inkMuted,
    marginBottom: spacing.lg,
  },

  periodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  periodChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },

  periodChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },

  periodChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkMuted,
  },

  periodChipTextActive: {
    color: colors.primaryDark,
  },

  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  summaryCard: {
    flex: 1,
    padding: spacing.md,
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
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  cardTitle: {
    ...typography.h2,
    color: colors.ink,
    marginBottom: spacing.xs,
  },

  cardSubtitle: {
    ...typography.body,
    color: colors.inkMuted,
    marginBottom: spacing.lg,
  },

  chartContainer: {
    width: '100%',
    minHeight: 220,
    justifyContent: 'center',
  },

  chartPlaceholder: {
    height: 180,
    borderRadius: radius.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chartPlaceholderText: {
    fontSize: 14,
    color: colors.inkMuted,
    textAlign: 'center',
  },

  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
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

  legendText: {
    fontSize: 12,
    color: colors.inkMuted,
  },

  insightBox: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },

  insightTitle: {
    ...typography.bodyBold,
    color: colors.primaryDark,
    marginBottom: 4,
  },

  insightText: {
    ...typography.body,
    color: colors.ink,
    lineHeight: 21,
  },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },

  emptyStateTitle: {
    ...typography.h2,
    color: colors.ink,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },

  emptyStateText: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'center',
  },
});