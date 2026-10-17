import { StyleSheet } from 'react-native';
import { colors, radius, spacing, shadows, typography } from '../../theme/colors';

export default StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    ...shadows.soft,
  },
  rowPressed: {
    opacity: 0.92,
  },
  main: {
    flex: 1,
  },
  name: {
    ...typography.bodyBold,
    color: colors.ink,
    lineHeight: 20,
  },
  subtitle: {
    ...typography.body,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },
  kcal: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
    marginLeft: spacing.sm,
  },
  removeBtn: {
    marginLeft: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerSoft,
  },
  removeBtnPressed: {
    opacity: 0.7,
  },
});
