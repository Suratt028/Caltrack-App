import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/colors';

export default StyleSheet.create({
  title: {
    ...typography.h3,
    color: colors.ink,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkMuted,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  stripHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  stripLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  stripMissed: {
    fontSize: 13,
    color: colors.turmericDark,
  },
  strip: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: spacing.md,
  },
  dot: {
    flex: 1,
    height: 10,
    borderRadius: 5,
  },
  dotOn: {
    backgroundColor: colors.primary,
  },
  dotOff: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  scenarios: {
    gap: spacing.sm,
  },
  scenariosRow: {
    flexDirection: 'row',
  },
  scenario: {
    flex: 1,
    minWidth: 0,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  scenarioPrimary: {
    borderColor: colors.primary,
    backgroundColor: colors.mint,
  },
  scenarioEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  scenarioHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  scenarioTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  scenarioWeight: {
    fontSize: 28,
    lineHeight: 38,
    fontWeight: '800',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  scenarioUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  chip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginTop: 2,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  scenarioRange: {
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  scenarioCaption: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkMuted,
    marginTop: 2,
  },
  note: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkMuted,
    marginTop: spacing.md,
  },
});
