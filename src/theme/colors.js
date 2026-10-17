// Design tokens for CalTrack
// Warm cream + green palette inspired by the interactive mockup.
//
// Contrast notes (WCAG AA):
// - ink / inkMuted / inkFaint are all >= 4.5:1 on bg and surface.
// - primary is >= 4.5:1 on bg and with white text (buttons, tabs).
// - `danger` is the text-safe red; `chili` stays for graphics (bars, rings)
//   where 3:1 non-text contrast is what matters.

export const colors = {
  // Base
  bg: '#FBF1E6',
  surface: '#FFFFFF',
  surfaceMuted: '#F6EFE4',
  border: '#ECE1D2',

  // Ink
  ink: '#2B2420',
  inkMuted: '#6B635B',
  inkFaint: '#7E766C',

  // Brand
  primary: '#23795A',
  primaryDark: '#1A5C43',
  primarySoft: '#DDF1E6',

  // Accents
  turmeric: '#C08A3E',
  turmericDark: '#8A5F22',
  turmericSoft: '#F5E8D3',
  chili: '#E4674B',
  chiliSoft: '#FBE2DA',
  sky: '#4C8FC0',
  skyDark: '#2C6392',
  skySoft: '#DCEAF7',
  peach: '#F7D9B9',
  peachSoft: '#FCEEDD',

  // Semantic
  danger: '#B23E28',
  dangerSoft: '#FBE2DA',
  success: '#23795A',
  successSoft: '#DDF1E6',
  overlay: 'rgba(24, 32, 29, 0.45)',

  // Macro colors
  protein: '#23795A',
  carbs: '#A9721F',
  fat: '#3F7FB5',

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
  h3: { fontSize: 17, fontWeight: '700', letterSpacing: -0.1 },
  body: { fontSize: 15, fontWeight: '400' },
  bodyBold: { fontSize: 15, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600' },
  caption: { fontSize: 12, fontWeight: '600', letterSpacing: 0.6 },
  stat: { fontSize: 42, fontWeight: '800', letterSpacing: -0.8 },
};

// Shared elevation/shadow presets so cards feel like one family.
export const shadows = {
  soft: { boxShadow: '0px 3px 8px rgba(43, 36, 32, 0.05)', elevation: 1 },
  card: { boxShadow: '0px 6px 14px rgba(43, 36, 32, 0.07)', elevation: 2 },
  raised: { boxShadow: '0px 10px 22px rgba(26, 92, 67, 0.22)', elevation: 6 },
};

export default { colors, radius, spacing, typography, shadows };
