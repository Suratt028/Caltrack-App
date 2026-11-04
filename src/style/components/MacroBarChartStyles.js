import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme/colors';

export default StyleSheet.create({
  wrap: { width: '100%' },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.smd,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendText: { ...typography.small, color: colors.inkMuted },
  canvas: { width: '100%', minHeight: 190, alignItems: 'flex-start' },
  // Visually hidden but still announced by screen readers.
  srOnly: { position: 'absolute', left: 0, top: 0, opacity: 0, fontSize: 11, lineHeight: 14 },
});
