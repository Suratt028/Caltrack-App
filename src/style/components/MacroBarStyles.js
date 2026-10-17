import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export default StyleSheet.create({
  row: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '700', color: colors.ink },
  value: { fontSize: 12, fontWeight: '600', color: colors.inkMuted },
  valueStrong: { color: colors.ink, fontWeight: '800', fontSize: 13 },
  valueOver: { color: colors.danger },
  track: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 5 },
  overHint: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: colors.danger,
  },
});
