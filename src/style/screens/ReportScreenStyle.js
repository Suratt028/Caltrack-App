import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme/colors';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg || colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backBtn: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.ink,
  },
  content: {
    padding: spacing.lg,
    paddingHorizontal: spacing.lg + 15,
    paddingTop: spacing.lg + 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.inkMuted || colors.inkLight,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: 14,
    backgroundColor: colors.surface,
    color: colors.ink,
  },
  textArea: {
    minHeight: 100,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  emptyText: {
    color: colors.inkFaint || colors.inkMuted,
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
  },
  ticketCard: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.md,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  ticketId: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.inkFaint || colors.inkMuted,
  },
  ticketTopic: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  ticketDetail: {
    fontSize: 13,
    color: colors.inkMuted || colors.inkLight,
    marginTop: 2,
  },
  ticketDate: {
    fontSize: 11,
    color: colors.inkFaint || colors.inkMuted,
    marginTop: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
