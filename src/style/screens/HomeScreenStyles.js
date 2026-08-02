import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme/colors';

export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  eyebrow: { ...typography.caption, color: colors.inkFaint, textTransform: 'uppercase' },
  dateTitle: { ...typography.h1, color: colors.ink, marginBottom: spacing.lg, textTransform: 'capitalize' },
  ringCard: { alignItems: 'center', paddingVertical: spacing.lg },
  ringFooter: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
  ringStat: { alignItems: 'center', paddingHorizontal: spacing.lg },
  ringStatValue: { fontSize: 20, fontWeight: '800', color: colors.ink },
  ringStatLabel: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  ringStatDivider: { width: 1, height: 32, backgroundColor: colors.border },
  actionsRow: { flexDirection: 'row', marginTop: spacing.lg },
  sectionTitle: { ...typography.h2, color: colors.ink, marginBottom: spacing.md },
  mealsHeader: { marginTop: spacing.lg, marginBottom: spacing.xs },
  emptyText: { color: colors.inkMuted, fontSize: 13, textAlign: 'center', paddingVertical: spacing.sm },
});
