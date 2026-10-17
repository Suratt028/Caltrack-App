import { StyleSheet } from 'react-native';
import { colors, radius, spacing, shadows } from '../../theme/colors';

export default StyleSheet.create({
  base: {
    borderRadius: radius.button,
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  compact: {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  solid: {
    backgroundColor: colors.primary,
    boxShadow: '0px 6px 12px rgba(27, 61, 47, 0.18)',
    elevation: 3,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { marginRight: spacing.sm },
  text: { fontSize: 15, fontWeight: '700' },
  textSolid: { color: colors.white },
  textOutline: { color: colors.ink },
});
