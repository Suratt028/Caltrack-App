import { StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme/colors';

export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl, flexGrow: 1, justifyContent: 'center' },
  eyebrow: { ...typography.caption, color: colors.primary, textTransform: 'uppercase', marginBottom: spacing.sm },
  title: { ...typography.display, color: colors.ink, marginBottom: 6 },
  subtitle: { ...typography.body, color: colors.inkMuted, marginBottom: spacing.lg },
  fieldLabel: { ...typography.bodyBold, color: colors.ink, marginBottom: 8, marginTop: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
  errorBox: {
    backgroundColor: colors.chiliSoft,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  errorText: { color: colors.chili, fontSize: 13, fontWeight: '600' },
  switchRow: { alignItems: 'center', marginTop: spacing.lg, padding: spacing.sm },
  switchText: { fontSize: 13, color: colors.inkMuted },
  switchLink: { color: colors.primary, fontWeight: '700' },
});
