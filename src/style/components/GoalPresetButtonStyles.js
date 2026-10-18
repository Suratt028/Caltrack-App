import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme/colors';

export default StyleSheet.create({
  base: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  active: {
    borderColor: colors.primary,
    backgroundColor: colors.mint,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  textWrap: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  kcal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
  unit: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  macros: {
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },
  check: {
    marginLeft: spacing.sm,
  },
});
