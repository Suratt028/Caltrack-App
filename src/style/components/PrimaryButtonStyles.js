import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme/colors';

export default StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solid: { backgroundColor: colors.primary },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  disabled: { opacity: 0.5 },
  text: { fontSize: 15, fontWeight: '700' },
  textSolid: { color: colors.white },
  textOutline: { color: colors.primary },
});
