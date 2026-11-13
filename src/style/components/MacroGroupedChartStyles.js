import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/colors';

const PAD_LEFT = 34;

export default StyleSheet.create({
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendSwatch: {
    width: 9,
    height: 9,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: colors.inkMuted,
  },
  canvas: {
    width: '100%',
    minHeight: 170,
    position: 'relative',
  },
  hitTargets: {
    position: 'absolute',
    left: PAD_LEFT,
    top: 0,
    height: 170,
    flexDirection: 'row',
  },
  hitTarget: {
    flex: 1,
  },
});
