import { StyleSheet } from 'react-native';
import { colors, radius, spacing, touch } from '../../theme/colors';

export default StyleSheet.create({
  base: {
    borderRadius: radius.button,
    minHeight: 54,
    paddingVertical: spacing.smd,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: {
    minHeight: touch.min,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  solid: {
    backgroundColor: colors.primary,
    boxShadow: '0px 6px 12px rgba(27, 61, 47, 0.16)',
    elevation: 3,
  },
  soft: {
    backgroundColor: colors.mint,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
  },
  icon: { marginRight: spacing.sm },
  text: { fontSize: 16, lineHeight: 24, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
});
