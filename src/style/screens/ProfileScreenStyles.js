import { StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme/colors';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  title: {
    ...typography.h1,
    color: colors.ink,
    marginBottom: 18,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
  },
  profileMeta: {
    fontSize: 13,
    color: colors.inkMuted,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.ink,
    marginBottom: spacing.md,
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: 18,
    paddingVertical: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  label: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    color: colors.inkMuted,
    fontSize: 13,
    fontWeight: '600',
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
    marginTop: spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  radioActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: colors.ink,
    fontWeight: '600',
  },
  resetBtn: {
    alignItems: 'center',
    marginTop: spacing.xl,
    padding: spacing.sm,
  },
  resetText: {
    color: colors.chili,
    fontWeight: '700',
    fontSize: 13,
  },
  logoutText: {
    color: colors.inkMuted,
    fontWeight: '700',
    fontSize: 13,
  },
});