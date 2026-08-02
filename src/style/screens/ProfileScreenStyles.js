import { StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme/colors';

export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.h1, color: colors.ink, marginBottom: spacing.lg },
  sectionTitle: { ...typography.h2, color: colors.ink, marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { color: colors.inkMuted, fontSize: 14 },
  value: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 16,
    marginTop: 8,
  },
  optionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.border, marginRight: spacing.sm },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  optionText: { fontSize: 14, color: colors.ink, fontWeight: '600' },
  resetBtn: { alignItems: 'center', marginTop: spacing.xl, padding: spacing.sm },
  resetText: { color: colors.chili, fontWeight: '700', fontSize: 13 },
  logoutText: { color: colors.inkMuted, fontWeight: '700', fontSize: 13 },
});
