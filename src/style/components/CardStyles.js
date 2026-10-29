import { StyleSheet } from 'react-native';
import { colors, radius, spacing, shadows } from '../../theme/colors';

export default StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.mdl,
  },
  surface: {
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  mint: {
    backgroundColor: colors.mint,
  },
  dashed: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },
});
