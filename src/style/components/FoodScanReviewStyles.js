import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/colors';

export default StyleSheet.create({
  title: {
    ...typography.h3,
    color: colors.ink,
  },
  helper: {
    ...typography.body,
    fontSize: 13,
    color: colors.inkMuted,
    lineHeight: 19,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.75,
  },

  /* ------------------------------ item card ------------------------------ */
  itemCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  itemCardExcluded: {
    backgroundColor: colors.surfaceMuted,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
  },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  itemHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    ...typography.h3,
    color: colors.ink,
  },
  itemMeta: {
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkMuted,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  /* -------------------------------- chips -------------------------------- */
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 40,
    maxWidth: '100%',
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipDashed: {
    borderStyle: 'dashed',
    borderColor: colors.inkFaint,
    backgroundColor: 'transparent',
  },
  chipText: {
    fontSize: 14,
    color: colors.ink,
    flexShrink: 1,
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
  chipTextLink: {
    color: colors.primary,
    fontWeight: '600',
  },

  /* -------------------------------- search ------------------------------- */
  searchBlock: {
    marginTop: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
  },
  inputInvalid: {
    borderColor: colors.danger,
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
  },
  searchBtn: {
    minWidth: 52,
    minHeight: 44,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    marginLeft: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResult: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
    minHeight: 48,
    justifyContent: 'center',
  },
  searchResultName: {
    color: colors.ink,
    fontWeight: '700',
    fontSize: 14,
  },
  searchResultMeta: {
    color: colors.inkMuted,
    fontSize: 13,
    marginTop: 2,
  },
  searchError: {
    color: colors.inkMuted,
    fontSize: 13,
    marginTop: spacing.sm,
  },

  /* ------------------------------- portion ------------------------------- */
  portionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  portionChip: {
    width: 46,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionChipText: {
    fontSize: 15,
    color: colors.ink,
  },
  gramsBox: {
    flex: 1,
    minWidth: 72,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
  },
  gramsInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    color: colors.ink,
    textAlign: 'right',
    paddingVertical: 0,
  },
  gramsUnit: {
    fontSize: 13,
    color: colors.inkMuted,
    marginLeft: 4,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemMacros: {
    flex: 1,
    fontSize: 13,
    color: colors.inkMuted,
  },
  itemKcal: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
  },
  itemKcalUnit: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.inkMuted,
  },

  /* ------------------------------- actions ------------------------------- */
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginBottom: spacing.md,
  },
  addBtnText: {
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: spacing.xs,
  },
  totalsCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  totalsHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  totalsTitle: {
    ...typography.label,
    fontSize: 14,
    color: colors.primaryDark,
  },
  totalsKcal: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.ink,
  },
  totalsKcalUnit: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.inkMuted,
  },
  totalsMacroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  macroText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink,
  },
  cancelBtn: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  errorBlock: {
    marginBottom: spacing.sm,
  },
});
