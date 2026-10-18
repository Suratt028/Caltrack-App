import React from 'react';
import { TextInput as RNTextInput, StyleSheet } from 'react-native';
import { FONT, familyForWeight } from '../theme/fonts';

/**
 * Drop-in replacement for React Native's `TextInput` that applies the Noto
 * Sans Thai family and picks the matching weight file.
 */
const AppTextInput = React.forwardRef(function AppTextInput(
  { style, ...props },
  ref
) {
  const flat = StyleSheet.flatten(style) || {};
  const family = flat.fontFamily || familyForWeight(flat.fontWeight);
  const nextStyle = { ...flat, fontFamily: family };
  delete nextStyle.fontWeight;

  return <RNTextInput ref={ref} {...props} style={nextStyle} />;
});

export default AppTextInput;
export { AppTextInput as TextInput, FONT };
