import { StyleSheet } from 'react-native';
import { colors, radius, spacing, shadows, touch, typography } from '../../theme/colors';

export default StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingLeft: spacing.mdl,
    paddingRight: spacing.sm,
    marginBottom: spacing.smd,
    ...shadows.soft,
  },
  body: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  meta: {
    ...typography.small,
    color: colors.inkMuted,
  },
  name: {
    ...typography.h3,
    color: colors.ink,
  },
  subtitle: {
    ...typography.bodySm,
    color: colors.inkMuted,
  },
  kcalCol: {
    alignItems: 'flex-end',
    marginLeft: spacing.smd,
  },
  kcal: {
    ...typography.statSm,
    fontSize: 20,
    color: colors.ink,
  },
  kcalUnit: {
    ...typography.small,
    color: colors.inkMuted,
  },
  removeBtn: {
    width: touch.min,
    height: touch.min,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  removeBtnPressed: {
    backgroundColor: colors.surfaceMuted,
  },
});
