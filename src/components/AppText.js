import React from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { FONT, familyForWeight } from '../theme/fonts';

/**
 * Drop-in replacement for React Native's `Text` that applies the Noto Sans Thai
 * family globally. The correct weight file is selected from `fontWeight`, and
 * the numeric weight is stripped so the engine does not synthesise a second
 * bold on top of an already-bold font file.
 */
const AppText = React.forwardRef(function AppText(
  { style, ...props },
  ref
) {
  const flat = StyleSheet.flatten(style) || {};
  const family = flat.fontFamily || familyForWeight(flat.fontWeight);
  const nextStyle = { ...flat, fontFamily: family };
  delete nextStyle.fontWeight;

  return <RNText ref={ref} {...props} style={nextStyle} />;
});

export default AppText;
export { AppText as Text, FONT };
