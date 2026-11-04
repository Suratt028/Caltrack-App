import { StyleSheet } from 'react-native';
import { colors, spacing, radius, typography, touch } from '../../theme/colors';

export default StyleSheet.create({
  pressed: { opacity: 0.8 },
  block: { marginBottom: spacing.mdl },

  /* identity */
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  identityTile: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: { flex: 1, minWidth: 0 },
  overline: { ...typography.small, fontWeight: '600', color: colors.primaryDark },
  identityName: { ...typography.h2, fontSize: 22, lineHeight: 32, color: colors.ink },
  identityMeta: { ...typography.bodySm, color: colors.inkMuted },
  identityNote: { ...typography.small, color: colors.inkMuted, marginTop: spacing.smd },

  /* fields */
  fieldLabel: { ...typography.bodySm, color: colors.inkMuted, marginBottom: spacing.sm },
  quickRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.smd, marginBottom: spacing.mdl },
  quickChip: {
    minWidth: 52,
    minHeight: touch.min,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickChipActive: { borderColor: colors.primary, backgroundColor: colors.mint },
  quickText: { ...typography.bodyBold, color: colors.ink },
  quickTextActive: { color: colors.primaryDark, fontWeight: '700' },
  hint: { ...typography.small, color: colors.inkMuted, marginTop: spacing.smd, marginBottom: spacing.mdl },

  /* result */
  resultCard: {
    backgroundColor: colors.mint,
    borderRadius: radius.lg,
    padding: spacing.mdl,
    marginBottom: spacing.mdl,
  },
  resultHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  resultLabel: { ...typography.h3, color: colors.ink },
  resultKcal: { ...typography.statMd, color: colors.ink },
  resultTrio: { marginTop: spacing.md },
  detailCard: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  detailHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailTitle: { ...typography.bodyBold, fontWeight: '700', color: colors.ink },
  detailNote: { ...typography.small, color: colors.inkMuted },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { ...typography.bodySm, color: colors.inkMuted },
  detailValue: { ...typography.bodySm, fontWeight: '600', color: colors.ink },

  footnote: { ...typography.small, color: colors.inkMuted, textAlign: 'center', marginTop: spacing.md },
});
