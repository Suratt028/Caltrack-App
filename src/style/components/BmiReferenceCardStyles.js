import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/colors';

export default StyleSheet.create({
  title: {
    ...typography.h3,
    color: colors.ink,
    marginBottom: spacing.sm,
  },

  // Figure + value
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  figureStage: {
    width: 128,
    height: 220,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    minWidth: 0,
  },
  valueLabel: {
    fontSize: 13,
    color: colors.inkMuted,
  },
  value: {
    fontSize: 48,
    lineHeight: 60,
    fontWeight: '800',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  unit: {
    fontSize: 13,
    color: colors.inkFaint,
    marginTop: -4,
    marginBottom: spacing.sm,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
  },
  healthyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: spacing.md,
  },
  healthyText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkMuted,
  },
  healthyStrong: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
    fontVariant: ['tabular-nums'],
  },

  // Zone band
  band: {
    marginBottom: spacing.md,
  },
  bandNames: {
    flexDirection: 'row',
    marginTop: 6,
  },
  bandName: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    color: colors.inkMuted,
  },

  // Advice
  hintBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  hintIcon: {
    marginTop: 1,
  },
  hintText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: colors.inkMuted,
  },
  note: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkMuted,
    marginTop: spacing.sm,
  },
});
