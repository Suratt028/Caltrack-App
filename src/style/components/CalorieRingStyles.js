import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export default StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    // absoluteFillObject is gone in RN 0.86 (spreading it was a no-op); absoluteFill is the plain object.
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: colors.ink,
    lineHeight: 46,
  },
  unit: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkMuted,
  },
  unitOver: {
    color: colors.carbStrong,
  },
  caption: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  captionOver: {
    color: colors.carbStrong,
  },
});
