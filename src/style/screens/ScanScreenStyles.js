import { StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../../theme/colors';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  title: {
    ...typography.h1,
    color: colors.ink,
    marginBottom: 6,
  },

  subtitle: {
    ...typography.body,
    color: colors.inkMuted,
    marginBottom: spacing.lg,
  },

  actionsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },

  imageCard: {
    padding: 0,
    overflow: 'hidden',
  },

  image: {
    width: '100%',
    height: 220,
    borderRadius: radius.md,
  },

  analyzingBox: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },

  analyzingText: {
    marginTop: spacing.md,
    color: colors.inkMuted,
    fontWeight: '600',
  },

  demoTag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.turmericSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: spacing.sm,
  },

  demoTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },

  resultConfidence: {
    fontSize: 12,
    color: colors.inkMuted,
    marginBottom: spacing.md,
  },

  fieldLabel: {
    ...typography.bodyBold,
    color: colors.ink,
    marginBottom: 6,
    marginTop: spacing.xs,
  },

  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: spacing.sm,
  },

  macroInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  macroInputCol: {
    flex: 1,
  },

  mealRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },

  mealChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
  },

  mealChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },

  mealChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkMuted,
  },

  mealChipTextActive: {
    color: colors.primaryDark,
  },
});