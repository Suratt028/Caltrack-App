import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export default StyleSheet.create({
  row: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '700', color: colors.ink },
  value: { fontSize: 13, fontWeight: '600', color: colors.inkMuted },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4 },
});
