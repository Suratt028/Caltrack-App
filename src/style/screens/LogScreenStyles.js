import { StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme/colors';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 14,
  },
  title: {
    ...typography.h1,
    color: colors.ink,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  search: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
    paddingVertical: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 32,
  },
  emptyText: {
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(22, 34, 31, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 28,
    boxShadow: '0px -8px 20px rgba(43, 36, 32, 0.14)',
    elevation: 12,
  },
  modalTitle: {
    ...typography.h1,
    color: colors.ink,
  },
  modalSubtitle: {
    color: colors.inkMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...typography.bodyBold,
    color: colors.ink,
    marginBottom: spacing.xs,
    fontSize: 13,
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  mealRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  mealChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  mealChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  mealChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  mealChipTextActive: {
    color: colors.primaryDark,
  },
  summaryBox: {
    backgroundColor: colors.turmericSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  summaryKcal: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
  },
  summaryMacro: {
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
  },
});