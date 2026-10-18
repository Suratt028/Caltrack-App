import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme/colors';

export default StyleSheet.create({
  track: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: radius.button,
    backgroundColor: colors.mint,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentSm: {
    minHeight: 36,
  },
  segmentSelected: {
    backgroundColor: colors.card,
    boxShadow: '0px 4px 16px rgba(31, 58, 47, 0.06)',
    elevation: 1,
  },
  segmentPressed: {
    opacity: 0.75,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.inkMuted,
  },
  segmentTextSm: {
    fontSize: 12.5,
  },
  segmentTextSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
});
