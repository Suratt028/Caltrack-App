import { StyleSheet } from 'react-native';
import { colors, radius, spacing, shadows, typography } from '../../theme/colors';

export default StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.mdl,
    marginBottom: spacing.smd,
    ...shadows.soft,
  },
  rowPressed: { opacity: 0.85, transform: [{ scale: 0.995 }] },
  tile: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: { flex: 1, minWidth: 0 },
  eyebrow: { ...typography.small, color: colors.primary },
  name: { ...typography.h3, fontWeight: '400', color: colors.ink },
  nameMatch: { fontWeight: '700' },
  subtitle: { ...typography.bodySm, color: colors.inkMuted },
  kcal: { ...typography.bodyBold, fontWeight: '700', color: colors.ink, marginTop: 2 },
  kcalSuffix: { ...typography.small, color: colors.inkMuted },
  tag: { ...typography.small, color: colors.primary, marginTop: 2 },
  addBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
