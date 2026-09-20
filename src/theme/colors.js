// Design tokens for CalTrack
// Warm cream + green palette inspired by the interactive mockup.

export const colors = {
  // Base
  bg: '#FBF1E6',
  surface: '#FFFFFF',
  surfaceMuted: '#F6EFE4',
  border: '#ECE1D2',

  // Ink
  ink: '#2B2420',
  inkMuted: '#7A7169',
  inkFaint: '#B0A79C',

  // Brand
  primary: '#2F8F6B',
  primaryDark: '#216B4F',
  primarySoft: '#DDF1E6',

  // Accents
  turmeric: '#C08A3E',
  turmericSoft: '#F5E8D3',
  chili: '#F08A73',
  chiliSoft: '#FBE2DA',
  sky: '#4C8FC0',
  skySoft: '#DCEAF7',
  peach: '#F7D9B9',
  peachSoft: '#FCEEDD',

  // Macro colors
  protein: '#2F8F6B',
  carbs: '#C08A3E',
  fat: '#4C8FC0',

  white: '#FFFFFF',
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 26,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  display: { fontSize: 34, fontWeight: '800', letterSpacing: -0.4 },
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.2 },
  h2: { fontSize: 20, fontWeight: '700', letterSpacing: -0.1 },
  body: { fontSize: 15, fontWeight: '400' },
  bodyBold: { fontSize: 15, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '600', letterSpacing: 0.6 },
  stat: { fontSize: 42, fontWeight: '800', letterSpacing: -0.8 },
};

export default { colors, radius, spacing, typography };
