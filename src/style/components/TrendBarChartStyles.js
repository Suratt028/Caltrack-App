import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/colors';

export default StyleSheet.create({
  wrap: {
    width: '100%',
  },
  canvas: {
    width: '100%',
    minHeight: 176,
    alignItems: 'flex-start',
  },
  caption: {
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.inkMuted,
    marginTop: spacing.sm,
  },
  // Visually hidden but still announced by screen readers.
  srOnly: {
    position: 'absolute',
    left: 0,
    top: 0,
    opacity: 0,
    fontSize: 11,
    lineHeight: 14,
  },
});
