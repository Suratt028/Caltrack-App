import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme/colors';

export default StyleSheet.create({
  fieldLabel: {
    ...typography.label,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    minHeight: 40,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  chipPressed: {
    opacity: 0.85,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.inkMuted,
  },
  chipTextActive: {
    color: colors.primaryDark,
  },
});
