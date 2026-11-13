import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/colors';

export default StyleSheet.create({
  title: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.sm,
  },

  // Value + category
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  value: {
    fontSize: 40,
    lineHeight: 52,
    fontWeight: '800',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  summaryText: {
    flexShrink: 1,
    gap: 4,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  unit: {
    fontSize: 13,
    color: colors.inkFaint,
  },

  // Body shapes
  figureRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: spacing.md,
  },
  figureItem: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  figureBadgeSlot: {
    height: 26,
    justifyContent: 'center',
  },
  figureBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  figureBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
    fontVariant: ['tabular-nums'],
  },
  figureRange: {
    marginTop: 6,
    fontSize: 13,
    color: colors.inkMuted,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },

  // Healthy weight for height
  healthyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.mint,
    marginBottom: spacing.sm,
  },
  healthyText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: colors.primaryDark,
  },
  healthyStrong: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  // Advice
  hintBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    marginBottom: spacing.md,
  },
  hintIcon: {
    marginTop: 1,
  },
  hintText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: colors.inkMuted,
  },

  // Reference table
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  tableRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  tableName: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
  },
  youChip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  youChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tableRange: {
    fontSize: 14,
    color: colors.inkMuted,
    fontVariant: ['tabular-nums'],
    minWidth: 84,
    textAlign: 'right',
  },
  note: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkMuted,
    marginTop: spacing.sm,
  },
});
