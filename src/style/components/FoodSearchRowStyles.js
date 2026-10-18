import { StyleSheet } from 'react-native';
import { colors, radius, spacing, shadows, typography } from '../../theme/colors';

export default StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 68,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: 10,
    ...shadows.soft,
  },
  main: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing.sm,
  },
  name: {
    ...typography.bodyBold,
    color: colors.ink,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.inkMuted,
    marginTop: 2,
  },
  kcal: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'right',
    marginRight: spacing.sm,
  },
  kcalUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.inkMuted,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnPressed: {
    backgroundColor: colors.primarySoft,
    opacity: 0.85,
  },
});
