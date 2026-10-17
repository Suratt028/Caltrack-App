import { StyleSheet } from 'react-native';
import { colors, radius, spacing, shadows } from '../../theme/colors';

export default StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
});
