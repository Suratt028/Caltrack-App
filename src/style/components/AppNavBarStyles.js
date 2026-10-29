import { StyleSheet } from 'react-native';
import { colors, radius, spacing, touch, typography } from '../../theme/colors';

export default StyleSheet.create({
  pressed: { opacity: 0.75 },

  /* brand */
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { ...typography.h2, color: colors.primary },

  /* bottom (phone) */
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  bottomItem: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomIcon: {
    width: 56,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomIconActive: { backgroundColor: colors.mint },
  bottomLabel: { fontSize: 12, lineHeight: 18, color: colors.inkMuted, marginTop: 2 },
  bottomLabelActive: { fontWeight: '700', color: colors.primaryDark },

  /* top (tablet) */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 28,
    minHeight: 72,
  },
  topLinks: { flexDirection: 'row', gap: spacing.xs },
  topLink: {
    minHeight: touch.min,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    justifyContent: 'center',
  },
  topLinkActive: { backgroundColor: colors.mint },
  topLinkText: { ...typography.bodyBold, color: colors.inkMuted },
  topLinkTextActive: { color: colors.primaryDark, fontWeight: '700' },

  profileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: touch.min,
    paddingLeft: 4,
    paddingRight: spacing.md,
    borderRadius: radius.pill,
    maxWidth: 200,
  },
  profileChipActive: { backgroundColor: colors.mint },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: { ...typography.label, color: colors.ink, flexShrink: 1 },

  /* side (desktop) */
  sideBar: {
    width: 232,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  sideBrand: { paddingHorizontal: spacing.sm, marginBottom: spacing.xl },
  sideItems: { gap: spacing.xs },
  sideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smd,
    minHeight: touch.comfortable,
    paddingHorizontal: spacing.smd,
    borderRadius: radius.sm,
  },
  sideItemActive: { backgroundColor: colors.mint },
  sideLabel: { ...typography.body, color: colors.inkMuted },
  sideLabelActive: { fontWeight: '700', color: colors.primaryDark },
  sideNote: { marginTop: spacing.xxl, paddingHorizontal: spacing.smd, gap: spacing.sm },
  sideNoteTitle: { ...typography.label, color: colors.ink },
  sideNoteBody: { ...typography.small, color: colors.inkMuted },
});
