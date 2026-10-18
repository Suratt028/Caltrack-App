import { StyleSheet } from 'react-native';
import { colors, radius, spacing, shadows } from '../../theme/colors';

export default StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: spacing.sm,
    ...shadows.soft,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  meta: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 1,
  },
  subtitle: {
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 1,
  },
  kcal: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.ink,
    marginLeft: spacing.sm,
  },
  kcalUnit: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.inkMuted,
  },
  removeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    marginLeft: spacing.xs,
  },
  removeBtnPressed: {
    opacity: 0.7,
  },
});
