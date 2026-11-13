import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme/colors';

export default StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...typography.h3,
    fontSize: 15,
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkMuted,
    marginTop: 2,
  },
  denied: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.turmericDark,
    textDecorationLine: 'underline',
  },
});
