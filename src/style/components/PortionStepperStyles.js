import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/colors';

export default StyleSheet.create({
  fieldLabel: {
    ...typography.label,
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignSelf: 'flex-start',
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 11,
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
    width: 64,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: colors.ink,
  },
  unit: {
    ...typography.body,
    color: colors.inkMuted,
    paddingHorizontal: 6,
  },
});
