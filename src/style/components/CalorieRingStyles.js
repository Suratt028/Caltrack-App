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
    paddingHorizontal: 18,
  },
  value: {
    // fontSize / lineHeight are set from the ring size. Noto Sans Thai's ascent
    // is tall, so the line box stays ≥ 1.3× the size or the digits clip on iOS.
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.6,
  },
  unit: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.inkMuted,
  },
  caption: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.inkMuted,
  },
});
