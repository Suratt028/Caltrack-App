import { StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme/colors';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 20,
    paddingBottom: 36,
  },
  title: {
    ...typography.h1,
    color: colors.ink,
    marginBottom: 6,
  },
  subtitle: {
    ...typography.body,
    color: colors.inkMuted,
    marginBottom: 16,
  },
  periodRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: 16,
  },
  periodChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  periodChipActive: {
    backgroundColor: colors.primary,
  },
  periodChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  periodChipTextActive: {
    color: colors.white,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
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
    ...typography.h2,
    color: colors.ink,
    marginBottom: 8,
    fontSize: 15,
  },
  cardSubtitle: {
    ...typography.body,
    color: colors.inkMuted,
    marginBottom: 12,
    fontSize: 12,
  },
  chartContainer: {
    width: '100%',
    minHeight: 180,
    justifyContent: 'center',
  },
  chartPlaceholder: {
    height: 170,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
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
    gap: 12,
    marginTop: 12,
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
    borderWidth: 1,
    borderColor: '#D7E9E1',
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyStateTitle: {
    ...typography.h2,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'center',
  },
});