import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export default StyleSheet.create({
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  caption: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkMuted,
  },
});
