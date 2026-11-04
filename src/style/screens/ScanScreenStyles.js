import { StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme/colors';

export default StyleSheet.create({
  pressed: { opacity: 0.9 },
  block: { marginBottom: spacing.mdl },
  actions: { gap: spacing.smd, marginBottom: spacing.mdl },
  fieldLabel: { ...typography.bodySm, color: colors.inkMuted, marginBottom: spacing.sm },
  cardTitle: { ...typography.h3, color: colors.ink },
  cardBody: { ...typography.body, color: colors.inkMuted, marginTop: spacing.sm },

  /* capture */
  viewfinder: {
    backgroundColor: colors.primaryDark,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.mdl,
  },
  viewfinderFrame: {
    minHeight: 240,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: 'rgba(230, 240, 231, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  viewfinderIcon: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.mdl,
  },
  viewfinderTitle: { ...typography.h2, color: colors.white, textAlign: 'center' },
  viewfinderText: { ...typography.bodySm, color: 'rgba(255, 255, 255, 0.82)', marginTop: spacing.xs },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.smd, marginTop: spacing.smd },
  tipText: { ...typography.body, color: colors.inkMuted, flex: 1 },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smd,
    minHeight: 44,
    marginBottom: spacing.sm,
  },
  consentText: { ...typography.bodySm, color: colors.inkMuted, flex: 1 },
  footnote: { ...typography.small, color: colors.inkMuted, textAlign: 'center', marginTop: spacing.md },

  /* photo */
  photoWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    maxHeight: 420,
    alignSelf: 'center',
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    marginBottom: spacing.smd,
  },
  photo: { width: '100%', height: '100%' },
  photoCaption: { ...typography.small, color: colors.inkMuted, textAlign: 'center', marginBottom: spacing.mdl },
  box: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.white,
    borderRadius: radius.xs,
    pointerEvents: 'none',
  },
  boxLabel: {
    alignSelf: 'flex-start',
    minWidth: 24,
    textAlign: 'center',
    backgroundColor: colors.primary,
    color: colors.white,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },

  /* analyzing */
  analyzingBox: { alignItems: 'center', paddingVertical: spacing.lg },
  analyzingTitle: { ...typography.h2, color: colors.ink, textAlign: 'center', marginTop: spacing.mdl },
  analyzingText: { ...typography.body, color: colors.inkMuted, textAlign: 'center', marginTop: spacing.sm },

  /* recovery */
  tipsCard: { marginTop: spacing.xs },
});
