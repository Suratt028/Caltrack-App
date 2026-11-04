import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/colors';

export default StyleSheet.create({
  fieldLabel: {
    ...typography.bodySm,
    color: colors.inkMuted,
    marginBottom: spacing.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: 6,
    minHeight: 60,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  button: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    backgroundColor: colors.mint,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: spacing.sm,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: colors.ink,
    outlineStyle: 'none',
  },
  unit: {
    ...typography.body,
    color: colors.inkMuted,
    paddingHorizontal: 6,
  },
});
