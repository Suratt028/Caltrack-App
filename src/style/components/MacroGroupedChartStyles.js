import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/colors';

const PAD_LEFT = 34;

export default StyleSheet.create({
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendSwatch: {
    width: 9,
    height: 9,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: colors.inkMuted,
  },
  canvas: {
    width: '100%',
    minHeight: 170,
    position: 'relative',
  },
  // Layers: band (0) < bars (1) < invisible hover targets (2) < popup (10).
  svgLayer: {
    position: 'relative',
    zIndex: 1,
  },
  hitTargets: {
    position: 'absolute',
    left: PAD_LEFT,
    top: 0,
    height: 170,
    flexDirection: 'row',
    zIndex: 2,
  },
  hitTarget: {
    flex: 1,
  },

  band: {
    position: 'absolute',
    zIndex: 0,
    borderRadius: 6,
    backgroundColor: colors.surfaceMuted,
  },

  // Hover / tap popup (matches the web dashboard's daily calorie tooltip)
  tooltipWrap: {
    position: 'absolute',
    top: 0,
    zIndex: 10,
  },
  tooltip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: colors.ink,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  tooltipDate: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  tooltipMuted: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.inkMuted,
  },
  tooltipKcal: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  tooltipStatus: {
    fontSize: 13,
    color: colors.inkMuted,
  },
  tooltipStatusOver: {
    color: colors.turmericDark,
  },
  tooltipMacros: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  tooltipMacro: {
    flex: 1,
    minWidth: 0,
  },
  tooltipMacroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tooltipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tooltipMacroValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  tooltipMacroGoal: {
    fontSize: 12,
    color: colors.inkFaint,
  },
});
