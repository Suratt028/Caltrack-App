import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/colors';

export default StyleSheet.create({
  wrap: {
    width: '100%',
  },
  canvas: {
    width: '100%',
    minHeight: 168,
    alignItems: 'flex-start',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 13,
    color: colors.inkMuted,
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
