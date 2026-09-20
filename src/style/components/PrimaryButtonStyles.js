import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme/colors';

export default StyleSheet.create({
  base: {
    borderRadius: radius.md,
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 6px 10px rgba(47, 143, 107, 0.16)',
    elevation: 3,
  },
  solid: { backgroundColor: colors.primary },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border },
  disabled: { opacity: 0.5 },
  text: { fontSize: 15, fontWeight: '700' },
  textSolid: { color: colors.white },
  textOutline: { color: colors.ink },
});
