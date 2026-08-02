import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme/colors';

export default StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  name: { fontSize: 14, fontWeight: '700', color: colors.ink },
  subtitle: { fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  kcal: { fontSize: 13, fontWeight: '700', color: colors.primary, marginLeft: spacing.sm },
  removeBtn: { marginLeft: spacing.sm, paddingHorizontal: 8, paddingVertical: 4 },
  removeText: { fontSize: 12, fontWeight: '700', color: colors.chili },
});
