import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography, shadows } from '../../theme/colors';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: spacing.sm,
    paddingBottom: 40,
  },
  mealWrap: {
    maxWidth: 340,
    marginBottom: spacing.md,
  },

  // Search field
  searchWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.input,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: 14,
    zIndex: 2,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 12,
    paddingLeft: 44,
    paddingRight: 48,
    fontSize: 15,
    color: colors.ink,
    textAlignVertical: 'center',
  },
  clearBtn: {
    position: 'absolute',
    right: 2,
    top: 2,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  clearBtnPressed: {
    backgroundColor: colors.mint,
  },

  // Results
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 20,
    ...shadows.soft,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.inkMuted,
  },
  emptyCard: {
    padding: spacing.xs,
  },

  // Add manually
  manualSection: {
    marginTop: spacing.lg,
  },
  manualToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadows.soft,
  },
  manualTogglePressed: {
    borderColor: colors.primary,
    opacity: 0.95,
  },
  manualTile: {
    width: 40,
    height: 40,
    borderRadius: radius.icon,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualTextCol: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: spacing.sm,
  },
  manualTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  manualSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.inkMuted,
    marginTop: 2,
  },
  chevron: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  manualForm: {
    marginTop: spacing.sm,
  },
  inputGroup: {
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.ink,
    marginBottom: 6,
  },
  manualInput: {
    minHeight: 44,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.ink,
    textAlignVertical: 'center',
  },
  manualActions: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  actionGap: {
    marginRight: spacing.sm,
  },

  // Bottom info notice
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.mint,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  noticeIcon: {
    marginTop: 1,
  },
  noticeTextCol: {
    flex: 1,
    minWidth: 0,
  },
  noticeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  noticeSub: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.inkMuted,
    marginTop: spacing.xs,
    lineHeight: 17,
  },
});
