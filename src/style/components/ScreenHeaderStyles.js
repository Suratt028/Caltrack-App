import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme/colors';

export default StyleSheet.create({
  wrap: {
    marginBottom: spacing.mdl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    marginRight: spacing.smd,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
  },
  right: {
    marginLeft: spacing.sm,
  },
  title: {
    ...typography.h1,
    color: colors.ink,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.inkMuted,
  },
});
