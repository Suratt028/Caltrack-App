import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export default StyleSheet.create({
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    top: '36%',
  },

  value: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
    color: colors.ink,
  },

  unit: {
    marginTop: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },

  caption: {
    marginTop: 7,
    fontSize: 11,
    fontWeight: '600',
    color: colors.inkMuted,
  },
});
