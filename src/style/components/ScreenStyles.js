import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/colors';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
  },
  column: {
    width: '100%',
    alignSelf: 'center',
    paddingTop: spacing.mdl,
    paddingBottom: spacing.xxl,
  },
});
