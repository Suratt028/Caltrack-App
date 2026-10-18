// Noto Sans Thai — loaded via @expo-google-fonts/noto-sans-thai in App.js.
//
// React Native 0.86 exports `Text` as a function component, so the old
// `Text.defaultProps` / `Text.render` tricks no longer work. Instead we expose
// one font file per weight and let the thin `AppText` / `AppTextInput`
// wrappers pick the right family from the requested `fontWeight`.

export const FONT = {
  regular: 'NotoSansThai_400Regular',
  medium: 'NotoSansThai_500Medium',
  semibold: 'NotoSansThai_600SemiBold',
  bold: 'NotoSansThai_700Bold',
};

// The exact assets useFonts() needs to register.
export const FONT_ASSETS = {
  NotoSansThai_400Regular: require('@expo-google-fonts/noto-sans-thai/400Regular/NotoSansThai_400Regular.ttf'),
  NotoSansThai_500Medium: require('@expo-google-fonts/noto-sans-thai/500Medium/NotoSansThai_500Medium.ttf'),
  NotoSansThai_600SemiBold: require('@expo-google-fonts/noto-sans-thai/600SemiBold/NotoSansThai_600SemiBold.ttf'),
  NotoSansThai_700Bold: require('@expo-google-fonts/noto-sans-thai/700Bold/NotoSansThai_700Bold.ttf'),
};

const WEIGHT_TO_FAMILY = {
  100: FONT.regular,
  200: FONT.regular,
  300: FONT.regular,
  400: FONT.regular,
  normal: FONT.regular,
  500: FONT.medium,
  600: FONT.semibold,
  'semibold': FONT.semibold,
  700: FONT.bold,
  bold: FONT.bold,
  800: FONT.bold,
  900: FONT.bold,
};

/**
 * Resolve the Noto Sans Thai family that matches a `fontWeight` value.
 * Falls back to the regular weight.
 */
export function familyForWeight(weight) {
  if (weight == null) return FONT.regular;
  return WEIGHT_TO_FAMILY[String(weight)] || FONT.regular;
}
