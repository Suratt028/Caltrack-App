import { StyleSheet } from 'react-native';
import { colors, radius, shadows, touch } from '../../theme/colors';

export default StyleSheet.create({
  base: {
    minWidth: touch.min,
    minHeight: touch.min,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  surface: {
    width: 48,
    height: 48,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  soft: {
    width: 44,
    height: 44,
    backgroundColor: colors.mint,
  },
  ghost: {
    width: 44,
    height: 44,
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.75,
  },
});
