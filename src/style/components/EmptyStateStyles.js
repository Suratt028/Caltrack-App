import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme/colors';

export default StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  wrapLg: {
    paddingVertical: spacing.xl,
  },
  iconTile: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.smd,
  },
  iconTileLg: {
    width: 112,
    height: 112,
    borderRadius: radius.xl + 4,
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.h3,
    color: colors.ink,
    textAlign: 'center',
  },
  titleLg: {
    ...typography.h1,
    fontSize: 24,
    lineHeight: 36,
  },
  message: {
    ...typography.body,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 420,
  },
  actions: {
    alignSelf: 'stretch',
    gap: spacing.smd,
    marginTop: spacing.lg,
  },
});
